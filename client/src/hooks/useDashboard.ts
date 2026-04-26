import { api } from '@/api/client';
import { InterfaceStats } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useDashboard(pollIntervalMs: number = 5000) {
  const [stats, setStats] = useState<InterfaceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchStats, pollIntervalMs]);

  return { stats, loading, error, refetch: fetchStats };
}
