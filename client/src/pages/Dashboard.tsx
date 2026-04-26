import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { InterfaceGrid } from '@/components/dashboard/InterfaceGrid';
import { RCAPanel } from '@/components/rca/RCAPanel';
import { NLSearchBar } from '@/components/search/NLSearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useDashboard } from '@/hooks/useDashboard';
import { useLogSearch } from '@/hooks/useLogSearch';
import { TransactionLog } from '@/types';
import { useState } from 'react';

export function Dashboard() {
  const { stats, loading } = useDashboard(5000);
  const { result: searchResult, loading: searchLoading, search } = useLogSearch();
  const [selectedLog, setSelectedLog] = useState<TransactionLog | null>(null);

  const handleCardClick = (interfaceId: string) => {
    search(`${interfaceId} 최근 로그`);
  };

  if (loading && stats.length === 0) {
    return <div className="py-12 text-center text-slate-500">로딩 중...</div>;
  }

  return (
    <div className={selectedLog ? 'sm:mr-[480px]' : ''}>
      <DashboardStats stats={stats} />

      <div className="mb-6">
        <NLSearchBar onSearch={search} loading={searchLoading} />
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">인터페이스 현황</h2>
        <InterfaceGrid stats={stats} onCardClick={handleCardClick} />
      </section>

      {searchResult && (
        <section>
          <SearchResults result={searchResult} onLogClick={setSelectedLog} />
        </section>
      )}

      <RCAPanel selectedLog={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
