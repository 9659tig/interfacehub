import { AIService } from '../../src/services/aiService';
import { RCAResult, StructuredQuery } from '../../src/models/types';

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  };
});

describe('AIService', () => {
  let service: AIService;

  const INDEX_SCHEMA = {
    interfaces: ['ifc-rest-fss', 'ifc-rest-bank', 'ifc-mq-stock', 'ifc-batch-settle'],
    protocols: ['REST', 'SOAP', 'MQ', 'BATCH', 'SFTP'],
    statuses: ['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING'],
    levels: ['INFO', 'WARN', 'ERROR'],
    counterparties: ['금감원', 'KB은행', 'KB증권', '자체(내부)'],
  };

  beforeEach(() => {
    mockCreate.mockReset();
    service = new AIService('test-key', INDEX_SCHEMA);
  });

  describe('convertNLToQuery', () => {
    test('converts natural language to StructuredQuery', async () => {
      const mockResponse: StructuredQuery = {
        filters: { status: 'FAILURE', protocol: 'MQ' },
        timeRange: { from: '2026-04-25T00:00:00Z', to: '2026-04-25T23:59:59Z' },
        limit: 50,
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
      });

      const result = await service.convertNLToQuery('어제 실패한 MQ 건 보여줘');
      expect(result.filters.status).toBe('FAILURE');
      expect(result.filters.protocol).toBe('MQ');
    });

    test('throws on invalid AI response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json' }],
      });

      await expect(service.convertNLToQuery('test')).rejects.toThrow();
    });
  });

  describe('analyzeRCA', () => {
    test('returns RCA result with causes and confidence', async () => {
      const mockRCA: RCAResult = {
        transactionId: 'log-1',
        causes: [{ rank: 1, description: '외부 서버 응답 지연', evidence: '5xx 응답 23건' }],
        recommendation: '30분 후 재처리 큐에 등록',
        impactScope: '약 1,200건의 시세 데이터 동기화 지연',
        confidence: 0.85,
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockRCA) }],
      });

      const result = await service.analyzeRCA({
        id: 'log-1',
        interfaceId: 'ifc-mq-stock',
        interfaceName: '증권사 시세 MQ',
        status: 'FAILURE',
        errorMessage: 'MQ broker connection refused',
        stackTrace: 'Error: ECONNREFUSED at...',
        requestPayload: '{"symbol":"005930"}',
        responsePayload: '',
        recentRelatedLogs: [],
      });

      expect(result.causes).toHaveLength(1);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.recommendation).toBeTruthy();
    });
  });
});
