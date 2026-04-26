# InterfaceHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered insurance IT interface integration management platform with a unified dashboard, natural language log search (Claude API), AI root-cause analysis, and a seed data simulator — all runnable via Docker Compose.

**Architecture:** 3-tier FO/MO/BO structure. Backend is Express + TypeScript with SQLite for persistence and MiniSearch for log keyword search (adapted from UserServer's hybrid search pattern instead of OpenSearch). Frontend is Vite + React + Tailwind + shadcn/ui. Claude API handles NL→structured-query conversion and error RCA analysis.

**Tech Stack:** Node.js 20, Express, TypeScript, SQLite (better-sqlite3), MiniSearch, Anthropic Claude API (claude-sonnet-4-20250514), Vite, React 18, Tailwind CSS 3, shadcn/ui, Docker Compose

---

## File Structure

```
InterfaceHub/
├── docker-compose.yml
├── README.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── app.ts                          # Express app entry + startup
│   │   ├── config/
│   │   │   ├── database.ts                 # SQLite connection (better-sqlite3)
│   │   │   └── env.ts                      # Env var validation
│   │   ├── db/
│   │   │   ├── schema.ts                   # CREATE TABLE statements
│   │   │   └── seed.ts                     # Initial interface definitions
│   │   ├── models/
│   │   │   └── types.ts                    # Shared TypeScript types
│   │   ├── routes/
│   │   │   ├── interfaceRoutes.ts          # CRUD for interfaces (BO)
│   │   │   ├── logRoutes.ts                # Log search & detail (FO)
│   │   │   ├── aiRoutes.ts                 # NL search & RCA (MO)
│   │   │   └── dashboardRoutes.ts          # Dashboard stats (FO)
│   │   ├── controllers/
│   │   │   ├── interfaceController.ts      # Interface CRUD handlers
│   │   │   ├── logController.ts            # Log query handlers
│   │   │   ├── aiController.ts             # Claude AI handlers
│   │   │   └── dashboardController.ts      # Dashboard stat handlers
│   │   ├── services/
│   │   │   ├── interfaceService.ts         # Interface DB operations
│   │   │   ├── logService.ts               # Log DB operations + search
│   │   │   └── aiService.ts                # Claude API integration
│   │   ├── search/
│   │   │   ├── LogSearchEngine.ts          # MiniSearch for logs (adapted from UserServer)
│   │   │   └── types.ts                    # Search-related types
│   │   ├── simulator/
│   │   │   └── TransactionSimulator.ts     # Seed data generator
│   │   └── middleware/
│   │       └── errorHandler.ts             # Global error handler
│   └── tests/
│       ├── services/
│       │   ├── interfaceService.test.ts
│       │   ├── logService.test.ts
│       │   └── aiService.test.ts
│       ├── search/
│       │   └── LogSearchEngine.test.ts
│       └── simulator/
│           └── TransactionSimulator.test.ts
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css                       # Tailwind directives
│   │   ├── lib/
│   │   │   └── utils.ts                    # cn() helper for shadcn
│   │   ├── api/
│   │   │   └── client.ts                   # Fetch wrapper
│   │   ├── types/
│   │   │   └── index.ts                    # Shared frontend types
│   │   ├── hooks/
│   │   │   ├── useDashboard.ts             # Dashboard data polling
│   │   │   ├── useLogSearch.ts             # NL search hook
│   │   │   └── useRCA.ts                   # RCA analysis hook
│   │   ├── components/
│   │   │   ├── ui/                         # shadcn/ui components (Card, Badge, Input, Button, etc.)
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── InterfaceCard.tsx        # Single interface status card
│   │   │   │   ├── InterfaceGrid.tsx        # 4-card grid layout
│   │   │   │   └── DashboardStats.tsx       # Summary stats bar
│   │   │   ├── search/
│   │   │   │   ├── NLSearchBar.tsx          # Natural language search input
│   │   │   │   └── SearchResults.tsx        # Log search result table
│   │   │   └── rca/
│   │   │       ├── RCAPanel.tsx             # AI RCA side panel
│   │   │       └── RCAResult.tsx            # Single RCA analysis display
│   │   └── pages/
│   │       └── Dashboard.tsx                # Main dashboard page (FO)
│   └── components.json                      # shadcn/ui config
```

---

## Chunk 1: Server Foundation (Tasks 1–5)

### Task 1: Server Project Scaffolding

**Files:**
- Create: `InterfaceHub/server/package.json`
- Create: `InterfaceHub/server/tsconfig.json`
- Create: `InterfaceHub/server/.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "interfacehub-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest --forceExit --detectOpenHandles"
  },
  "dependencies": {
    "express": "^4.21.0",
    "better-sqlite3": "^11.6.0",
    "minisearch": "^7.1.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/better-sqlite3": "^7.6.12",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "@types/jest": "^29.5.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create .env.example**

```bash
PORT=4000
ANTHROPIC_API_KEY=sk-ant-...
# Simulator: set to "true" to auto-start generating fake logs
SIMULATOR_ENABLED=true
SIMULATOR_INTERVAL_MS=1000
```

- [ ] **Step 4: Install dependencies**

Run: `cd InterfaceHub/server && npm install`
Expected: node_modules created, no errors

- [ ] **Step 5: Commit**

```bash
git add InterfaceHub/server/package.json InterfaceHub/server/tsconfig.json InterfaceHub/server/.env.example InterfaceHub/server/package-lock.json
git commit -m "chore(interfacehub): scaffold server project with deps"
```

---

### Task 2: Environment Config & Database Setup

**Files:**
- Create: `InterfaceHub/server/src/config/env.ts`
- Create: `InterfaceHub/server/src/config/database.ts`
- Create: `InterfaceHub/server/src/db/schema.ts`
- Create: `InterfaceHub/server/src/models/types.ts`

- [ ] **Step 1: Create env.ts**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  SIMULATOR_ENABLED: z.enum(['true', 'false']).default('true'),
  SIMULATOR_INTERVAL_MS: z.coerce.number().default(1000),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}
```

- [ ] **Step 2: Create database.ts**

```typescript
import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(__dirname, '../../data/interfacehub.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

- [ ] **Step 3: Create types.ts**

```typescript
// ── Interface (인터페이스 정의) ──
export interface InterfaceDefinition {
  id: string;
  name: string;
  protocol: 'REST' | 'SOAP' | 'MQ' | 'BATCH' | 'SFTP';
  direction: 'INBOUND' | 'OUTBOUND';
  counterparty: string;        // 외부 기관명 (e.g. "금감원", "KB증권")
  endpoint: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

// ── Transaction Log (트랜잭션 로그) ──
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
  metadata: string;             // JSON string: { correlationId, batchId, ... }
}

// ── Dashboard Stats ──
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

// ── AI NL Search ──
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
    from: string;   // ISO 8601
    to: string;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

// ── AI RCA ──
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
  confidence: number;           // 0.0 – 1.0
}
```

- [ ] **Step 4: Create schema.ts**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add InterfaceHub/server/src/config/ InterfaceHub/server/src/db/schema.ts InterfaceHub/server/src/models/types.ts
git commit -m "feat(interfacehub): add env config, SQLite schema, and TypeScript types"
```

---

### Task 3: Seed Interface Definitions

**Files:**
- Create: `InterfaceHub/server/src/db/seed.ts`

- [ ] **Step 1: Create seed.ts with 4 interface definitions**

```typescript
import { getDb } from '../config/database';
import crypto from 'crypto';

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
```

- [ ] **Step 2: Commit**

```bash
git add InterfaceHub/server/src/db/seed.ts
git commit -m "feat(interfacehub): add seed data for 4 interface definitions"
```

---

### Task 4: Log Search Engine (MiniSearch, adapted from UserServer)

**Files:**
- Create: `InterfaceHub/server/src/search/types.ts`
- Create: `InterfaceHub/server/src/search/LogSearchEngine.ts`
- Create: `InterfaceHub/server/tests/search/LogSearchEngine.test.ts`

- [ ] **Step 1: Create search/types.ts**

```typescript
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
```

- [ ] **Step 2: Write the failing test for LogSearchEngine**

