import crypto from 'crypto';
import { LogSearchEngine } from '../search/LogSearchEngine';
import { LogService } from '../services/logService';

interface SimInterface {
  id: string;
  name: string;
  protocol: string;
  counterparty: string;
}

interface GeneratedLog {
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

const ERROR_MESSAGES: Record<string, string[]> = {
  REST: [
    'Connection timeout: 서버 응답 없음 (ETIMEDOUT)',
    'HTTP 502 Bad Gateway: upstream server error',
    'HTTP 401 Unauthorized: 인증 토큰 만료',
    'HTTP 429 Too Many Requests: rate limit 초과',
  ],
  MQ: [
    'MQ broker connection refused: ECONNREFUSED',
    'Message queue full: 큐 용량 초과 (max 10000)',
    'Message deserialization failed: invalid JSON payload',
    'MQ heartbeat timeout: broker 응답 없음',
  ],
  BATCH: [
    '정산 배치 실패: 디스크 공간 부족',
    'Batch job timeout: 처리 시간 초과 (30분)',
    'Data validation error: 필수 필드 누락 (금액)',
    'Database lock timeout: 동시 접근 충돌',
  ],
  SFTP: ['SFTP connection failed: authentication error', 'File transfer interrupted: network reset'],
  SOAP: ['SOAP fault: invalid XML structure', 'WSDL endpoint unreachable'],
};

const STACK_TRACES = [
  'Error: ECONNREFUSED 10.0.1.15:61616\\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)',
  'Error: ETIMEDOUT\\n    at Timeout._onTimeout (/app/src/adapters/rest.ts:45:11)\\n    at listOnTimeout (internal/timers.js:557:17)',
  'Error: ENOMEM\\n    at BatchProcessor.run (/app/src/batch/processor.ts:120:9)\\n    at async Job.execute (/app/src/jobs/daily.ts:30:5)',
];

const REQUEST_PAYLOADS: Record<string, string[]> = {
  REST: ['{"type":"disclosure","date":"2026-04-25"}', '{"accountId":"KB-001","action":"balance"}'],
  MQ: ['{"symbol":"005930","exchange":"KRX"}', '{"symbol":"000660","exchange":"KRX"}'],
  BATCH: ['{"batchId":"SETTLE-20260425","type":"daily"}'],
  SFTP: ['{"filename":"report_20260425.csv"}'],
  SOAP: ['<GetQuote><Symbol>005930</Symbol></GetQuote>'],
};

export class TransactionSimulator {
  private timer: ReturnType<typeof setInterval> | null = null;
  private errorSpikeInterface: string | null = null;
  private spikeTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private logService: LogService,
    private searchEngine: LogSearchEngine,
    private interfaces: SimInterface[]
  ) {}

  start(intervalMs: number): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => this.tick(), intervalMs);

    this.spikeTimer = setInterval(() => {
      const target = this.interfaces[Math.floor(Math.random() * this.interfaces.length)];
      this.errorSpikeInterface = target.id;
      setTimeout(() => {
        this.errorSpikeInterface = null;
      }, 10_000);
    }, 30_000 + Math.floor(Math.random() * 60_000));
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.spikeTimer) {
      clearInterval(this.spikeTimer);
      this.spikeTimer = null;
    }
  }

  setErrorSpikeInterface(interfaceId: string): void {
    this.errorSpikeInterface = interfaceId;
  }

  tick(): void {
    const log = this.generateOne();
    this.logService.insert(log);
    this.searchEngine.addLog({
      id: log.id,
      interfaceId: log.interfaceId,
      timestamp: new Date().toISOString(),
      status: log.status,
      level: log.level,
      errorMessage: log.errorMessage || '',
      requestPayload: log.requestPayload,
      responsePayload: log.responsePayload,
      metadata: log.metadata,
    });
  }

  generateOne(): GeneratedLog {
    const ifc = this.interfaces[Math.floor(Math.random() * this.interfaces.length)];
    const isSpike = this.errorSpikeInterface === ifc.id;

    const roll = Math.random();
    let status: string;
    if (isSpike) {
      status = roll < 0.3 ? 'SUCCESS' : roll < 0.9 ? 'FAILURE' : roll < 0.98 ? 'TIMEOUT' : 'PENDING';
    } else {
      status = roll < 0.85 ? 'SUCCESS' : roll < 0.95 ? 'FAILURE' : roll < 0.98 ? 'TIMEOUT' : 'PENDING';
    }

    const isError = status === 'FAILURE' || status === 'TIMEOUT';
    const level = isError ? 'ERROR' : status === 'PENDING' ? 'WARN' : 'INFO';
    const durationMs = isError ? 3000 + Math.floor(Math.random() * 7000) : 50 + Math.floor(Math.random() * 450);

    const protocolErrors = ERROR_MESSAGES[ifc.protocol] || ERROR_MESSAGES.REST;
    const errorMessage = isError ? protocolErrors[Math.floor(Math.random() * protocolErrors.length)] : null;
    const stackTrace =
      isError && Math.random() > 0.5 ? STACK_TRACES[Math.floor(Math.random() * STACK_TRACES.length)] : null;

    const payloads = REQUEST_PAYLOADS[ifc.protocol] || REQUEST_PAYLOADS.REST;
    const requestPayload = payloads[Math.floor(Math.random() * payloads.length)];
    const responsePayload = isError ? '' : '{"status":"ok"}';

    return {
      id: `txn-${crypto.randomUUID()}`,
      interfaceId: ifc.id,
      status,
      level,
      durationMs,
      requestPayload,
      responsePayload,
      errorMessage,
      stackTrace,
      metadata: JSON.stringify({ correlationId: `corr-${crypto.randomUUID().slice(0, 8)}` }),
    };
  }
}
