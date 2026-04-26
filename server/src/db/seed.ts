import { getDb } from '../config/database';

const SEED_INTERFACES = [
  {
    id: 'ifc-rest-fss',
    name: '금감원 전자공시 API',
    protocol: 'REST',
    direction: 'INBOUND',
    counterparty: '금감원',
    endpoint: 'https://opendart.fss.or.kr/api/disclosure',
    description: '금감원 전자공시시스템(DART)에서 공시 데이터를 수신하는 REST API',
  },
  {
    id: 'ifc-rest-bank',
    name: '은행 계좌 조회 API',
    protocol: 'REST',
    direction: 'OUTBOUND',
    counterparty: 'KB은행',
    endpoint: 'https://api.kbbank.com/v1/accounts',
    description: 'KB은행 계좌 잔액 및 거래내역 조회 REST API',
  },
  {
    id: 'ifc-mq-stock',
    name: '증권사 시세 MQ',
    protocol: 'MQ',
    direction: 'INBOUND',
    counterparty: 'KB증권',
    endpoint: 'mq://broker.kbsec.co.kr:61616/STOCK.PRICE',
    description: 'KB증권에서 실시간 시세 데이터를 수신하는 MQ 인터페이스',
  },
  {
    id: 'ifc-batch-settle',
    name: '일일 정산 배치',
    protocol: 'BATCH',
    direction: 'OUTBOUND',
    counterparty: '자체(내부)',
    endpoint: 'batch://daily-settlement',
    description: '매일 23:00 실행되는 일일 정산 배치 처리',
  },
] as const;

export function seedInterfaces(): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO interfaces (id, name, protocol, direction, counterparty, endpoint, description)
    VALUES (@id, @name, @protocol, @direction, @counterparty, @endpoint, @description)
  `);

  const tx = db.transaction(() => {
    for (const ifc of SEED_INTERFACES) {
      insert.run(ifc);
    }
  });

  tx();
  console.log(`[Seed] ${SEED_INTERFACES.length} interfaces seeded`);
}
