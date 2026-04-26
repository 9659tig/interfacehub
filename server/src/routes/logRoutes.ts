import { Router } from 'express';
import { createLogController } from '../controllers/logController';
import { LogService } from '../services/logService';

export function logRoutes(logService: LogService): Router {
  const router = Router();
  const ctrl = createLogController(logService);
  router.get('/', ctrl.getRecent);
  router.get('/:id', ctrl.getById);
  return router;
}
