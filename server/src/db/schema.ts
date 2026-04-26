import { getDb } from '../config/database';

export function initializeSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS interfaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      protocol TEXT NOT NULL CHECK(protocol IN ('REST','SOAP','MQ','BATCH','SFTP')),
      direction TEXT NOT NULL CHECK(direction IN ('INBOUND','OUTBOUND')),
      counterparty TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE','ERROR')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transaction_logs (
      id TEXT PRIMARY KEY,
      interface_id TEXT NOT NULL REFERENCES interfaces(id),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILURE','TIMEOUT','PENDING')),
      level TEXT NOT NULL DEFAULT 'INFO' CHECK(level IN ('INFO','WARN','ERROR')),
      duration_ms INTEGER NOT NULL DEFAULT 0,
      request_payload TEXT NOT NULL DEFAULT '{}',
      response_payload TEXT NOT NULL DEFAULT '{}',
      error_message TEXT,
      stack_trace TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (interface_id) REFERENCES interfaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_interface_id ON transaction_logs(interface_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON transaction_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_status ON transaction_logs(status);
    CREATE INDEX IF NOT EXISTS idx_logs_level ON transaction_logs(level);
  `);
}
