import { Router } from 'express';
import { createAIController } from '../controllers/aiController';
import { LogSearchEngine } from '../search/LogSearchEngine';
import { AIService } from '../services/aiService';
import { InterfaceService } from '../services/interfaceService';
import { LogService } from '../services/logService';

export function aiRoutes(
  aiService: AIService,
  logService: LogService,
  searchEngine: LogSearchEngine,
  interfaceService: InterfaceService
): Router {
  const router = Router();
  const ctrl = createAIController(aiService, logService, searchEngine, interfaceService);
  router.post('/nl-search', ctrl.nlSearch);
  router.post('/rca', ctrl.rca);
  return router;
}
