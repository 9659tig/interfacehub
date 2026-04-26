import { Router } from 'express';
import { createDashboardController } from '../controllers/dashboardController';
import { InterfaceService } from '../services/interfaceService';
import { LogService } from '../services/logService';

export function dashboardRoutes(interfaceService: InterfaceService, logService: LogService): Router {
  const router = Router();
  const ctrl = createDashboardController(interfaceService, logService);
  router.get('/stats', ctrl.getStats);
  return router;
}
