import { api } from '@/api/client';
import { RCAResult } from '@/types';
import { useCallback, useState } from 'react';

export function useRCA() {
  const [result, setResult] = useState<RCAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeRCA(transactionId);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, clear };
}
