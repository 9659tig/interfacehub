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
    return results.slice(0, limit).map((r) => ({
      id: r.id as string,
      score: r.score,
    }));
  }

  get size(): number {
    return this.index.documentCount;
  }
}
