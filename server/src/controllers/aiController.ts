import { Request, Response } from 'express';
import { LogSearchEngine } from '../search/LogSearchEngine';
import { AIService } from '../services/aiService';
import { InterfaceService } from '../services/interfaceService';
import { LogService } from '../services/logService';

export function createAIController(
  aiService: AIService,
  logService: LogService,
  searchEngine: LogSearchEngine,
  interfaceService: InterfaceService
) {
  return {
    async nlSearch(req: Request, res: Response): Promise<void> {
      const question = req.body.question as string;
      if (!question) {
        res.status(400).json({ error: 'question is required' });
        return;
      }

      try {
        const structuredQuery = await aiService.convertNLToQuery(question);
        const dbResults = logService.queryByFilters(
          structuredQuery.filters,
          structuredQuery.timeRange,
          structuredQuery.limit || 50
        );

        const keywordResults = searchEngine.search(question, 20);
        const resultIds = new Set(dbResults.map((r) => r.id));
        const keywordOnlyLogs = keywordResults
          .filter((r) => !resultIds.has(r.id))
          .map((r) => logService.getById(r.id))
          .filter((r) => Boolean(r));

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
          recentRelatedLogs: recentLogs.map((l) => ({
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
