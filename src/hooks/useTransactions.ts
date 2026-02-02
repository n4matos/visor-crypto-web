import { useState, useCallback } from 'react';
import type { Period } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export interface Transaction {
  id: string;
  user_id: string;
  bybit_id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  type: 'TRADE' | 'SETTLEMENT' | 'FEE' | 'TRANSFER' | 'REBATE' | 'BONUS';
  qty: string;
  price: string;
  fee: string;
  funding: string;
  currency: string;
  executed_at: string;
  created_at: string;
}

interface TransactionSummary {
  total_trades: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  total_pnl: string;
  total_fees: string;
  total_funding: string;
  avg_win: string;
  avg_loss: string;
  profit_factor: number;
  best_trade: string;
  worst_trade: string;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  summary: TransactionSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (params?: { limit?: number; offset?: number; symbol?: string; type?: string }, credentialId?: string) => Promise<void>;
  fetchSummary: (period?: Period, credentialId?: string) => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (params: { limit?: number; offset?: number; symbol?: string; type?: string } = {}, credentialId?: string) => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.offset) queryParams.set('offset', params.offset.toString());
      if (params.symbol) queryParams.set('symbol', params.symbol);
      if (params.type) queryParams.set('type', params.type);
      if (credentialId) queryParams.set('credential_id', credentialId);

      const url = `${API_BASE_URL}/transactions?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Erro ao carregar transações');

      setTransactions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (period: Period = '30d', credentialId?: string) => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/transactions/summary`);
      url.searchParams.append('period', period);
      if (credentialId) url.searchParams.append('credential_id', credentialId);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Erro ao carregar resumo');

      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar resumo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    transactions,
    summary,
    isLoading,
    error,
    fetchTransactions,
    fetchSummary,
    clearError,
  };
}
