import { useState, useCallback } from 'react';
import type { EquityDataPoint } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export interface BTCTimeseriesPoint {
  date: string;
  btcAmount: number;
  btcValueUSD: number;
  pnlCumulative: number;
}

export interface BTCTimeseriesData {
  points: BTCTimeseriesPoint[];
  currentBTC: number;
  currentValueUSD: number;
  totalChangeBTC: number;
  totalChangePercent: number;
  avgDailyChange: number;
  bestDay: { date: string; change: number } | null;
  worstDay: { date: string; change: number } | null;
}

export interface BTCSummary {
  currentBTC: number;
  currentValueUSD: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  avgEntryPrice: number;
  daysAccumulating: number;
  btcGoal?: number;
  progressToGoal?: number;
}

interface UseBTCTimeseriesReturn {
  timeseries: BTCTimeseriesData | null;
  summary: BTCSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchBTCTimeseries: (credentialId: string | null, period?: string) => Promise<void>;
}

export function useBTCTimeseries(): UseBTCTimeseriesReturn {
  const [timeseries, setTimeseries] = useState<BTCTimeseriesData | null>(null);
  const [summary, setSummary] = useState<BTCSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBTCTimeseries = useCallback(async (
    credentialId: string | null,
    period: string = '30d'
  ) => {
    if (!credentialId) {
      setTimeseries(null);
      setSummary(null);
      return;
    }

    // Ler token diretamente do localStorage no momento da requisição
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError('Token de autenticação não encontrado');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Usar o endpoint equity-curve existente que retorna equityBTC
      const response = await fetch(
        `${API_BASE_URL}/dashboard/equity-curve?credential_id=${credentialId}&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch BTC timeseries data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch BTC timeseries data');
      }

      const equityPoints: EquityDataPoint[] = result.data.points || [];
      
      if (equityPoints.length === 0) {
        setTimeseries(null);
        setSummary(null);
        return;
      }

      // Converter equity points para BTC timeseries points
      const btcPoints: BTCTimeseriesPoint[] = equityPoints.map((point: EquityDataPoint) => ({
        date: point.date,
        btcAmount: point.equityBTC,
        btcValueUSD: point.equityUSD,
        pnlCumulative: point.pnlCumulative,
      }));

      // Calcular métricas de mudança diária
      const dailyChanges: { date: string; change: number }[] = [];
      for (let i = 1; i < btcPoints.length; i++) {
        dailyChanges.push({
          date: btcPoints[i].date,
          change: btcPoints[i].btcAmount - btcPoints[i - 1].btcAmount,
        });
      }

      // Melhor e pior dia
      const sortedByChange = [...dailyChanges].sort((a, b) => b.change - a.change);
      const bestDay = sortedByChange.length > 0 ? sortedByChange[0] : null;
      const worstDay = sortedByChange.length > 0 ? sortedByChange[sortedByChange.length - 1] : null;

      // Média diária
      const totalChange = btcPoints[btcPoints.length - 1].btcAmount - btcPoints[0].btcAmount;
      const avgDailyChange = dailyChanges.length > 0 
        ? dailyChanges.reduce((sum, d) => sum + d.change, 0) / dailyChanges.length 
        : 0;

      // Calcular total change percent
      const firstBTC = btcPoints[0].btcAmount;
      const lastBTC = btcPoints[btcPoints.length - 1].btcAmount;
      const totalChangePercent = firstBTC > 0 ? ((lastBTC - firstBTC) / firstBTC) * 100 : 0;

      // Construir timeseries data
      const timeseriesData: BTCTimeseriesData = {
        points: btcPoints,
        currentBTC: lastBTC,
        currentValueUSD: btcPoints[btcPoints.length - 1].btcValueUSD,
        totalChangeBTC: totalChange,
        totalChangePercent,
        avgDailyChange,
        bestDay,
        worstDay,
      };

      // Calcular summary
      // Estimativa de cost basis baseada no valor médio
      const firstPoint = btcPoints[0];
      const currentPoint = btcPoints[btcPoints.length - 1];
      
      // Estimativa simplificada: se o equity cresceu em USD e BTC, 
      // assumimos que o preço médio de entrada é aproximadamente
      // o valor inicial em USD dividido pelo BTC inicial (ou valor atual se inicial for 0)
      const estimatedAvgEntryPrice = firstPoint.btcAmount > 0 
        ? firstPoint.btcValueUSD / firstPoint.btcAmount 
        : (currentPoint.btcAmount > 0 ? currentPoint.btcValueUSD / currentPoint.btcAmount : 0);

      const costBasis = estimatedAvgEntryPrice * currentPoint.btcAmount;
      const unrealizedPnL = currentPoint.btcValueUSD - costBasis;
      const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

      // Calcular dias acumulando
      const firstDate = new Date(btcPoints[0].date);
      const lastDate = new Date(btcPoints[btcPoints.length - 1].date);
      const daysAccumulating = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

      const summaryData: BTCSummary = {
        currentBTC: lastBTC,
        currentValueUSD: currentPoint.btcValueUSD,
        costBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
        avgEntryPrice: estimatedAvgEntryPrice,
        daysAccumulating,
      };

      setTimeseries(timeseriesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeseries(null);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    timeseries,
    summary,
    isLoading,
    error,
    fetchBTCTimeseries,
  };
}
