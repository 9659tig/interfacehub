import { Badge } from '@/components/ui/badge';
import { RCAResult as RCAResultType } from '@/types';

interface RCAResultProps {
  result: RCAResultType;
}

export function RCAResultDisplay({ result }: RCAResultProps) {
  const confidencePct = (result.confidence * 100).toFixed(0);
  const isLowConfidence = result.confidence < 0.6;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">AI 근본원인 분석</h4>
        <Badge variant={isLowConfidence ? 'warning' : 'success'}>신뢰도 {confidencePct}%</Badge>
      </div>

      {isLowConfidence && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          신뢰도가 낮습니다. 운영자의 추가 판단이 필요합니다.
        </div>
      )}

      <div>
        <h5 className="mb-2 text-sm font-medium text-slate-700">원인 후보</h5>
        <div className="space-y-2">
          {result.causes.map((cause) => (
            <div key={cause.rank} className="rounded border p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                  {cause.rank}
                </span>
                <span className="font-medium">{cause.description}</span>
              </div>
              <p className="mt-1 pl-7 text-sm text-slate-500">{cause.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="mb-1 text-sm font-medium text-slate-700">권장 조치</h5>
        <p className="text-sm">{result.recommendation}</p>
      </div>

      <div>
        <h5 className="mb-1 text-sm font-medium text-slate-700">영향 범위</h5>
        <p className="text-sm">{result.impactScope}</p>
      </div>
    </div>
  );
}
