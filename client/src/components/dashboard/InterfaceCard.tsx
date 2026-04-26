import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterfaceStats } from '@/types';

const statusConfig = {
  ACTIVE: { label: '정상', variant: 'success' as const },
  INACTIVE: { label: '비활성', variant: 'outline' as const },
  ERROR: { label: '오류', variant: 'destructive' as const },
};

const protocolColors: Record<string, string> = {
  REST: 'bg-blue-100 text-blue-800',
  MQ: 'bg-indigo-100 text-indigo-800',
  BATCH: 'bg-orange-100 text-orange-800',
  SFTP: 'bg-teal-100 text-teal-800',
  SOAP: 'bg-rose-100 text-rose-800',
};

interface InterfaceCardProps {
  stats: InterfaceStats;
  onClick: (interfaceId: string) => void;
}

export function InterfaceCard({ stats, onClick }: InterfaceCardProps) {
  const sc = statusConfig[stats.status];
  const errorPct = (stats.errorRate * 100).toFixed(1);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onClick(stats.interfaceId)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${protocolColors[stats.protocol] || 'bg-gray-100'}`}>
            {stats.protocol}
          </span>
          <CardTitle className="text-base">{stats.name}</CardTitle>
        </div>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-slate-500">{stats.counterparty}</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.totalLast24h}</p>
            <p className="text-xs text-slate-500">처리량</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${Number.parseFloat(errorPct) > 10 ? 'text-red-600' : 'text-slate-900'}`}>
              {errorPct}%
            </p>
            <p className="text-xs text-slate-500">에러율</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {stats.avgDurationMs}
              <span className="text-sm font-normal">ms</span>
            </p>
            <p className="text-xs text-slate-500">평균 응답</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