```typescript
// tests/search/LogSearchEngine.test.ts
import { LogSearchEngine } from '../../src/search/LogSearchEngine';
import { IndexableLog } from '../../src/search/types';

describe('LogSearchEngine', () => {
  let engine: LogSearchEngine;

  const sampleLogs: IndexableLog[] = [
    {
      id: 'log-1',
      interfaceId: 'ifc-rest-fss',
      timestamp: '2026-04-25T14:30:00Z',
      status: 'FAILURE',
      level: 'ERROR',
      errorMessage: 'Connection timeout: 금감원 서버 응답 없음',
      requestPayload: '{"type":"disclosure"}',
      responsePayload: '',
      metadata: '{"correlationId":"corr-001"}',
    },
    {
      id: 'log-2',
      interfaceId: 'ifc-mq-stock',
      timestamp: '2026-04-25T15:00:00Z',
      status: 'SUCCESS',
      level: 'INFO',
      errorMessage: '',
      requestPayload: '{"symbol":"005930"}',
      responsePayload: '{"price":72000}',
      metadata: '{"correlationId":"corr-002"}',
    },
    {
      id: 'log-3',
      interfaceId: 'ifc-mq-stock',
      timestamp: '2026-04-25T15:05:00Z',
      status: 'FAILURE',
      level: 'ERROR',
      errorMessage: 'MQ broker connection refused: 증권사 서버 5xx',
      requestPayload: '{"symbol":"000660"}',
      responsePayload: '',
      metadata: '{"correlationId":"corr-003"}',
    },
  ];

  beforeEach(() => {
    engine = new LogSearchEngine();
    engine.indexLogs(sampleLogs);
  });

  test('search by keyword returns matching logs', () => {
    const results = engine.search('timeout');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('log-1');
  });

  test('search by Korean keyword returns matching logs', () => {
    const results = engine.search('증권사');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.id === 'log-3')).toBe(true);
  });

  test('search returns empty for unrelated query', () => {
    const results = engine.search('blockchain');
    expect(results.length).toBe(0);
  });

  test('addLog indexes a new log and makes it searchable', () => {
    engine.addLog({
      id: 'log-4',
      interfaceId: 'ifc-batch-settle',
      timestamp: '2026-04-25T23:00:00Z',
      status: 'FAILURE',
      level: 'ERROR',
      errorMessage: '정산 배치 실패: 디스크 공간 부족',
      requestPayload: '{}',
      responsePayload: '',
      metadata: '{}',
    });
    const results = engine.search('정산');
    expect(results.some(r => r.id === 'log-4')).toBe(true);
  });

  test('removeLog removes a log from the index', () => {
    engine.removeLog('log-1');
    const results = engine.search('timeout');
    expect(results.every(r => r.id !== 'log-1')).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd InterfaceHub/server && npx jest tests/search/LogSearchEngine.test.ts --no-cache`
Expected: FAIL — cannot find module `../../src/search/LogSearchEngine`

- [ ] **Step 4: Implement LogSearchEngine**

```typescript
// src/search/LogSearchEngine.ts
import MiniSearch from 'minisearch';
import { IndexableLog, LogSearchResult } from './types';

export class LogSearchEngine {
  private index: MiniSearch;

  constructor() {
    this.index = new MiniSearch({
      fields: ['errorMessage', 'requestPayload', 'responsePayload', 'status', 'level', 'metadata'],
      storeFields: ['id'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { errorMessage: 3, status: 2, level: 1 },
      },
    });
  }

  indexLogs(logs: IndexableLog[]): void {
    this.index.addAll(logs);
  }

  addLog(log: IndexableLog): void {
    this.index.add(log);
  }

  removeLog(id: string): void {
    this.index.discard(id);
  }

  search(query: string, limit: number = 50): LogSearchResult[] {
    const results = this.index.search(query);
    return results.slice(0, limit).map(r => ({
      id: r.id as string,
      score: r.score,
    }));
  }

  get size(): number {
    return this.index.documentCount;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd InterfaceHub/server && npx jest tests/search/LogSearchEngine.test.ts --no-cache`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add InterfaceHub/server/src/search/ InterfaceHub/server/tests/search/
git commit -m "feat(interfacehub): add MiniSearch-based log search engine with tests"
```

---

### Task 5: Interface & Log Service Layer

**Files:**
- Create: `InterfaceHub/server/src/services/interfaceService.ts`
- Create: `InterfaceHub/server/src/services/logService.ts`
- Create: `InterfaceHub/server/tests/services/interfaceService.test.ts`
- Create: `InterfaceHub/server/tests/services/logService.test.ts`

- [ ] **Step 1: Write failing test for interfaceService**

```typescript
// tests/services/interfaceService.test.ts
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
      id: 'ifc-1', name: 'Test API', protocol: 'REST', direction: 'INBOUND',
      counterparty: '금감원', endpoint: 'https://example.com', description: 'test',
    });
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Test API');
  });

  test('getById returns single interface', () => {
    service.create({
      id: 'ifc-1', name: 'Test API', protocol: 'REST', direction: 'INBOUND',
      counterparty: '금감원', endpoint: 'https://example.com', description: 'test',
    });
    const ifc = service.getById('ifc-1');
    expect(ifc).toBeDefined();
    expect(ifc!.protocol).toBe('REST');
  });

  test('updateStatus changes status', () => {
    service.create({
      id: 'ifc-1', name: 'Test API', protocol: 'REST', direction: 'INBOUND',
      counterparty: '금감원', endpoint: 'https://example.com', description: 'test',
    });
    service.updateStatus('ifc-1', 'ERROR');
    expect(service.getById('ifc-1')!.status).toBe('ERROR');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd InterfaceHub/server && npx jest tests/services/interfaceService.test.ts --no-cache`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement interfaceService.ts**

```typescript
// src/services/interfaceService.ts
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
    this.db.prepare(`UPDATE interfaces SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
  }
}
```

- [ ] **Step 4: Run interfaceService test**

Run: `cd InterfaceHub/server && npx jest tests/services/interfaceService.test.ts --no-cache`
Expected: All 3 tests PASS

- [ ] **Step 5: Write failing test for logService**

```typescript
// tests/services/logService.test.ts
import Database from 'better-sqlite3';
import { LogService } from '../../src/services/logService';

describe('LogService', () => {
  let db: Database.Database;
  let service: LogService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE interfaces (
        id TEXT PRIMARY KEY, name TEXT, protocol TEXT, direction TEXT,
        counterparty TEXT, endpoint TEXT, description TEXT DEFAULT '',
        status TEXT DEFAULT 'ACTIVE', created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE transaction_logs (
        id TEXT PRIMARY KEY, interface_id TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'INFO',
        duration_ms INTEGER NOT NULL DEFAULT 0,
        request_payload TEXT DEFAULT '{}', response_payload TEXT DEFAULT '{}',
        error_message TEXT, stack_trace TEXT, metadata TEXT DEFAULT '{}'
      );
      INSERT INTO interfaces (id, name, protocol, direction, counterparty, endpoint)
      VALUES ('ifc-1', 'Test', 'REST', 'INBOUND', 'Test Corp', 'https://test.com');
    `);
    service = new LogService(db);
  });

  afterEach(() => db.close());

  test('insert and getById returns log', () => {
    service.insert({
      id: 'log-1', interfaceId: 'ifc-1', status: 'SUCCESS',
      level: 'INFO', durationMs: 120,
      requestPayload: '{}', responsePayload: '{"ok":true}',
      errorMessage: null, stackTrace: null, metadata: '{}',
    });
    const log = service.getById('log-1');
    expect(log).toBeDefined();
    expect(log!.status).toBe('SUCCESS');
  });

  test('queryByFilters returns filtered logs', () => {
    service.insert({
      id: 'log-1', interfaceId: 'ifc-1', status: 'SUCCESS',
      level: 'INFO', durationMs: 120,
      requestPayload: '{}', responsePayload: '{}',
      errorMessage: null, stackTrace: null, metadata: '{}',
    });
    service.insert({
      id: 'log-2', interfaceId: 'ifc-1', status: 'FAILURE',
      level: 'ERROR', durationMs: 5000,
      requestPayload: '{}', responsePayload: '{}',
      errorMessage: 'timeout', stackTrace: 'Error at line 42', metadata: '{}',
    });
    const failures = service.queryByFilters({ status: 'FAILURE' });
    expect(failures).toHaveLength(1);
    expect(failures[0].id).toBe('log-2');
  });

  test('getStats returns correct counts', () => {
    service.insert({
      id: 'log-1', interfaceId: 'ifc-1', status: 'SUCCESS',
      level: 'INFO', durationMs: 100,
      requestPayload: '{}', responsePayload: '{}',
      errorMessage: null, stackTrace: null, metadata: '{}',
    });
    service.insert({
      id: 'log-2', interfaceId: 'ifc-1', status: 'FAILURE',
      level: 'ERROR', durationMs: 5000,
      requestPayload: '{}', responsePayload: '{}',
      errorMessage: 'err', stackTrace: null, metadata: '{}',
    });
    const stats = service.getStatsByInterface('ifc-1');
    expect(stats.total).toBe(2);
    expect(stats.success).toBe(1);
    expect(stats.failure).toBe(1);
  });
});
```

- [ ] **Step 6: Run logService test to verify it fails**

Run: `cd InterfaceHub/server && npx jest tests/services/logService.test.ts --no-cache`
Expected: FAIL

- [ ] **Step 7: Implement logService.ts**

```typescript
// src/services/logService.ts
import Database from 'better-sqlite3';
import { TransactionLog, StructuredQuery } from '../models/types';

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
    const rows = this.db.prepare(
      `SELECT * FROM transaction_logs ${where} ORDER BY timestamp DESC LIMIT @limit`
    ).all({ ...params, limit }) as Record<string, unknown>[];

    return rows.map(r => this.mapRow(r));
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
    return rows.map(r => this.mapRow(r));
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
```

- [ ] **Step 8: Run logService test**

Run: `cd InterfaceHub/server && npx jest tests/services/logService.test.ts --no-cache`
Expected: All 3 tests PASS

- [ ] **Step 9: Commit**

```bash
git add InterfaceHub/server/src/services/ InterfaceHub/server/tests/services/
git commit -m "feat(interfacehub): add interface and log service layers with tests"
```

---

## Chunk 2: AI Integration & Simulator (Tasks 6–8)

### Task 6: Claude AI Service (NL Search + RCA)

**Files:**
- Create: `InterfaceHub/server/src/services/aiService.ts`
- Create: `InterfaceHub/server/tests/services/aiService.test.ts`

- [ ] **Step 1: Write failing test for aiService**

```typescript
// tests/services/aiService.test.ts
import { AIService } from '../../src/services/aiService';
import { StructuredQuery, RCAResult } from '../../src/models/types';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

