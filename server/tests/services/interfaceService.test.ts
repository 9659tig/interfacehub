import Database from 'better-sqlite3';
import { InterfaceService } from '../../src/services/interfaceService';

describe('InterfaceService', () => {
  let db: Database.Database;
  let service: InterfaceService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE interfaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        protocol TEXT NOT NULL,
        direction TEXT NOT NULL,
        counterparty TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    service = new InterfaceService(db);
  });

  afterEach(() => db.close());

  test('create and getAll returns interfaces', () => {
    service.create({
      id: 'ifc-1',
      name: 'Test API',
      protocol: 'REST',
      direction: 'INBOUND',
      counterparty: '금감원',
      endpoint: 'https://example.com',
      description: 'test',
    });
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Test API');
  });

  test('getById returns single interface', () => {
    service.create({
      id: 'ifc-1',
      name: 'Test API',
      protocol: 'REST',
      direction: 'INBOUND',
      counterparty: '금감원',
      endpoint: 'https://example.com',
      description: 'test',
    });
    const ifc = service.getById('ifc-1');
    expect(ifc).toBeDefined();
    expect(ifc?.protocol).toBe('REST');
  });

  test('updateStatus changes status', () => {
    service.create({
      id: 'ifc-1',
      name: 'Test API',
      protocol: 'REST',
      direction: 'INBOUND',
      counterparty: '금감원',
      endpoint: 'https://example.com',
      description: 'test',
    });
    service.updateStatus('ifc-1', 'ERROR');
    expect(service.getById('ifc-1')?.status).toBe('ERROR');
  });
});
