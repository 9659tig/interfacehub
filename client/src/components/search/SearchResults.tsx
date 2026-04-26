import { Badge } from '@/components/ui/badge';
import { NLSearchResponse, TransactionLog } from '@/types';

const statusVariant = {
  SUCCESS: 'success' as const,
  FAILURE: 'destructive' as const,
  TIMEOUT: 'warning' as const,
  PENDING: 'outline' as const,
};

interface SearchResultsProps {
  result: NLSearchResponse;
  onLogClick: (log: TransactionLog) => void;
}

export function SearchResults({ result, onLogClick }: SearchResultsProps) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          검색 결과: <span className="font-medium text-slate-900">{result.totalCount}건</span>
        </p>
        {result.query.filters && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(result.query.filters)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {k}: {v}
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">시간</th>
              <th className="px-4 py-2 text-left font-medium">인터페이스</th>
              <th className="px-4 py-2 text-left font-medium">상태</th>
              <th className="px-4 py-2 text-left font-medium">레벨</th>
              <th className="px-4 py-2 text-left font-medium">응답시간</th>
              <th className="px-4 py-2 text-left font-medium">에러</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((log) => (
              <tr key={log.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => onLogClick(log)}>
                <td className="px-4 py-2 font-mono text-xs">{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-2">{log.interfaceId}</td>
                <td className="px-4 py-2">
                  <Badge variant={statusVariant[log.status]}>{log.status}</Badge>
                </td>
                <td className="px-4 py-2">{log.level}</td>
                <td className="px-4 py-2">{log.durationMs}ms</td>
                <td className="max-w-xs truncate px-4 py-2 text-xs text-slate-500">{log.errorMessage || '-'}</td>
              </tr>
            ))}
            {result.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
