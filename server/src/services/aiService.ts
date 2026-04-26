import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { RCAResult, StructuredQuery } from '../models/types';

const structuredQuerySchema = z.object({
  filters: z.object({
    interfaceId: z.string().optional(),
    protocol: z.enum(['REST', 'SOAP', 'MQ', 'BATCH', 'SFTP']).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING']).optional(),
    level: z.enum(['INFO', 'WARN', 'ERROR']).optional(),
    counterparty: z.string().optional(),
    errorMessageContains: z.string().optional(),
  }),
  timeRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  sort: z
    .object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    })
    .optional(),
  limit: z.number().optional(),
});

const rcaResultSchema = z.object({
  transactionId: z.string(),
  causes: z.array(
    z.object({
      rank: z.number(),
      description: z.string(),
      evidence: z.string(),
    })
  ),
  recommendation: z.string(),
  impactScope: z.string(),
  confidence: z.number().min(0).max(1),
});

interface IndexSchema {
  interfaces: string[];
  protocols: string[];
  statuses: string[];
  levels: string[];
  counterparties: string[];
}

interface RCAContext {
  id: string;
  interfaceId: string;
  interfaceName: string;
  status: string;
  errorMessage: string | null;
  stackTrace: string | null;
  requestPayload: string;
  responsePayload: string;
  recentRelatedLogs: Array<{ timestamp: string; status: string; errorMessage: string | null }>;
}

export interface AIServiceConfig {
  provider: 'anthropic' | 'gemini';
  indexSchema: IndexSchema;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  geminiModel?: string;
}

interface AIProvider {
  generateJson(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<unknown>;
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateJson(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<unknown> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return parseJsonSafe(text);
  }
}

class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generateJson(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<unknown> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: maxTokens,
      },
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    return parseJsonSafe(text);
  }
}

function stripJsonCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const lines = trimmed.split('\n');
  const body = lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : lines.length);
  return body.join('\n').trim();
}

function parseJsonSafe(text: string): unknown {
  const normalized = stripJsonCodeFence(text);

  try {
    return JSON.parse(normalized);
  } catch {
    const match = normalized.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('AI did not return valid JSON');
    }
    return JSON.parse(match[0]);
  }
}

export class AIService {
  private provider: AIProvider;
  private indexSchema: IndexSchema;

  constructor(apiKey: string, indexSchema: IndexSchema);
  constructor(config: AIServiceConfig);
  constructor(apiKeyOrConfig: string | AIServiceConfig, indexSchemaMaybe?: IndexSchema) {
    if (typeof apiKeyOrConfig === 'string') {
      if (!indexSchemaMaybe) {
        throw new Error('indexSchema is required when passing apiKey directly');
      }
      this.indexSchema = indexSchemaMaybe;
      this.provider = new AnthropicProvider(apiKeyOrConfig);
      return;
    }

    this.indexSchema = apiKeyOrConfig.indexSchema;

    if (apiKeyOrConfig.provider === 'gemini') {
      if (!apiKeyOrConfig.geminiApiKey?.trim()) {
        throw new Error('GEMINI_API_KEY is required when provider=gemini');
      }
      this.provider = new GeminiProvider(
        apiKeyOrConfig.geminiApiKey,
        apiKeyOrConfig.geminiModel || 'gemini-2.5-flash'
      );
      return;
    }

    if (!apiKeyOrConfig.anthropicApiKey?.trim()) {
      throw new Error('ANTHROPIC_API_KEY is required when provider=anthropic');
    }
    this.provider = new AnthropicProvider(apiKeyOrConfig.anthropicApiKey);
  }

  async convertNLToQuery(userQuestion: string): Promise<StructuredQuery> {
    const now = new Date().toISOString();
    const systemPrompt = `You are a log search assistant for a financial IT interface management platform.
Convert the user's natural language question into a structured JSON query.

Available schema:
- interface IDs: ${JSON.stringify(this.indexSchema.interfaces)}
- protocols: ${JSON.stringify(this.indexSchema.protocols)}
- statuses: ${JSON.stringify(this.indexSchema.statuses)}
- log levels: ${JSON.stringify(this.indexSchema.levels)}
- counterparties: ${JSON.stringify(this.indexSchema.counterparties)}

Current time: ${now}

Output ONLY valid JSON matching this structure:
{
  "filters": {
    "interfaceId?": "string",
    "protocol?": "REST|SOAP|MQ|BATCH|SFTP",
    "status?": "SUCCESS|FAILURE|TIMEOUT|PENDING",
    "level?": "INFO|WARN|ERROR",
    "counterparty?": "string",
    "errorMessageContains?": "string"
  },
  "timeRange?": { "from": "ISO8601", "to": "ISO8601" },
  "sort?": { "field": "timestamp|duration_ms", "order": "asc|desc" },
  "limit?": number
}`;

    const parsed = await this.provider.generateJson(systemPrompt, userQuestion, 1024);
    return structuredQuerySchema.parse(parsed);
  }

  async analyzeRCA(context: RCAContext): Promise<RCAResult> {
    const systemPrompt = `You are an AI operations analyst for a financial IT interface platform.
Analyze the failed transaction and provide root cause analysis.

Output ONLY valid JSON:
{
  "transactionId": "string",
  "causes": [{"rank": 1, "description": "string", "evidence": "string"}],
  "recommendation": "string",
  "impactScope": "string",
  "confidence": 0.0-1.0
}`;

    const userMessage = `## Failed Transaction Analysis

**Transaction ID:** ${context.id}
**Interface:** ${context.interfaceName} (${context.interfaceId})
**Status:** ${context.status}

### Error Message
${context.errorMessage || 'N/A'}

### Stack Trace
${context.stackTrace || 'N/A'}

### Request Payload
${context.requestPayload}

### Response Payload
${context.responsePayload}

### Recent Related Logs (last 5 minutes)
${context.recentRelatedLogs.map((l) => `[${l.timestamp}] ${l.status} - ${l.errorMessage || 'OK'}`).join('\n') || 'None'}`;

    const parsed = await this.provider.generateJson(systemPrompt, userMessage, 2048);
    return rcaResultSchema.parse(parsed);
  }
}
