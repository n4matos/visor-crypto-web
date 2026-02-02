import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export interface FundingSummary {
  symbol: string;
  currency: string;
  today: string;
  week: string;
  month: string;
  total: string;
}

interface UseFundingReturn {
  funding: FundingSummary[];
  isLoading: boolean;
  error: string | null;
  fetchFunding: (credentialId?: string) => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function useFunding(): UseFundingReturn {
  const [funding, setFunding] = useState<FundingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunding = useCallback(async (credentialId?: string) => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/funding/summary`);
      if (credentialId) url.searchParams.append('credential_id', credentialId);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Erro ao carregar funding');

      setFunding(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funding');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    funding,
    isLoading,
    error,
    fetchFunding,
    clearError,
  };
}
