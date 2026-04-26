import Database from 'better-sqlite3';
import { LogService } from '../../src/services/logService';

describe('LogService', () => {
  let db: Database.Database;
  let service: LogService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE interfaces (
        id TEXT PRIMARY KEY, name TEXT, protocol TEXT, direction TEXT,
        counterparty TEXT, endpoint TEXT, description TEXT DEFAULT '',
        status TEXT DEFAULT 'ACTIVE', created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE transaction_logs (
        id TEXT PRIMARY KEY, interface_id TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'INFO',
        duration_ms INTEGER NOT NULL DEFAULT 0,
        request_payload TEXT DEFAULT '{}', response_payload TEXT DEFAULT '{}',
        error_message TEXT, stack_trace TEXT, metadata TEXT DEFAULT '{}'
      );
      INSERT INTO interfaces (id, name, protocol, direction, counterparty, endpoint)
      VALUES ('ifc-1', 'Test', 'REST', 'INBOUND', 'Test Corp', 'https://test.com');
    `);
    service = new LogService(db);
  });

  afterEach(() => db.close());

  test('insert and getById returns log', () => {
    service.insert({
      id: 'log-1',
      interfaceId: 'ifc-1',
      status: 'SUCCESS',
      level: 'INFO',
      durationMs: 120,
      requestPayload: '{}',
      responsePayload: '{"ok":true}',
      errorMessage: null,
      stackTrace: null,
      metadata: '{}',
    });
    const log = service.getById('log-1');
    expect(log).toBeDefined();
    expect(log?.status).toBe('SUCCESS');
  });

  test('queryByFilters returns filtered logs', () => {
    service.insert({
      id: 'log-1',
      interfaceId: 'ifc-1',
      status: 'SUCCESS',
      level: 'INFO',
      durationMs: 120,
      requestPayload: '{}',
      responsePayload: '{}',
      errorMessage: null,
      stackTrace: null,
      metadata: '{}',
    });
    service.insert({
      id: 'log-2',
      interfaceId: 'ifc-1',
      status: 'FAILURE',
      level: 'ERROR',
      durationMs: 5000,
      requestPayload: '{}',
      responsePayload: '{}',
      errorMessage: 'timeout',
      stackTrace: 'Error at line 42',
      metadata: '{}',
    });
    const failures = service.queryByFilters({ status: 'FAILURE' });
    expect(failures).toHaveLength(1);
    expect(failures[0].id).toBe('log-2');
  });

  test('getStats returns correct counts', () => {
    service.insert({
      id: 'log-1',
      interfaceId: 'ifc-1',
      status: 'SUCCESS',
      level: 'INFO',
      durationMs: 100,
      requestPayload: '{}',
      responsePayload: '{}',
      errorMessage: null,
      stackTrace: null,
      metadata: '{}',
    });
    service.insert({
      id: 'log-2',
      interfaceId: 'ifc-1',
      status: 'FAILURE',
      level: 'ERROR',
      durationMs: 5000,
      requestPayload: '{}',
      responsePayload: '{}',
      errorMessage: 'err',
      stackTrace: null,
      metadata: '{}',
    });
    const stats = service.getStatsByInterface('ifc-1');
    expect(stats.total).toBe(2);
    expect(stats.success).toBe(1);
    expect(stats.failure).toBe(1);
  });
});
