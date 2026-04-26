import { LogSearchEngine } from '../../src/search/LogSearchEngine';
import { IndexableLog } from '../../src/search/types';

describe('LogSearchEngine', () => {
  let engine: LogSearchEngine;

  const sampleLogs: IndexableLog[] = [
    {
      id: 'log-1',
      interfaceId: 'ifc-rest-fss',
      timestamp: '2026-04-25T14:30:00Z',
      status: 'FAILURE',
      level: 'ERROR',
      errorMessage: 'Connection timeout: 금감원 서버 응답 없음',
      requestPayload: '{"type":"disclosure"}',
      responsePayload: '',
      metadata: '{"correlationId":"corr-001"}',
    },
    {
      id: 'log-2',
      interfaceId: 'ifc-mq-stock',
      timestamp: '2026-04-25T15:00:00Z',
      status: 'SUCCESS',
      level: 'INFO',
      errorMessage: '',
      requestPayload: '{"symbol":"005930"}',
      responsePayload: '{"price":72000}',
      metadata: '{"correlationId":"corr-002"}',
    },
    {
      id: 'log-3',
      interfaceId: 'ifc-mq-stock',
      timestamp: '2026-04-25T15:05:00Z',
      status: 'FAILURE',
      level: 'ERROR',
      errorMessage: 'MQ broker connection refused: 증권사 서버 5xx',
      requestPayload: '{"symbol":"000660"}',
      responsePayload: '',
      metadata: '{"correlationId":"corr-003"}',
    },
  ];

  beforeEach(() => {
    engine = new LogSearchEngine();
    engine.indexLogs(sampleLogs);
  });

  test('search by keyword returns matching logs', () => {
    const results = engine.search('timeout');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('log-1');
  });

  test('search by Korean keyword returns matching logs', () => {
    const results = engine.search('증권사');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === 'log-3')).toBe(true);
  });

  test('search returns empty for unrelated query', () => {
    const results = engine.search('blockchain');
    expect(results.length).toBe(0);
  });

  test('addLog indexes a new log and makes it searchable', () => {
    engine.addLog({
      id: 'log-4',
      interfaceId: 'ifc-batch-settle',
      timestamp: '2026-04-25T23:00:00Z',
      status: 'FAILURE',
      level: 'ERROR',
      errorMessage: '정산 배치 실패: 디스크 공간 부족',
      requestPayload: '{}',
      responsePayload: '',
      metadata: '{}',
    });
    const results = engine.search('정산');
    expect(results.some((r) => r.id === 'log-4')).toBe(true);
  });

  test('removeLog removes a log from the index', () => {
    engine.removeLog('log-1');
    const results = engine.search('timeout');
    expect(results.every((r) => r.id !== 'log-1')).toBe(true);
  });
});
