export interface InterfaceDefinition {
  id: string;
  name: string;
  protocol: 'REST' | 'SOAP' | 'MQ' | 'BATCH' | 'SFTP';
  direction: 'INBOUND' | 'OUTBOUND';
  counterparty: string;
  endpoint: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type TransactionStatus = 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'PENDING';

export interface TransactionLog {
  id: string;
  interfaceId: string;
  timestamp: string;
  status: TransactionStatus;
  level: LogLevel;
  durationMs: number;
  requestPayload: string;
  responsePayload: string;
  errorMessage: string | null;
  stackTrace: string | null;
  metadata: string;
}

export interface InterfaceStats {
  interfaceId: string;
  name: string;
  protocol: string;
  counterparty: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  totalLast24h: number;
  successLast24h: number;
  failureLast24h: number;
  errorRate: number;
  avgDurationMs: number;
}

export interface StructuredQuery {
  filters: {
    interfaceId?: string;
    protocol?: string;
    status?: TransactionStatus;
    level?: LogLevel;
    counterparty?: string;
    errorMessageContains?: string;
  };
  timeRange?: {
    from: string;
    to: string;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

export interface RCARequest {
  transactionId: string;
}

export interface RCAResult {
  transactionId: string;
  causes: Array<{
    rank: number;
    description: string;
    evidence: string;
  }>;
  recommendation: string;
  impactScope: string;
  confidence: number;
}
