import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export type FundingGroupBy = 'day' | 'week' | 'month';

export interface FundingTimeseriesDataPoint {
  date: string;
  total_funding: string;
  funding_paid: string;
  funding_received: string;
  transaction_count: number;
  symbols: string[];
}

export interface FundingTimeseriesSummary {
  total_net: string;
  total_paid: string;
  total_received: string;
  period_start: string;
  period_end: string;
}

export interface FundingTimeseriesResponse {
  currency: string;
  group_by: FundingGroupBy;
  data: FundingTimeseriesDataPoint[];
  summary: FundingTimeseriesSummary;
}

interface UseFundingTimeseriesReturn {
  data: FundingTimeseriesResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchTimeseries: (params: {
    currency: string;
    groupBy?: FundingGroupBy;
    startDate?: string;
    endDate?: string;
    credentialId?: string;
  }) => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function useFundingTimeseries(): UseFundingTimeseriesReturn {
  const [data, setData] = useState<FundingTimeseriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeseries = useCallback(async ({
    currency,
    groupBy = 'day',
    startDate,
    endDate,
    credentialId,
  }: {
    currency: string;
    groupBy?: FundingGroupBy;
    startDate?: string;
    endDate?: string;
    credentialId?: string;
  }) => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/funding/timeseries`);
      url.searchParams.append('currency', currency);
      url.searchParams.append('group_by', groupBy);
      if (startDate) url.searchParams.append('start_date', startDate);
      if (endDate) url.searchParams.append('end_date', endDate);
      if (credentialId) url.searchParams.append('credential_id', credentialId);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Erro ao carregar timeseries de funding');

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar timeseries de funding');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchTimeseries,
    clearError,
  };
}
