import Database from 'better-sqlite3';
import { LogSearchEngine } from '../../src/search/LogSearchEngine';
import { LogService } from '../../src/services/logService';
import { TransactionSimulator } from '../../src/simulator/TransactionSimulator';

describe('TransactionSimulator', () => {
  let db: Database.Database;
  let logService: LogService;
  let searchEngine: LogSearchEngine;
  let simulator: TransactionSimulator;

  const interfaces = [
    { id: 'ifc-1', name: 'Test REST', protocol: 'REST', counterparty: '금감원' },
    { id: 'ifc-2', name: 'Test MQ', protocol: 'MQ', counterparty: 'KB증권' },
  ];

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE interfaces (
        id TEXT PRIMARY KEY, name TEXT, protocol TEXT, direction TEXT,
        counterparty TEXT, endpoint TEXT, description TEXT DEFAULT '',
        status TEXT DEFAULT 'ACTIVE', created_at TEXT, updated_at TEXT
      );
      CREATE TABLE transaction_logs (
        id TEXT PRIMARY KEY, interface_id TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'INFO', duration_ms INTEGER DEFAULT 0,
        request_payload TEXT DEFAULT '{}', response_payload TEXT DEFAULT '{}',
        error_message TEXT, stack_trace TEXT, metadata TEXT DEFAULT '{}'
      );
      INSERT INTO interfaces VALUES ('ifc-1','Test REST','REST','INBOUND','금감원','https://test.com','',
        'ACTIVE',datetime('now'),datetime('now'));
      INSERT INTO interfaces VALUES ('ifc-2','Test MQ','MQ','INBOUND','KB증권','mq://test','',
        'ACTIVE',datetime('now'),datetime('now'));
    `);
    logService = new LogService(db);
    searchEngine = new LogSearchEngine();
    simulator = new TransactionSimulator(logService, searchEngine, interfaces);
  });

  afterEach(() => {
    simulator.stop();
    db.close();
  });

  test('generateOne creates a valid transaction log', () => {
    const log = simulator.generateOne();
    expect(log.id).toBeTruthy();
    expect(interfaces.map((i) => i.id)).toContain(log.interfaceId);
    expect(['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING']).toContain(log.status);
  });

  test('tick inserts a log into DB and search engine', () => {
    simulator.tick();
    const stats = logService.getStatsByInterface('ifc-1');
    const stats2 = logService.getStatsByInterface('ifc-2');
    expect(stats.total + stats2.total).toBe(1);
    expect(searchEngine.size).toBe(1);
  });

  test('generates error spike pattern', () => {
    simulator.setErrorSpikeInterface('ifc-2');
    const logs = Array.from({ length: 20 }, () => simulator.generateOne());
    const mqErrors = logs.filter((l) => l.interfaceId === 'ifc-2' && l.status === 'FAILURE');
    expect(mqErrors.length).toBeGreaterThan(1);
  });
});
