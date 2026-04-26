export interface IndexableLog {
  id: string;
  interfaceId: string;
  timestamp: string;
  status: string;
  level: string;
  errorMessage: string;
  requestPayload: string;
  responsePayload: string;
  metadata: string;
}

export interface LogSearchResult {
  id: string;
  score: number;
}