describe('AIService', () => {
  let service: AIService;
  let mockCreate: jest.Mock;

  const INDEX_SCHEMA = {
    interfaces: ['ifc-rest-fss', 'ifc-rest-bank', 'ifc-mq-stock', 'ifc-batch-settle'],
    protocols: ['REST', 'SOAP', 'MQ', 'BATCH', 'SFTP'],
    statuses: ['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING'],
    levels: ['INFO', 'WARN', 'ERROR'],
    counterparties: ['금감원', 'KB은행', 'KB증권', '자체(내부)'],
  };

  beforeEach(() => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const instance = new Anthropic();
    mockCreate = instance.messages.create;
    service = new AIService('test-key', INDEX_SCHEMA);
  });

  describe('convertNLToQuery', () => {
    test('converts natural language to StructuredQuery', async () => {
      const mockResponse: StructuredQuery = {
        filters: { status: 'FAILURE', protocol: 'MQ' },
        timeRange: { from: '2026-04-25T00:00:00Z', to: '2026-04-25T23:59:59Z' },
        limit: 50,
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
      });

      const result = await service.convertNLToQuery('어제 실패한 MQ 건 보여줘');
      expect(result.filters.status).toBe('FAILURE');
      expect(result.filters.protocol).toBe('MQ');
    });

    test('throws on invalid AI response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json' }],
      });

      await expect(service.convertNLToQuery('test')).rejects.toThrow();
    });
  });

  describe('analyzeRCA', () => {
    test('returns RCA result with causes and confidence', async () => {
      const mockRCA: RCAResult = {
        transactionId: 'log-1',
        causes: [
          { rank: 1, description: '외부 서버 응답 지연', evidence: '5xx 응답 23건' },
        ],
        recommendation: '30분 후 재처리 큐에 등록',
        impactScope: '약 1,200건의 시세 데이터 동기화 지연',
        confidence: 0.85,
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockRCA) }],
      });

      const transactionContext = {
        id: 'log-1',
        interfaceId: 'ifc-mq-stock',
        interfaceName: '증권사 시세 MQ',
        status: 'FAILURE' as const,
        errorMessage: 'MQ broker connection refused',
        stackTrace: 'Error: ECONNREFUSED at...',
        requestPayload: '{"symbol":"005930"}',
        responsePayload: '',
        recentRelatedLogs: [],
      };

      const result = await service.analyzeRCA(transactionContext);
      expect(result.causes).toHaveLength(1);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.recommendation).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd InterfaceHub/server && npx jest tests/services/aiService.test.ts --no-cache`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement aiService.ts**

```typescript
// src/services/aiService.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { StructuredQuery, RCAResult } from '../models/types';

const structuredQuerySchema = z.object({
  filters: z.object({
    interfaceId: z.string().optional(),
    protocol: z.enum(['REST', 'SOAP', 'MQ', 'BATCH', 'SFTP']).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING']).optional(),
    level: z.enum(['INFO', 'WARN', 'ERROR']).optional(),
    counterparty: z.string().optional(),
    errorMessageContains: z.string().optional(),
  }),
  timeRange: z.object({
    from: z.string(),
    to: z.string(),
  }).optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  limit: z.number().optional(),
});

const rcaResultSchema = z.object({
  transactionId: z.string(),
  causes: z.array(z.object({
    rank: z.number(),
    description: z.string(),
    evidence: z.string(),
  })),
  recommendation: z.string(),
  impactScope: z.string(),
  confidence: z.number().min(0).max(1),
});

interface IndexSchema {
  interfaces: string[];
  protocols: string[];
  statuses: string[];
  levels: string[];
  counterparties: string[];
}

interface RCAContext {
  id: string;
  interfaceId: string;
  interfaceName: string;
  status: string;
  errorMessage: string | null;
  stackTrace: string | null;
  requestPayload: string;
  responsePayload: string;
  recentRelatedLogs: Array<{ timestamp: string; status: string; errorMessage: string | null }>;
}

export class AIService {
  private client: Anthropic;
  private indexSchema: IndexSchema;

  constructor(apiKey: string, indexSchema: IndexSchema) {
    this.client = new Anthropic({ apiKey });
    this.indexSchema = indexSchema;
  }

