import { Request, Response } from 'express';
import { InterfaceStats } from '../models/types';
import { InterfaceService } from '../services/interfaceService';
import { LogService } from '../services/logService';

export function createDashboardController(interfaceService: InterfaceService, logService: LogService) {
  return {
    getStats(_req: Request, res: Response): void {
      const interfaces = interfaceService.getAll();
      const stats: InterfaceStats[] = interfaces.map((ifc) => {
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
