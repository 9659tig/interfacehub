import { useRCA } from '@/hooks/useRCA';
import { TransactionLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RCAResultDisplay } from './RCAResult';

interface RCAPanelProps {
  selectedLog: TransactionLog | null;
  onClose: () => void;
}

export function RCAPanel({ selectedLog, onClose }: RCAPanelProps) {
  const { result, loading, error, analyze, clear } = useRCA();

  if (!selectedLog) {
    return null;
  }

  const isFailure = selectedLog.status === 'FAILURE' || selectedLog.status === 'TIMEOUT';

  return (
    <div className="fixed inset-y-0 right-0 w-full overflow-y-auto border-l bg-white p-6 shadow-lg sm:w-[480px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">트랜잭션 상세</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clear();
            onClose();
          }}
        >
          닫기
        </Button>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">ID</span>
          <span className="font-mono text-xs">{selectedLog.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">인터페이스</span>
          <span>{selectedLog.interfaceId}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">시간</span>
          <span>{new Date(selectedLog.timestamp).toLocaleString('ko-KR')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">상태</span>
          <Badge variant={selectedLog.status === 'SUCCESS' ? 'success' : 'destructive'}>{selectedLog.status}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">응답시간</span>
          <span>{selectedLog.durationMs}ms</span>
        </div>
        {selectedLog.errorMessage && (
          <div>
            <span className="text-slate-500">에러 메시지</span>
            <p className="mt-1 rounded bg-red-50 p-2 font-mono text-xs text-red-800">{selectedLog.errorMessage}</p>
          </div>
        )}
      </div>

      {isFailure && (
        <div className="border-t pt-4">
          {!result && !loading && (
            <Button onClick={() => analyze(selectedLog.id)} className="w-full">
              AI 근본원인 분석 실행
            </Button>
          )}
          {loading && <div className="py-8 text-center text-sm text-slate-500">AI가 로그를 분석하고 있습니다...</div>}
          {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">분석 실패: {error}</div>}
          {result && <RCAResultDisplay result={result} />}
        </div>
      )}
    </div>
  );
}