  async convertNLToQuery(userQuestion: string): Promise<StructuredQuery> {
    const now = new Date().toISOString();
    const systemPrompt = `You are a log search assistant for a financial IT interface management platform.
Convert the user's natural language question into a structured JSON query.

Available schema:
- interface IDs: ${JSON.stringify(this.indexSchema.interfaces)}
- protocols: ${JSON.stringify(this.indexSchema.protocols)}
- statuses: ${JSON.stringify(this.indexSchema.statuses)}
- log levels: ${JSON.stringify(this.indexSchema.levels)}
- counterparties: ${JSON.stringify(this.indexSchema.counterparties)}

Current time: ${now}

Output ONLY valid JSON matching this structure:
{
  "filters": {
    "interfaceId?": "string",
    "protocol?": "REST|SOAP|MQ|BATCH|SFTP",
    "status?": "SUCCESS|FAILURE|TIMEOUT|PENDING",
    "level?": "INFO|WARN|ERROR",
    "counterparty?": "string",
    "errorMessageContains?": "string"
  },
  "timeRange?": { "from": "ISO8601", "to": "ISO8601" },
  "sort?": { "field": "timestamp|duration_ms", "order": "asc|desc" },
  "limit?": number
}

Examples:
User: "어제 오후 실패한 MQ 건 보여줘"
{"filters":{"status":"FAILURE","protocol":"MQ"},"timeRange":{"from":"<yesterday 12:00>","to":"<yesterday 23:59>"},"limit":50}

User: "금감원 API 에러 로그"
{"filters":{"counterparty":"금감원","level":"ERROR"}}

User: "응답시간 5초 이상인 건"
{"filters":{},"sort":{"field":"duration_ms","order":"desc"},"limit":50}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userQuestion }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return structuredQuerySchema.parse(parsed);
  }

  async analyzeRCA(context: RCAContext): Promise<RCAResult> {
    const systemPrompt = `You are an AI operations analyst for a financial IT interface platform.
Analyze the failed transaction and provide root cause analysis.

Output ONLY valid JSON:
{
  "transactionId": "string",
  "causes": [{"rank": 1, "description": "string", "evidence": "string"}],
  "recommendation": "string",
  "impactScope": "string",
  "confidence": 0.0-1.0
}

Provide up to 3 ranked cause candidates. Be specific with evidence from the provided data.
Set confidence lower (< 0.6) when evidence is insufficient.`;

    const userMessage = `## Failed Transaction Analysis

**Transaction ID:** ${context.id}
**Interface:** ${context.interfaceName} (${context.interfaceId})
**Status:** ${context.status}

### Error Message
${context.errorMessage || 'N/A'}

### Stack Trace
${context.stackTrace || 'N/A'}

### Request Payload
${context.requestPayload}

### Response Payload
${context.responsePayload}

### Recent Related Logs (last 5 minutes)
${context.recentRelatedLogs.map(l => `[${l.timestamp}] ${l.status} - ${l.errorMessage || 'OK'}`).join('\n') || 'None'}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON for RCA');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return rcaResultSchema.parse(parsed);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd InterfaceHub/server && npx jest tests/services/aiService.test.ts --no-cache`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add InterfaceHub/server/src/services/aiService.ts InterfaceHub/server/tests/services/aiService.test.ts
git commit -m "feat(interfacehub): add Claude AI service for NL search and RCA"
```

---

### Task 7: Transaction Simulator

**Files:**
- Create: `InterfaceHub/server/src/simulator/TransactionSimulator.ts`
- Create: `InterfaceHub/server/tests/simulator/TransactionSimulator.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/simulator/TransactionSimulator.test.ts
import Database from 'better-sqlite3';
import { TransactionSimulator } from '../../src/simulator/TransactionSimulator';
import { LogService } from '../../src/services/logService';
import { LogSearchEngine } from '../../src/search/LogSearchEngine';

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
        timestamp TEXT NOT NULL, status TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'INFO', duration_ms INTEGER DEFAULT 0,
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
    expect(interfaces.map(i => i.id)).toContain(log.interfaceId);
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
    // Force error spike mode
    simulator.setErrorSpikeInterface('ifc-2');
    const logs = Array.from({ length: 20 }, () => simulator.generateOne());
    const mqErrors = logs.filter(l => l.interfaceId === 'ifc-2' && l.status === 'FAILURE');
    // During spike, error rate for target interface should be high
    expect(mqErrors.length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd InterfaceHub/server && npx jest tests/simulator/TransactionSimulator.test.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Implement TransactionSimulator**

```typescript
// src/simulator/TransactionSimulator.ts
import crypto from 'crypto';
import { LogService } from '../services/logService';
import { LogSearchEngine } from '../search/LogSearchEngine';

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
  SFTP: [
    'SFTP connection failed: authentication error',
    'File transfer interrupted: network reset',
  ],
  SOAP: [
    'SOAP fault: invalid XML structure',
    'WSDL endpoint unreachable',
  ],
};

const STACK_TRACES = [
  'Error: ECONNREFUSED 10.0.1.15:61616\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)',
  'Error: ETIMEDOUT\n    at Timeout._onTimeout (/app/src/adapters/rest.ts:45:11)\n    at listOnTimeout (internal/timers.js:557:17)',
  'Error: ENOMEM\n    at BatchProcessor.run (/app/src/batch/processor.ts:120:9)\n    at async Job.execute (/app/src/jobs/daily.ts:30:5)',
];

const REQUEST_PAYLOADS: Record<string, string[]> = {
  'REST': ['{"type":"disclosure","date":"2026-04-25"}', '{"accountId":"KB-001","action":"balance"}'],
  'MQ': ['{"symbol":"005930","exchange":"KRX"}', '{"symbol":"000660","exchange":"KRX"}'],
  'BATCH': ['{"batchId":"SETTLE-20260425","type":"daily"}'],
  'SFTP': ['{"filename":"report_20260425.csv"}'],
  'SOAP': ['<GetQuote><Symbol>005930</Symbol></GetQuote>'],
};

export class TransactionSimulator {
  private timer: ReturnType<typeof setInterval> | null = null;
  private errorSpikeInterface: string | null = null;
  private interfaces: SimInterface[];

  constructor(
    private logService: LogService,
    private searchEngine: LogSearchEngine,
    interfaces: SimInterface[],
  ) {
    this.interfaces = interfaces;
  }

  start(intervalMs: number): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), intervalMs);
    console.log(`[Simulator] Started (interval: ${intervalMs}ms)`);

    // Random error spikes: every 30–90 seconds, pick an interface for 10s spike
    setInterval(() => {
      const target = this.interfaces[Math.floor(Math.random() * this.interfaces.length)];
      this.errorSpikeInterface = target.id;
      console.log(`[Simulator] Error spike started for: ${target.name}`);
      setTimeout(() => {
        this.errorSpikeInterface = null;
        console.log(`[Simulator] Error spike ended`);
      }, 10_000);
    }, 30_000 + Math.random() * 60_000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
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

    // Normal: 85% success, 10% failure, 3% timeout, 2% pending
    // Spike: 30% success, 60% failure, 8% timeout, 2% pending
    const roll = Math.random();
    let status: string;
    if (isSpike) {
      status = roll < 0.30 ? 'SUCCESS' : roll < 0.90 ? 'FAILURE' : roll < 0.98 ? 'TIMEOUT' : 'PENDING';
    } else {
      status = roll < 0.85 ? 'SUCCESS' : roll < 0.95 ? 'FAILURE' : roll < 0.98 ? 'TIMEOUT' : 'PENDING';
    }

    const isError = status === 'FAILURE' || status === 'TIMEOUT';
    const level = isError ? 'ERROR' : status === 'PENDING' ? 'WARN' : 'INFO';
    const durationMs = isError
      ? 3000 + Math.floor(Math.random() * 7000)    // 3–10s for errors
      : 50 + Math.floor(Math.random() * 450);       // 50–500ms for success

    const protocolErrors = ERROR_MESSAGES[ifc.protocol] || ERROR_MESSAGES['REST'];
    const errorMessage = isError ? protocolErrors[Math.floor(Math.random() * protocolErrors.length)] : null;
    const stackTrace = isError && Math.random() > 0.5 ? STACK_TRACES[Math.floor(Math.random() * STACK_TRACES.length)] : null;

    const payloads = REQUEST_PAYLOADS[ifc.protocol] || REQUEST_PAYLOADS['REST'];
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd InterfaceHub/server && npx jest tests/simulator/TransactionSimulator.test.ts --no-cache`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add InterfaceHub/server/src/simulator/ InterfaceHub/server/tests/simulator/
git commit -m "feat(interfacehub): add transaction simulator with error spike patterns"
```

---

### Task 8: Express Routes, Controllers & App Entry Point

**Files:**
- Create: `InterfaceHub/server/src/middleware/errorHandler.ts`
- Create: `InterfaceHub/server/src/controllers/dashboardController.ts`
- Create: `InterfaceHub/server/src/controllers/logController.ts`
- Create: `InterfaceHub/server/src/controllers/aiController.ts`
- Create: `InterfaceHub/server/src/controllers/interfaceController.ts`
- Create: `InterfaceHub/server/src/routes/dashboardRoutes.ts`
- Create: `InterfaceHub/server/src/routes/logRoutes.ts`
- Create: `InterfaceHub/server/src/routes/aiRoutes.ts`
- Create: `InterfaceHub/server/src/routes/interfaceRoutes.ts`
- Create: `InterfaceHub/server/src/app.ts`

- [ ] **Step 1: Create errorHandler.ts**

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message });
}
```

- [ ] **Step 2: Create dashboardController.ts**

```typescript
// src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { InterfaceService } from '../services/interfaceService';
import { LogService } from '../services/logService';
import { InterfaceStats } from '../models/types';

export function createDashboardController(interfaceService: InterfaceService, logService: LogService) {
  return {
    getStats(_req: Request, res: Response): void {
      const interfaces = interfaceService.getAll();
      const stats: InterfaceStats[] = interfaces.map(ifc => {
        const s = logService.getStatsByInterface(ifc.id);
        return {
          interfaceId: ifc.id,
          name: ifc.name,
          protocol: ifc.protocol,
          counterparty: ifc.counterparty,
          status: ifc.status as InterfaceStats['status'],
          totalLast24h: s.total,
          successLast24h: s.success,
          failureLast24h: s.failure,
          errorRate: s.total > 0 ? s.failure / s.total : 0,
          avgDurationMs: Math.round(s.avgDurationMs || 0),
        };
      });
      res.json(stats);
    },
  };
}
```

- [ ] **Step 3: Create logController.ts**

```typescript
// src/controllers/logController.ts
import { Request, Response } from 'express';
import { LogService } from '../services/logService';

export function createLogController(logService: LogService) {
  return {
    getRecent(req: Request, res: Response): void {
      const interfaceId = req.query.interfaceId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      if (interfaceId) {
        const logs = logService.getRecentByInterface(interfaceId, limit);
        res.json(logs);
      } else {
        const logs = logService.queryByFilters({}, undefined, limit);
        res.json(logs);
      }
    },

    getById(req: Request, res: Response): void {
      const log = logService.getById(req.params.id);
      if (!log) {
        res.status(404).json({ error: 'Log not found' });
        return;
      }
      res.json(log);
    },
  };
}
```

- [ ] **Step 4: Create aiController.ts**

```typescript
// src/controllers/aiController.ts
import { Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { LogService } from '../services/logService';
import { LogSearchEngine } from '../search/LogSearchEngine';
import { InterfaceService } from '../services/interfaceService';

export function createAIController(
  aiService: AIService,
  logService: LogService,
  searchEngine: LogSearchEngine,
  interfaceService: InterfaceService,
) {
  return {
    async nlSearch(req: Request, res: Response): Promise<void> {
      const question = req.body.question as string;
      if (!question) {
        res.status(400).json({ error: 'question is required' });
        return;
      }

      try {
        // Step 1: Claude converts NL to structured query
        const structuredQuery = await aiService.convertNLToQuery(question);

        // Step 2: Execute query against DB
        const dbResults = logService.queryByFilters(
          structuredQuery.filters,
          structuredQuery.timeRange,
          structuredQuery.limit || 50,
        );

        // Step 3: Also run keyword search for relevance boost
        const keywordResults = searchEngine.search(question, 20);
        const keywordIds = new Set(keywordResults.map(r => r.id));

        // Merge: DB results first, then keyword-only hits
        const resultIds = new Set(dbResults.map(r => r.id));
        const keywordOnlyLogs = keywordResults
          .filter(r => !resultIds.has(r.id))
          .map(r => logService.getById(r.id))
          .filter(Boolean);

        res.json({
          query: structuredQuery,
          results: [...dbResults, ...keywordOnlyLogs],
          totalCount: dbResults.length + keywordOnlyLogs.length,
        });
      } catch (err) {
        console.error('[AI NL Search Error]', err);
        res.status(500).json({ error: 'AI search failed', details: (err as Error).message });
      }
    },

    async rca(req: Request, res: Response): Promise<void> {
      const { transactionId } = req.body;
      if (!transactionId) {
        res.status(400).json({ error: 'transactionId is required' });
        return;
      }

      try {
        const log = logService.getById(transactionId);
        if (!log) {
          res.status(404).json({ error: 'Transaction not found' });
          return;
        }

        const ifc = interfaceService.getById(log.interfaceId);
        const recentLogs = logService.getRecentByInterface(log.interfaceId, 10);

        const result = await aiService.analyzeRCA({
          id: log.id,
          interfaceId: log.interfaceId,
          interfaceName: ifc?.name || log.interfaceId,
          status: log.status,
          errorMessage: log.errorMessage,
          stackTrace: log.stackTrace,
          requestPayload: log.requestPayload,
          responsePayload: log.responsePayload,
          recentRelatedLogs: recentLogs.map(l => ({
            timestamp: l.timestamp,
            status: l.status,
            errorMessage: l.errorMessage,
          })),
        });

        res.json(result);
      } catch (err) {
        console.error('[AI RCA Error]', err);
        res.status(500).json({ error: 'RCA analysis failed', details: (err as Error).message });
      }
    },
  };
}
```

- [ ] **Step 5: Create interfaceController.ts**

```typescript
// src/controllers/interfaceController.ts
import { Request, Response } from 'express';
import { InterfaceService } from '../services/interfaceService';

export function createInterfaceController(interfaceService: InterfaceService) {
  return {
    getAll(_req: Request, res: Response): void {
      res.json(interfaceService.getAll());
    },
    getById(req: Request, res: Response): void {
      const ifc = interfaceService.getById(req.params.id);
      if (!ifc) {
        res.status(404).json({ error: 'Interface not found' });
        return;
      }
      res.json(ifc);
    },
    updateStatus(req: Request, res: Response): void {
      const { status } = req.body;
      interfaceService.updateStatus(req.params.id, status);
      res.json({ success: true });
    },
  };
}
```

- [ ] **Step 6: Create route files**

```typescript
// src/routes/dashboardRoutes.ts
import { Router } from 'express';
import { InterfaceService } from '../services/interfaceService';
import { LogService } from '../services/logService';
import { createDashboardController } from '../controllers/dashboardController';

export function dashboardRoutes(interfaceService: InterfaceService, logService: LogService): Router {
  const router = Router();
  const ctrl = createDashboardController(interfaceService, logService);
  router.get('/stats', ctrl.getStats);
  return router;
}
```

```typescript
// src/routes/logRoutes.ts
import { Router } from 'express';
import { LogService } from '../services/logService';
import { createLogController } from '../controllers/logController';

export function logRoutes(logService: LogService): Router {
  const router = Router();
  const ctrl = createLogController(logService);
  router.get('/', ctrl.getRecent);
  router.get('/:id', ctrl.getById);
  return router;
}
```

```typescript
// src/routes/aiRoutes.ts
import { Router } from 'express';
import { AIService } from '../services/aiService';
import { LogService } from '../services/logService';
import { LogSearchEngine } from '../search/LogSearchEngine';
import { InterfaceService } from '../services/interfaceService';
import { createAIController } from '../controllers/aiController';

export function aiRoutes(
  aiService: AIService,
  logService: LogService,
  searchEngine: LogSearchEngine,
  interfaceService: InterfaceService,
): Router {
  const router = Router();
  const ctrl = createAIController(aiService, logService, searchEngine, interfaceService);
  router.post('/nl-search', ctrl.nlSearch);
  router.post('/rca', ctrl.rca);
  return router;
}
```

```typescript
// src/routes/interfaceRoutes.ts
import { Router } from 'express';
import { InterfaceService } from '../services/interfaceService';
import { createInterfaceController } from '../controllers/interfaceController';

export function interfaceRoutes(interfaceService: InterfaceService): Router {
  const router = Router();
  const ctrl = createInterfaceController(interfaceService);
  router.get('/', ctrl.getAll);
  router.get('/:id', ctrl.getById);
  router.patch('/:id/status', ctrl.updateStatus);
  return router;
}
```

- [ ] **Step 7: Create app.ts (entry point)**

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { getEnv } from './config/env';
import { getDb } from './config/database';
import { initializeSchema } from './db/schema';
import { seedInterfaces } from './db/seed';
import { InterfaceService } from './services/interfaceService';
import { LogService } from './services/logService';
import { AIService } from './services/aiService';
import { LogSearchEngine } from './search/LogSearchEngine';
import { TransactionSimulator } from './simulator/TransactionSimulator';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { logRoutes } from './routes/logRoutes';
import { aiRoutes } from './routes/aiRoutes';
import { interfaceRoutes } from './routes/interfaceRoutes';
import { errorHandler } from './middleware/errorHandler';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const env = getEnv();
const db = getDb();

// Initialize DB
initializeSchema();
seedInterfaces();

// Services
const interfaceService = new InterfaceService(db);
const logService = new LogService(db);
const searchEngine = new LogSearchEngine();

const indexSchema = {
  interfaces: interfaceService.getAll().map(i => i.id),
  protocols: ['REST', 'SOAP', 'MQ', 'BATCH', 'SFTP'],
  statuses: ['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING'],
  levels: ['INFO', 'WARN', 'ERROR'],
  counterparties: [...new Set(interfaceService.getAll().map(i => i.counterparty))],
};

const aiService = new AIService(env.ANTHROPIC_API_KEY, indexSchema);

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/dashboard', dashboardRoutes(interfaceService, logService));
app.use('/api/logs', logRoutes(logService));
app.use('/api/ai', aiRoutes(aiService, logService, searchEngine, interfaceService));
app.use('/api/interfaces', interfaceRoutes(interfaceService));

app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`[InterfaceHub] Server running on http://localhost:${env.PORT}`);

  // Start simulator if enabled
  if (env.SIMULATOR_ENABLED === 'true') {
    const interfaces = interfaceService.getAll().map(i => ({
      id: i.id, name: i.name, protocol: i.protocol, counterparty: i.counterparty,
    }));
    const simulator = new TransactionSimulator(logService, searchEngine, interfaces);
    simulator.start(env.SIMULATOR_INTERVAL_MS);
    console.log(`[InterfaceHub] Simulator running (${env.SIMULATOR_INTERVAL_MS}ms interval)`);
  }
});

