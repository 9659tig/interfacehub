import { Request, Response } from 'express';
import { InterfaceService } from '../services/interfaceService';

export function createInterfaceController(interfaceService: InterfaceService) {
  return {
    getAll(_req: Request, res: Response): void {
      res.json(interfaceService.getAll());
    },
    getById(req: Request, res: Response): void {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ifc = interfaceService.getById(id);
      if (!ifc) {
        res.status(404).json({ error: 'Interface not found' });
        return;
      }
      res.json(ifc);
    },
    updateStatus(req: Request, res: Response): void {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      interfaceService.updateStatus(id, status);
      res.json({ success: true });
    },
  };
}
