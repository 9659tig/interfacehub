import { InterfaceStats } from '@/types';
import { InterfaceCard } from './InterfaceCard';

interface InterfaceGridProps {
  stats: InterfaceStats[];
  onCardClick: (interfaceId: string) => void;
}

export function InterfaceGrid({ stats, onCardClick }: InterfaceGridProps) {
  if (stats.length === 0) {
    return <p className="text-center text-slate-500">등록된 인터페이스가 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <InterfaceCard key={s.interfaceId} stats={s} onClick={onCardClick} />
      ))}
    </div>
  );
}
