import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  AI_PROVIDER: z.enum(['gemini', 'anthropic']).default('gemini'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  SIMULATOR_ENABLED: z.enum(['true', 'false']).default('true'),
  SIMULATOR_INTERVAL_MS: z.coerce.number().default(1000),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.parse(process.env);

    if (parsed.AI_PROVIDER === 'anthropic' && !parsed.ANTHROPIC_API_KEY.trim()) {
      throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
    }
    if (parsed.AI_PROVIDER === 'gemini' && !parsed.GEMINI_API_KEY.trim()) {
      throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
    }

    cached = parsed;
  }

  return cached;
}
