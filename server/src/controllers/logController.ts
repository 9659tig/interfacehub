import { Request, Response } from 'express';
import { LogService } from '../services/logService';

export function createLogController(logService: LogService) {
  return {
    getRecent(req: Request, res: Response): void {
      const interfaceId = req.query.interfaceId as string | undefined;
      const limit = Number.parseInt(req.query.limit as string, 10) || 50;

      if (interfaceId) {
        const logs = logService.getRecentByInterface(interfaceId, limit);
        res.json(logs);
      } else {
        const logs = logService.queryByFilters({}, undefined, limit);
        res.json(logs);
      }
    },

    getById(req: Request, res: Response): void {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const log = logService.getById(id);
      if (!log) {
        res.status(404).json({ error: 'Log not found' });
        return;
      }
      res.json(log);
    },
  };
}