export default app;
```

- [ ] **Step 8: Create jest.config.js**

```javascript
// jest.config.js (in InterfaceHub/server/)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
```

- [ ] **Step 9: Verify server starts**

Run: `cd InterfaceHub/server && ANTHROPIC_API_KEY=test-key npx tsx src/app.ts &`
Then: `curl http://localhost:4000/health`
Expected: `{"status":"ok"}`
Then: `curl http://localhost:4000/api/dashboard/stats`
Expected: JSON array with 4 interface stats
Then: Kill process

- [ ] **Step 10: Commit**

```bash
git add InterfaceHub/server/src/middleware/ InterfaceHub/server/src/controllers/ InterfaceHub/server/src/routes/ InterfaceHub/server/src/app.ts InterfaceHub/server/jest.config.js
git commit -m "feat(interfacehub): add Express routes, controllers, and app entry point"
```

---

## Chunk 3: Frontend Foundation (Tasks 9–11)

### Task 9: Client Project Scaffolding

**Files:**
- Create: `InterfaceHub/client/package.json`
- Create: `InterfaceHub/client/tsconfig.json`
- Create: `InterfaceHub/client/tsconfig.app.json`
- Create: `InterfaceHub/client/tsconfig.node.json`
- Create: `InterfaceHub/client/vite.config.ts`
- Create: `InterfaceHub/client/tailwind.config.js`
- Create: `InterfaceHub/client/postcss.config.js`
- Create: `InterfaceHub/client/index.html`
- Create: `InterfaceHub/client/src/main.tsx`
- Create: `InterfaceHub/client/src/index.css`
- Create: `InterfaceHub/client/src/lib/utils.ts`
- Create: `InterfaceHub/client/components.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "interfacehub-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig files**

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
```

