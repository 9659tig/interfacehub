import { Router } from 'express';
import { createInterfaceController } from '../controllers/interfaceController';
import { InterfaceService } from '../services/interfaceService';

export function interfaceRoutes(interfaceService: InterfaceService): Router {
  const router = Router();
  const ctrl = createInterfaceController(interfaceService);
  router.get('/', ctrl.getAll);
  router.get('/:id', ctrl.getById);
  router.patch('/:id/status', ctrl.updateStatus);
  return router;
}
