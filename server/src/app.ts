import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from './config/database';
import { getEnv } from './config/env';
import { createAIController } from './controllers/aiController';
import { initializeSchema } from './db/schema';
import { seedInterfaces } from './db/seed';
import { errorHandler } from './middleware/errorHandler';
import { LogSearchEngine } from './search/LogSearchEngine';
import { InterfaceService } from './services/interfaceService';
import { LogService } from './services/logService';
import { AIService } from './services/aiService';
import { TransactionSimulator } from './simulator/TransactionSimulator';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { logRoutes } from './routes/logRoutes';
import { aiRoutes } from './routes/aiRoutes';
import { interfaceRoutes } from './routes/interfaceRoutes';

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const env = getEnv();
const db = getDb();

initializeSchema();
seedInterfaces();

const interfaceService = new InterfaceService(db);
const logService = new LogService(db);
const searchEngine = new LogSearchEngine();

const interfaces = interfaceService.getAll();
const indexSchema = {
  interfaces: interfaces.map((i) => i.id),
  protocols: ['REST', 'SOAP', 'MQ', 'BATCH', 'SFTP'],
  statuses: ['SUCCESS', 'FAILURE', 'TIMEOUT', 'PENDING'],
  levels: ['INFO', 'WARN', 'ERROR'],
  counterparties: [...new Set(interfaces.map((i) => i.counterparty))],
};

const aiService = new AIService({
  provider: env.AI_PROVIDER,
  indexSchema,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModel: env.GEMINI_MODEL,
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/dashboard', dashboardRoutes(interfaceService, logService));
app.use('/api/logs', logRoutes(logService));
app.use('/api/ai', aiRoutes(aiService, logService, searchEngine, interfaceService));
app.use('/api/interfaces', interfaceRoutes(interfaceService));

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`[InterfaceHub] Server running on http://localhost:${env.PORT}`);

    if (env.SIMULATOR_ENABLED === 'true') {
      const simInterfaces = interfaceService.getAll().map((i) => ({
        id: i.id,
        name: i.name,
        protocol: i.protocol,
        counterparty: i.counterparty,
      }));

      const simulator = new TransactionSimulator(logService, searchEngine, simInterfaces);
      simulator.start(env.SIMULATOR_INTERVAL_MS);
      console.log(`[InterfaceHub] Simulator running (${env.SIMULATOR_INTERVAL_MS}ms interval)`);
    }
  });
}

export default app;
