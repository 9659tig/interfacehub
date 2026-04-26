import Database from 'better-sqlite3';
import { StructuredQuery, TransactionLog } from '../models/types';

interface InsertLogInput {
  id: string;
  interfaceId: string;
  status: string;
  level: string;
  durationMs: number;
  requestPayload: string;
  responsePayload: string;
  errorMessage: string | null;
  stackTrace: string | null;
  metadata: string;
}

export class LogService {
  constructor(private db: Database.Database) {}

  insert(input: InsertLogInput): void {
    this.db.prepare(`
      INSERT INTO transaction_logs
        (id, interface_id, status, level, duration_ms, request_payload, response_payload, error_message, stack_trace, metadata)
      VALUES
        (@id, @interfaceId, @status, @level, @durationMs, @requestPayload, @responsePayload, @errorMessage, @stackTrace, @metadata)
    `).run(input);
  }

  getById(id: string): TransactionLog | undefined {
    const row = this.db.prepare('SELECT * FROM transaction_logs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  queryByFilters(filters: StructuredQuery['filters'], timeRange?: StructuredQuery['timeRange'], limit: number = 100): TransactionLog[] {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filters.interfaceId) {
      conditions.push('interface_id = @interfaceId');
      params.interfaceId = filters.interfaceId;
    }
    if (filters.status) {
      conditions.push('status = @status');
      params.status = filters.status;
    }
    if (filters.level) {
      conditions.push('level = @level');
      params.level = filters.level;
    }
    if (filters.protocol) {
      conditions.push('interface_id IN (SELECT id FROM interfaces WHERE protocol = @protocol)');
      params.protocol = filters.protocol;
    }
    if (filters.counterparty) {
      conditions.push('interface_id IN (SELECT id FROM interfaces WHERE counterparty = @counterparty)');
      params.counterparty = filters.counterparty;
    }
    if (filters.errorMessageContains) {
      conditions.push('error_message LIKE @errorLike');
      params.errorLike = `%${filters.errorMessageContains}%`;
    }
    if (timeRange?.from) {
      conditions.push('timestamp >= @timeFrom');
      params.timeFrom = timeRange.from;
    }
    if (timeRange?.to) {
      conditions.push('timestamp <= @timeTo');
      params.timeTo = timeRange.to;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.db.prepare(`SELECT * FROM transaction_logs ${where} ORDER BY timestamp DESC LIMIT @limit`).all({
      ...params,
      limit,
    }) as Record<string, unknown>[];

    return rows.map((r) => this.mapRow(r));
  }

  getStatsByInterface(interfaceId: string): { total: number; success: number; failure: number; avgDurationMs: number } {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'FAILURE' THEN 1 ELSE 0 END) as failure,
        AVG(duration_ms) as avgDurationMs
      FROM transaction_logs
      WHERE interface_id = ?
    `).get(interfaceId) as { total: number; success: number; failure: number; avgDurationMs: number };

    return row;
  }

  getRecentByInterface(interfaceId: string, limit: number = 10): TransactionLog[] {
    const rows = this.db.prepare(
      'SELECT * FROM transaction_logs WHERE interface_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(interfaceId, limit) as Record<string, unknown>[];

    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): TransactionLog {
    return {
      id: row.id as string,
      interfaceId: row.interface_id as string,
      timestamp: row.timestamp as string,
      status: row.status as TransactionLog['status'],
      level: row.level as TransactionLog['level'],
      durationMs: row.duration_ms as number,
      requestPayload: row.request_payload as string,
      responsePayload: row.response_payload as string,
      errorMessage: row.error_message as string | null,
      stackTrace: row.stack_trace as string | null,
      metadata: row.metadata as string,
    };
  }
}
