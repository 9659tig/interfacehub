import Database from 'better-sqlite3';
import { InterfaceDefinition } from '../models/types';

interface CreateInterfaceInput {
  id: string;
  name: string;
  protocol: string;
  direction: string;
  counterparty: string;
  endpoint: string;
  description: string;
}

export class InterfaceService {
  constructor(private db: Database.Database) {}

  create(input: CreateInterfaceInput): void {
    this.db.prepare(`
      INSERT INTO interfaces (id, name, protocol, direction, counterparty, endpoint, description)
      VALUES (@id, @name, @protocol, @direction, @counterparty, @endpoint, @description)
    `).run(input);
  }

  getAll(): InterfaceDefinition[] {
    return this.db.prepare('SELECT * FROM interfaces ORDER BY created_at DESC').all() as InterfaceDefinition[];
  }

  getById(id: string): InterfaceDefinition | undefined {
    return this.db.prepare('SELECT * FROM interfaces WHERE id = ?').get(id) as InterfaceDefinition | undefined;
  }

  updateStatus(id: string, status: string): void {
    this.db.prepare("UPDATE interfaces SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  }
}
