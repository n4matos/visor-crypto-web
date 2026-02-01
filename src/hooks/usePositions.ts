import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export interface Position {
  id: string;
  user_id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  leverage: string;
  size: string;
  entry_price: string;
  mark_price: string;
  unrealized_pnl: string;
  unrealized_pnl_pct: string;
  margin: string;
  liquidation_price: string;
  funding_rate: string;
  funding_interval: string;
  updated_at: string;
}

interface PositionsSummary {
  total_pnl: number;
  total_margin: number;
  long_count: number;
  short_count: number;
}

interface UsePositionsReturn {
  positions: Position[];
  summary: PositionsSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchPositions: () => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function usePositions(): UsePositionsReturn {
  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<PositionsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [positionsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/positions`, { headers }),
        fetch(`${API_BASE_URL}/positions/summary`, { headers }),
      ]);

      if (positionsRes.status === 401 || summaryRes.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const positionsData = await positionsRes.json();
      const summaryData = await summaryRes.json();

      if (!positionsData.success) throw new Error(positionsData.error || 'Erro ao carregar posições');
      if (!summaryData.success) throw new Error(summaryData.error || 'Erro ao carregar resumo');

      setPositions(positionsData.data || []);
      setSummary(summaryData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar posições');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    positions,
    summary,
    isLoading,
    error,
    fetchPositions,
    clearError,
  };
}
