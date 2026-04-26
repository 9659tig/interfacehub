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

export interface TransactionLog {
  id: string;
  interfaceId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'PENDING';
  level: 'INFO' | 'WARN' | 'ERROR';
  durationMs: number;
  requestPayload: string;
  responsePayload: string;
  errorMessage: string | null;
  stackTrace: string | null;
  metadata: string;
}

export interface NLSearchResponse {
  query: {
    filters: Record<string, string | undefined>;
    timeRange?: { from: string; to: string };
    limit?: number;
  };
  results: TransactionLog[];
  totalCount: number;
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