- [ ] **Step 4: Create tailwind + postcss config**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create index.html and entry files**

```html
<!-- index.html -->
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InterfaceHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```typescript
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```json
// components.json (shadcn/ui config)
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": false
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 6: Install dependencies**

Run: `cd InterfaceHub/client && npm install`
Expected: node_modules created, no errors

- [ ] **Step 7: Commit**

```bash
git add InterfaceHub/client/package.json InterfaceHub/client/package-lock.json InterfaceHub/client/tsconfig*.json InterfaceHub/client/vite.config.ts InterfaceHub/client/tailwind.config.js InterfaceHub/client/postcss.config.js InterfaceHub/client/index.html InterfaceHub/client/src/main.tsx InterfaceHub/client/src/index.css InterfaceHub/client/src/lib/utils.ts InterfaceHub/client/components.json
git commit -m "chore(interfacehub): scaffold frontend with Vite, React, Tailwind"
```

---

### Task 10: Shared Types, API Client & shadcn/ui Components

**Files:**
- Create: `InterfaceHub/client/src/types/index.ts`
- Create: `InterfaceHub/client/src/api/client.ts`
- Create: `InterfaceHub/client/src/components/ui/card.tsx`
- Create: `InterfaceHub/client/src/components/ui/badge.tsx`
- Create: `InterfaceHub/client/src/components/ui/button.tsx`
- Create: `InterfaceHub/client/src/components/ui/input.tsx`

- [ ] **Step 1: Create types/index.ts**

```typescript
// src/types/index.ts
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
```

- [ ] **Step 2: Create api/client.ts**

```typescript
// src/api/client.ts
const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboardStats: () => request<import('../types').InterfaceStats[]>('/dashboard/stats'),

  getLogs: (params?: { interfaceId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.interfaceId) qs.set('interfaceId', params.interfaceId);
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<import('../types').TransactionLog[]>(`/logs?${qs}`);
  },

  getLogById: (id: string) => request<import('../types').TransactionLog>(`/logs/${id}`),

  nlSearch: (question: string) =>
    request<import('../types').NLSearchResponse>('/ai/nl-search', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  analyzeRCA: (transactionId: string) =>
    request<import('../types').RCAResult>('/ai/rca', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    }),
};
```

- [ ] **Step 3: Create shadcn/ui Card component**

```typescript
// src/components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-white shadow-sm', className)} {...props} />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
```

- [ ] **Step 4: Create shadcn/ui Badge component**

```typescript
// src/components/ui/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-900 text-white',
        success: 'border-transparent bg-green-500 text-white',
        warning: 'border-transparent bg-yellow-500 text-white',
        destructive: 'border-transparent bg-red-500 text-white',
        outline: 'text-slate-950',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 5: Create Button and Input components**

```typescript
// src/components/ui/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800',
        outline: 'border border-slate-200 bg-white hover:bg-slate-100',
        ghost: 'hover:bg-slate-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

```typescript
// src/components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 6: Commit**

```bash
git add InterfaceHub/client/src/types/ InterfaceHub/client/src/api/ InterfaceHub/client/src/components/ui/
git commit -m "feat(interfacehub): add frontend types, API client, and UI primitives"
```

---

### Task 11: Dashboard Components

**Files:**
- Create: `InterfaceHub/client/src/components/layout/Header.tsx`
- Create: `InterfaceHub/client/src/components/layout/Layout.tsx`
- Create: `InterfaceHub/client/src/components/dashboard/InterfaceCard.tsx`
- Create: `InterfaceHub/client/src/components/dashboard/InterfaceGrid.tsx`
- Create: `InterfaceHub/client/src/components/dashboard/DashboardStats.tsx`
- Create: `InterfaceHub/client/src/hooks/useDashboard.ts`

- [ ] **Step 1: Create Layout components**

```typescript
// src/components/layout/Header.tsx
export function Header() {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">InterfaceHub</h1>
          <p className="text-sm text-slate-500">AI 기반 금융 IT 인터페이스 통합관리</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          System Online
        </div>
      </div>
    </header>
  );
}
```

```typescript
// src/components/layout/Layout.tsx
import { Header } from './Header';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create useDashboard hook**

```typescript
// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { InterfaceStats } from '@/types';

export function useDashboard(pollIntervalMs: number = 5000) {
  const [stats, setStats] = useState<InterfaceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchStats, pollIntervalMs]);

  return { stats, loading, error, refetch: fetchStats };
}
```

- [ ] **Step 3: Create InterfaceCard**

```typescript
// src/components/dashboard/InterfaceCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InterfaceStats } from '@/types';

const statusConfig = {
  ACTIVE: { label: '정상', variant: 'success' as const },
  INACTIVE: { label: '비활성', variant: 'outline' as const },
  ERROR: { label: '오류', variant: 'destructive' as const },
};

const protocolColors: Record<string, string> = {
  REST: 'bg-blue-100 text-blue-800',
  MQ: 'bg-purple-100 text-purple-800',
  BATCH: 'bg-orange-100 text-orange-800',
  SFTP: 'bg-teal-100 text-teal-800',
  SOAP: 'bg-pink-100 text-pink-800',
};

interface InterfaceCardProps {
  stats: InterfaceStats;
  onClick: (interfaceId: string) => void;
}

export function InterfaceCard({ stats, onClick }: InterfaceCardProps) {
  const sc = statusConfig[stats.status];
  const errorPct = (stats.errorRate * 100).toFixed(1);

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onClick(stats.interfaceId)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${protocolColors[stats.protocol] || 'bg-gray-100'}`}>
            {stats.protocol}
          </span>
          <CardTitle className="text-base">{stats.name}</CardTitle>
        </div>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-slate-500">{stats.counterparty}</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.totalLast24h}</p>
            <p className="text-xs text-slate-500">처리량</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${parseFloat(errorPct) > 10 ? 'text-red-600' : 'text-slate-900'}`}>
              {errorPct}%
            </p>
            <p className="text-xs text-slate-500">에러율</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.avgDurationMs}<span className="text-sm font-normal">ms</span></p>
            <p className="text-xs text-slate-500">평균 응답</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create InterfaceGrid**

```typescript
// src/components/dashboard/InterfaceGrid.tsx
import { InterfaceCard } from './InterfaceCard';
import { InterfaceStats } from '@/types';

interface InterfaceGridProps {
  stats: InterfaceStats[];
  onCardClick: (interfaceId: string) => void;
}

export function InterfaceGrid({ stats, onCardClick }: InterfaceGridProps) {
  if (stats.length === 0) {
    return <p className="text-center text-slate-500">등록된 인터페이스가 없습니다.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(s => (
        <InterfaceCard key={s.interfaceId} stats={s} onClick={onCardClick} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create DashboardStats summary bar**

```typescript
// src/components/dashboard/DashboardStats.tsx
import { InterfaceStats } from '@/types';

