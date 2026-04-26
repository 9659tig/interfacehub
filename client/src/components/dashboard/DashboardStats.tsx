import { InterfaceStats } from '@/types';

interface DashboardStatsProps {
  stats: InterfaceStats[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const totalTransactions = stats.reduce((sum, s) => sum + s.totalLast24h, 0);
  const totalFailures = stats.reduce((sum, s) => sum + s.failureLast24h, 0);
  const overallErrorRate = totalTransactions > 0 ? ((totalFailures / totalTransactions) * 100).toFixed(1) : '0.0';
  const activeCount = stats.filter((s) => s.status === 'ACTIVE').length;
  const errorCount = stats.filter((s) => s.status === 'ERROR').length;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: '전체 인터페이스', value: stats.length, sub: `활성 ${activeCount}` },
        { label: '24시간 처리량', value: totalTransactions.toLocaleString(), sub: '건' },
        { label: '전체 에러율', value: `${overallErrorRate}%`, sub: `실패 ${totalFailures}건` },
        { label: '이상 감지', value: errorCount, sub: errorCount > 0 ? '주의 필요' : '정상' },
      ].map((item, i) => (
        <div key={i} className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="text-2xl font-bold">{item.value}</p>
          <p className="text-xs text-slate-400">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
