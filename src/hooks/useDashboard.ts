import { useState, useCallback } from 'react';
import type { Period } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

interface DashboardSummary {
  currentEquityUSD: number;
  currentEquityBTC: number;
  totalReturnUSD: number;
  totalReturnBTC: number;
  todayPnL: number;
  weekPnL: number;
  monthPnL: number;
  openPositions: number;
  totalPositions: number;
}

interface EquityPoint {
  date: string;
  equityUSD: number;
  equityBTC: number;
  pnlCumulative: number;
}

interface EquityCurveData {
  points: EquityPoint[];
  metadata: {
    totalPoints: number;
    startDate: string;
    endDate: string;
  };
}

interface PerformanceMetrics {
  totalReturn: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
  bestTrade: number;
  worstTrade: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

interface UseDashboardReturn {
  summary: DashboardSummary | null;
  equityCurve: EquityCurveData | null;
  performance: PerformanceMetrics | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: (period?: Period) => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function useDashboard(): UseDashboardReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityCurveData | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (period: Period = 'all') => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch all three endpoints in parallel
      const [summaryRes, equityRes, performanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/summary`, { headers }),
        fetch(`${API_BASE_URL}/dashboard/equity-curve?period=${period}`, { headers }),
        fetch(`${API_BASE_URL}/dashboard/performance?period=${period}`, { headers }),
      ]);

      // Check for auth errors
      if (summaryRes.status === 401 || equityRes.status === 401 || performanceRes.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Parse responses
      const summaryData = await summaryRes.json();
      const equityData = await equityRes.json();
      const performanceData = await performanceRes.json();

      // Check for API errors
      if (!summaryData.success) throw new Error(summaryData.error || 'Erro ao carregar resumo');
      if (!equityData.success) throw new Error(equityData.error || 'Erro ao carregar equity curve');
      if (!performanceData.success) throw new Error(performanceData.error || 'Erro ao carregar performance');

      setSummary(summaryData.data);
      setEquityCurve(equityData.data);
      setPerformance(performanceData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    summary,
    equityCurve,
    performance,
    isLoading,
    error,
    fetchDashboardData,
    clearError,
  };
}