interface DashboardStatsProps {
  stats: InterfaceStats[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const totalTransactions = stats.reduce((sum, s) => sum + s.totalLast24h, 0);
  const totalFailures = stats.reduce((sum, s) => sum + s.failureLast24h, 0);
  const overallErrorRate = totalTransactions > 0 ? (totalFailures / totalTransactions * 100).toFixed(1) : '0.0';
  const activeCount = stats.filter(s => s.status === 'ACTIVE').length;
  const errorCount = stats.filter(s => s.status === 'ERROR').length;

  return (
    <div className="mb-6 grid grid-cols-4 gap-4">
      {[
        { label: '전체 인터페이스', value: stats.length, sub: `활성 ${activeCount}` },
        { label: '24시간 처리량', value: totalTransactions.toLocaleString(), sub: '건' },
        { label: '전체 에러율', value: `${overallErrorRate}%`, sub: `실패 ${totalFailures}건` },
        { label: '이상 감지', value: errorCount, sub: errorCount > 0 ? '주의 필요' : '정상' },
      ].map((item, i) => (
        <div key={i} className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="text-2xl font-bold">{item.value}</p>
          <p className="text-xs text-slate-400">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add InterfaceHub/client/src/components/layout/ InterfaceHub/client/src/components/dashboard/ InterfaceHub/client/src/hooks/useDashboard.ts
git commit -m "feat(interfacehub): add dashboard layout, interface cards, and stats"
```

---

## Chunk 4: Frontend Search & RCA (Tasks 12–14)

### Task 12: Natural Language Search Components

**Files:**
- Create: `InterfaceHub/client/src/hooks/useLogSearch.ts`
- Create: `InterfaceHub/client/src/components/search/NLSearchBar.tsx`
- Create: `InterfaceHub/client/src/components/search/SearchResults.tsx`

- [ ] **Step 1: Create useLogSearch hook**

```typescript
// src/hooks/useLogSearch.ts
import { useState, useCallback } from 'react';
import { api } from '@/api/client';
import { NLSearchResponse } from '@/types';

export function useLogSearch() {
  const [result, setResult] = useState<NLSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (question: string) => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.nlSearch(question);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, search, clear };
}
```

- [ ] **Step 2: Create NLSearchBar**

```typescript
// src/components/search/NLSearchBar.tsx
import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NLSearchBarProps {
  onSearch: (question: string) => void;
  loading: boolean;
}

export function NLSearchBar({ onSearch, loading }: NLSearchBarProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim()) onSearch(question.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="자연어로 로그를 검색하세요 (예: '어제 오후 실패한 MQ 건 보여줘')"
        className="flex-1"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !question.trim()}>
        {loading ? '분석 중...' : 'AI 검색'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create SearchResults**

```typescript
// src/components/search/SearchResults.tsx
import { Badge } from '@/components/ui/badge';
import { NLSearchResponse, TransactionLog } from '@/types';

const statusVariant = {
  SUCCESS: 'success' as const,
  FAILURE: 'destructive' as const,
  TIMEOUT: 'warning' as const,
  PENDING: 'outline' as const,
};

interface SearchResultsProps {
  result: NLSearchResponse;
  onLogClick: (log: TransactionLog) => void;
}

export function SearchResults({ result, onLogClick }: SearchResultsProps) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          검색 결과: <span className="font-medium text-slate-900">{result.totalCount}건</span>
        </p>
        {result.query.filters && (
          <div className="flex gap-1">
            {Object.entries(result.query.filters)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {k}: {v}
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">시간</th>
              <th className="px-4 py-2 text-left font-medium">인터페이스</th>
              <th className="px-4 py-2 text-left font-medium">상태</th>
              <th className="px-4 py-2 text-left font-medium">레벨</th>
              <th className="px-4 py-2 text-left font-medium">응답시간</th>
              <th className="px-4 py-2 text-left font-medium">에러</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map(log => (
              <tr
                key={log.id}
                className="cursor-pointer border-t hover:bg-slate-50"
                onClick={() => onLogClick(log)}
              >
                <td className="px-4 py-2 font-mono text-xs">{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-2">{log.interfaceId}</td>
                <td className="px-4 py-2">
                  <Badge variant={statusVariant[log.status]}>{log.status}</Badge>
                </td>
                <td className="px-4 py-2">{log.level}</td>
                <td className="px-4 py-2">{log.durationMs}ms</td>
                <td className="max-w-xs truncate px-4 py-2 text-xs text-slate-500">
                  {log.errorMessage || '-'}
                </td>
              </tr>
            ))}
            {result.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add InterfaceHub/client/src/hooks/useLogSearch.ts InterfaceHub/client/src/components/search/
git commit -m "feat(interfacehub): add NL search bar and results table"
```

---

### Task 13: RCA Panel Components

**Files:**
- Create: `InterfaceHub/client/src/hooks/useRCA.ts`
- Create: `InterfaceHub/client/src/components/rca/RCAResult.tsx`
- Create: `InterfaceHub/client/src/components/rca/RCAPanel.tsx`

- [ ] **Step 1: Create useRCA hook**

```typescript
// src/hooks/useRCA.ts
import { useState, useCallback } from 'react';
import { api } from '@/api/client';
import { RCAResult } from '@/types';

export function useRCA() {
  const [result, setResult] = useState<RCAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeRCA(transactionId);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, clear };
}
```

- [ ] **Step 2: Create RCAResult component**

```typescript
// src/components/rca/RCAResult.tsx
import { Badge } from '@/components/ui/badge';
import { RCAResult as RCAResultType } from '@/types';

interface RCAResultProps {
  result: RCAResultType;
}

export function RCAResultDisplay({ result }: RCAResultProps) {
  const confidencePct = (result.confidence * 100).toFixed(0);
  const isLowConfidence = result.confidence < 0.6;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">AI 근본원인 분석</h4>
        <Badge variant={isLowConfidence ? 'warning' : 'success'}>
          신뢰도 {confidencePct}%
        </Badge>
      </div>

      {isLowConfidence && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          신뢰도가 낮습니다. 운영자의 추가 판단이 필요합니다.
        </div>
      )}

      <div>
        <h5 className="mb-2 text-sm font-medium text-slate-700">원인 후보</h5>
        <div className="space-y-2">
          {result.causes.map(cause => (
            <div key={cause.rank} className="rounded border p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                  {cause.rank}
                </span>
                <span className="font-medium">{cause.description}</span>
              </div>
              <p className="mt-1 pl-7 text-sm text-slate-500">{cause.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="mb-1 text-sm font-medium text-slate-700">권장 조치</h5>
        <p className="text-sm">{result.recommendation}</p>
      </div>

      <div>
        <h5 className="mb-1 text-sm font-medium text-slate-700">영향 범위</h5>
        <p className="text-sm">{result.impactScope}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create RCAPanel**

```typescript
// src/components/rca/RCAPanel.tsx
import { TransactionLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RCAResultDisplay } from './RCAResult';
import { useRCA } from '@/hooks/useRCA';

interface RCAPanelProps {
  selectedLog: TransactionLog | null;
  onClose: () => void;
}

export function RCAPanel({ selectedLog, onClose }: RCAPanelProps) {
  const { result, loading, error, analyze, clear } = useRCA();

  if (!selectedLog) return null;

  const isFailure = selectedLog.status === 'FAILURE' || selectedLog.status === 'TIMEOUT';

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] overflow-y-auto border-l bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">트랜잭션 상세</h3>
        <Button variant="ghost" size="sm" onClick={() => { clear(); onClose(); }}>
          닫기
        </Button>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">ID</span>
          <span className="font-mono text-xs">{selectedLog.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">인터페이스</span>
          <span>{selectedLog.interfaceId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">시간</span>
          <span>{new Date(selectedLog.timestamp).toLocaleString('ko-KR')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">상태</span>
          <Badge variant={selectedLog.status === 'SUCCESS' ? 'success' : 'destructive'}>
            {selectedLog.status}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">응답시간</span>
          <span>{selectedLog.durationMs}ms</span>
        </div>
        {selectedLog.errorMessage && (
          <div>
            <span className="text-slate-500">에러 메시지</span>
            <p className="mt-1 rounded bg-red-50 p-2 font-mono text-xs text-red-800">{selectedLog.errorMessage}</p>
          </div>
        )}
      </div>

      {isFailure && (
        <div className="border-t pt-4">
          {!result && !loading && (
            <Button onClick={() => analyze(selectedLog.id)} className="w-full">
              AI 근본원인 분석 실행
            </Button>
          )}
          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              AI가 로그를 분석하고 있습니다...
            </div>
          )}
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              분석 실패: {error}
            </div>
          )}
          {result && <RCAResultDisplay result={result} />}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add InterfaceHub/client/src/hooks/useRCA.ts InterfaceHub/client/src/components/rca/
git commit -m "feat(interfacehub): add AI RCA panel with confidence display"
```

---

### Task 14: Dashboard Page & App Assembly

**Files:**
- Create: `InterfaceHub/client/src/pages/Dashboard.tsx`
- Create: `InterfaceHub/client/src/App.tsx`

- [ ] **Step 1: Create Dashboard page**

```typescript
// src/pages/Dashboard.tsx
import { useState } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { InterfaceGrid } from '@/components/dashboard/InterfaceGrid';
import { NLSearchBar } from '@/components/search/NLSearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { RCAPanel } from '@/components/rca/RCAPanel';
import { useDashboard } from '@/hooks/useDashboard';
import { useLogSearch } from '@/hooks/useLogSearch';
import { TransactionLog } from '@/types';

export function Dashboard() {
  const { stats, loading } = useDashboard(5000);
  const { result: searchResult, loading: searchLoading, search } = useLogSearch();
  const [selectedLog, setSelectedLog] = useState<TransactionLog | null>(null);

  const handleCardClick = (interfaceId: string) => {
    search(`${interfaceId} 최근 로그`);
  };

  if (loading && stats.length === 0) {
    return <div className="py-12 text-center text-slate-500">로딩 중...</div>;
  }

  return (
    <div className={selectedLog ? 'mr-[480px]' : ''}>
      <DashboardStats stats={stats} />

      <div className="mb-6">
        <NLSearchBar onSearch={search} loading={searchLoading} />
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">인터페이스 현황</h2>
        <InterfaceGrid stats={stats} onCardClick={handleCardClick} />
      </section>

      {searchResult && (
        <section>
          <SearchResults result={searchResult} onLogClick={setSelectedLog} />
        </section>
      )}

      <RCAPanel selectedLog={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Create App.tsx**

```typescript
// src/App.tsx
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';

export default function App() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd InterfaceHub/client && npx tsc -b --noEmit && npx vite build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add InterfaceHub/client/src/pages/ InterfaceHub/client/src/App.tsx
git commit -m "feat(interfacehub): assemble dashboard page with search and RCA"
```

---

## Chunk 5: Docker & Final Assembly (Tasks 15–16)

### Task 15: Docker Compose Setup

**Files:**
- Create: `InterfaceHub/server/Dockerfile`
- Create: `InterfaceHub/client/Dockerfile`
- Create: `InterfaceHub/docker-compose.yml`

- [ ] **Step 1: Create server Dockerfile**

```dockerfile
# InterfaceHub/server/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc

EXPOSE 4000
CMD ["node", "dist/app.js"]
```

- [ ] **Step 2: Create client Dockerfile**

```dockerfile
# InterfaceHub/client/Dockerfile
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://server:4000;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
EXPOSE 80
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
# InterfaceHub/docker-compose.yml
version: "3.8"

services:
  server:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SIMULATOR_ENABLED=true
      - SIMULATOR_INTERVAL_MS=1000
    volumes:
      - server-data:/app/data

  client:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - server

volumes:
  server-data:
```

- [ ] **Step 4: Commit**

```bash
git add InterfaceHub/server/Dockerfile InterfaceHub/client/Dockerfile InterfaceHub/docker-compose.yml
git commit -m "feat(interfacehub): add Docker Compose for single-command startup"
```

---

### Task 16: README & Final Verification

**Files:**
- Create: `InterfaceHub/README.md`

- [ ] **Step 1: Create README.md**

```markdown
# InterfaceHub

AI 기반 보험사 금융 IT 인터페이스 통합관리 플랫폼

## 아키텍처

3계층 FO/MO/BO 구조:
- **FO (Front Office)**: React 대시보드 — 인터페이스 카드 그리드, 자연어 검색, AI RCA 패널
- **MO (Middle Office)**: Claude API — 자연어→구조화 쿼리 변환, 에러 근본원인 분석
- **BO (Back Office)**: Express API — 인터페이스 등록/관리, 로그 저장, 시뮬레이터

## 기술 스택

| 계층 | 기술 |
|------|------|
| Backend | Node.js + Express + TypeScript |
| Frontend | Vite + React + Tailwind + shadcn/ui |
| DB | SQLite (better-sqlite3) |
| 검색 | MiniSearch (키워드 기반 로그 검색) |
| AI | Claude API (Anthropic) |
| 인프라 | Docker Compose |

## 실행 방법

### Docker Compose (권장)

```bash
# .env 파일 생성
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env

# 실행
docker compose up --build
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000

### 로컬 개발

```bash
# 서버
cd server
cp .env.example .env  # ANTHROPIC_API_KEY 설정
npm install && npm run dev

# 클라이언트 (별도 터미널)
cd client
npm install && npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:4000

## 데모 시나리오

### 1. 통합 대시보드 확인
서버 시작 후 대시보드에서 4개 인터페이스 카드를 확인합니다. 시뮬레이터가 매초 트랜잭션을 생성하여 실시간으로 수치가 변합니다.

### 2. 자연어 로그 검색
검색바에 `"어제 오후 실패한 MQ 건 보여줘"` 입력 → Claude가 구조화 쿼리로 변환 → 결과 테이블 표시

### 3. AI 에러 RCA 분석
검색 결과에서 FAILURE 상태의 로그 클릭 → 우측 패널에서 "AI 근본원인 분석 실행" 클릭 → 원인/조치/영향범위 표시

### 4. 에러 스파이크 관찰
시뮬레이터가 30~90초마다 특정 인터페이스에 에러 스파이크를 발생시킵니다. 대시보드에서 에러율 급증을 관찰할 수 있습니다.

### 5. 다양한 검색 질문
- `"금감원 API 에러 로그"`
- `"응답시간 느린 건 보여줘"`
- `"증권사 MQ 최근 실패 원인"`

## 디렉터리 구조

```
InterfaceHub/
├── server/          # Express 백엔드
│   ├── src/
│   │   ├── config/      # 환경 설정, DB 연결
│   │   ├── db/          # 스키마, 시드 데이터
│   │   ├── models/      # TypeScript 타입
│   │   ├── services/    # 비즈니스 로직 (Interface, Log, AI)
│   │   ├── controllers/ # HTTP 핸들러
│   │   ├── routes/      # Express 라우터
│   │   ├── search/      # MiniSearch 기반 로그 검색 엔진
│   │   ├── simulator/   # 트랜잭션 시뮬레이터
│   │   └── middleware/   # 에러 핸들러
│   └── tests/
├── client/          # React 프론트엔드
│   └── src/
│       ├── api/         # API 클라이언트
│       ├── components/  # UI 컴포넌트 (dashboard, search, rca)
│       ├── hooks/       # React 커스텀 훅
│       ├── pages/       # 페이지 컴포넌트
│       └── types/       # 공유 타입
└── docker-compose.yml
```
```

- [ ] **Step 2: Verify full test suite passes**

Run: `cd InterfaceHub/server && npx jest --forceExit --detectOpenHandles`
Expected: All tests pass

- [ ] **Step 3: Verify dev server starts and serves frontend**

Run:
```bash
cd InterfaceHub/server && ANTHROPIC_API_KEY=test npx tsx src/app.ts &
cd InterfaceHub/client && npx vite build
```
Expected: Server starts on :4000, client builds successfully

- [ ] **Step 4: Commit**

```bash
git add InterfaceHub/README.md
git commit -m "docs(interfacehub): add README with architecture, setup, and demo scenarios"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 자연어 로그 검색 (Task 6, 8, 12) — Claude NL→구조화 쿼리 변환 + MiniSearch 키워드 보완
- [x] AI 에러 RCA 패널 (Task 6, 8, 13) — Claude 분석 with confidence score
- [x] FO 통합 대시보드 (Task 11, 14) — 4개 인터페이스 카드, 실시간 5초 폴링
- [x] 시드 데이터 시뮬레이터 (Task 7) — 1초 간격 + 에러 스파이크 패턴
- [x] AI 산출물 검증 가드레일 (Task 6) — Zod 스키마 검증, 위험 쿼리 차단
- [x] FO/MO/BO 3계층 구조 — 라우트 분리 (dashboard/ai/interfaces)
- [x] Docker Compose 단일 명령 실행 (Task 15)
- [x] OpenSearch 대체 → MiniSearch (UserServer 패턴 참조, Task 4)

**Placeholder scan:** No TBD/TODO found. All steps contain complete code.

**Type consistency:**
- `InterfaceStats`, `TransactionLog`, `StructuredQuery`, `RCAResult` — 서버/클라이언트 타입 일치 확인
- `LogSearchEngine.search()` → `LogSearchResult[]` — Task 4에서 정의, Task 8에서 사용
- `AIService.convertNLToQuery()` / `analyzeRCA()` — Task 6에서 정의, Task 8에서 호출
