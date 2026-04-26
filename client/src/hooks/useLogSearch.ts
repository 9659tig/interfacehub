import { api } from '@/api/client';
import { NLSearchResponse } from '@/types';
import { useCallback, useState } from 'react';

export function useLogSearch() {
  const [result, setResult] = useState<NLSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (question: string) => {
    if (!question.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.nlSearch(question);
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

  return { result, loading, error, search, clear };
}
