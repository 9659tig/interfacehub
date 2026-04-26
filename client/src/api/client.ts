const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';
const BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboardStats: () => request<import('../types').InterfaceStats[]>('/dashboard/stats'),

  getLogs: (params?: { interfaceId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.interfaceId) {
      qs.set('interfaceId', params.interfaceId);
    }
    if (params?.limit) {
      qs.set('limit', String(params.limit));
    }
    return request<import('../types').TransactionLog[]>(`/logs?${qs}`);
  },

  getLogById: (id: string) => request<import('../types').TransactionLog>(`/logs/${id}`),

  nlSearch: (question: string) =>
    request<import('../types').NLSearchResponse>('/ai/nl-search', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  analyzeRCA: (transactionId: string) =>
    request<import('../types').RCAResult>('/ai/rca', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    }),
};
