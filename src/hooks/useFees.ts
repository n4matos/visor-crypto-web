import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export interface FeesSummary {
  maker_total: string;
  taker_total: string;
  maker_percent: number;
  taker_percent: number;
}

interface UseFeesReturn {
  fees: FeesSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchFees: (credentialId?: string) => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function useFees(): UseFeesReturn {
  const [fees, setFees] = useState<FeesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async (credentialId?: string) => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/fees/summary`);
      if (credentialId) url.searchParams.append('credential_id', credentialId);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Erro ao carregar taxas');

      setFees(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar taxas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fees,
    isLoading,
    error,
    fetchFees,
    clearError,
  };
}
