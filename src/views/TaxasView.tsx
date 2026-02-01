import { useState, useMemo, useEffect } from 'react';
import { Receipt, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
import { useFees, useTransactions } from '@/hooks';
import type { Period } from '@/types';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export function TaxasView() {
  const [period, setPeriod] = useState<Period>('30d');
  const { fees, isLoading: feesLoading, error: feesError, fetchFees } = useFees();
  const { summary: txSummary, isLoading: txLoading, error: txError, fetchSummary } = useTransactions();

  // Fetch data on component mount and when period changes
  useEffect(() => {
    fetchFees();
    fetchSummary(period);
  }, [fetchFees, fetchSummary, period]);

  const isLoading = feesLoading || txLoading;
  const error = feesError || txError;

  // Calculate fee breakdown from API data
  const { totalFees, makerTotal, takerTotal, makerPercent, takerPercent } = useMemo(() => {
    if (!fees) {
      return { totalFees: 0, makerTotal: 0, takerTotal: 0, makerPercent: 0, takerPercent: 0 };
    }
    
    const maker = parseFloat(fees.maker_total);
    const taker = parseFloat(fees.taker_total);
    const total = maker + taker;
    
    return {
      totalFees: total,
      makerTotal: maker,
      takerTotal: taker,
      makerPercent: fees.maker_percent,
      takerPercent: fees.taker_percent,
    };
  }, [fees]);

  // Get fees from transaction summary for the selected period
  const periodFees = useMemo(() => {
    return txSummary ? parseFloat(txSummary.total_fees) : 0;
  }, [txSummary]);

  // For display, use the larger value or period-specific value
  const displayTotal = periodFees > 0 ? periodFees : totalFees;

  // Estimate maker/taker breakdown for the period based on overall ratio
  const periodMakerTotal = useMemo(() => {
    if (totalFees === 0) return 0;
    return (periodFees * makerTotal) / totalFees;
  }, [periodFees, totalFees, makerTotal]);

  const periodTakerTotal = useMemo(() => {
    if (totalFees === 0) return 0;
    return (periodFees * takerTotal) / totalFees;
  }, [periodFees, totalFees, takerTotal]);

  const pieData = useMemo(() => [
    { name: 'Maker', value: periodMakerTotal || makerTotal, color: 'var(--status-success)' }, 
    { name: 'Taker', value: periodTakerTotal || takerTotal, color: 'var(--status-error)' }
  ], [periodMakerTotal, makerTotal, periodTakerTotal, takerTotal]);

  // Calculate impact on PnL for the period
  const impactOnPnl = useMemo(() => {
    const pnl = txSummary ? parseFloat(txSummary.total_pnl) : 0;
    if (pnl === 0) return 0;
    return (periodFees / Math.abs(pnl)) * 100;
  }, [periodFees, txSummary]);

  // Get period label for display
  const periodLabel = useMemo(() => {
    switch (period) {
      case '24h': return '24H';
      case '7d': return '7D';
      case '30d': return '30D';
      case '90d': return '90D';
      case '1y': return '1A';
      case 'all': return 'Total';
      default: return 'Período';
    }
  }, [period]);

  if (isLoading && !fees) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
        <p className="text-text-secondary">Carregando dados de taxas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="flex items-center gap-2 text-status-error">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
        <Button 
          onClick={() => {
            fetchFees();
            fetchSummary(period);
          }} 
          variant="outline" 
          className="border-border-default"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Taxas de Trading</h1>
          <p className="text-text-secondary">Acompanhe quanto você paga em taxas de trading</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title={`Taxas ${periodLabel}`} 
          value={`$${displayTotal.toFixed(2)}`} 
          icon={<Receipt className="w-5 h-5" />} 
          variant="error" 
        />
        <MetricCard 
          title="Taxas Maker" 
          value={`$${(periodMakerTotal || makerTotal).toFixed(2)}`} 
          icon={<Receipt className="w-5 h-5" />} 
          variant="warning" 
        />
        <MetricCard 
          title="Taxas Taker" 
          value={`$${(periodTakerTotal || takerTotal).toFixed(2)}`} 
          icon={<Receipt className="w-5 h-5" />} 
          variant="error" 
        />
        <MetricCard 
          title="Impacto no PnL" 
          value={`${impactOnPnl.toFixed(1)}%`} 
          icon={<TrendingDown className="w-5 h-5" />} 
          variant="warning" 
        />
      </div>

      {displayTotal > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5 border border-border-default bg-surface-card">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Resumo de Taxas ({periodLabel})</h2>
              <p className="text-sm text-text-secondary">Total acumulado de taxas pagas no período</p>
            </div>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-status-error mb-2">
                  ${displayTotal.toFixed(2)}
                </p>
                <p className="text-text-secondary">Total em taxas ({periodLabel})</p>
                {period !== 'all' && totalFees > 0 && (
                  <p className="text-xs text-text-muted mt-2">
                    Total histórico: ${totalFees.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-border-default bg-surface-card">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Breakdown ({periodLabel})</h2>
              <p className="text-sm text-text-secondary">Maker vs Taker fees</p>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value"
                  >
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                        <span className="text-sm text-text-secondary">{payload[0].name}</span>
                      </div>
                      <p className="text-sm font-mono font-medium text-text-primary">${(payload[0].value as number).toFixed(2)}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {((payload[0].value as number) / ((periodMakerTotal || makerTotal) + (periodTakerTotal || takerTotal)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ) : null} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              <FeeRow label="Maker" value={periodMakerTotal || makerTotal} percent={makerPercent} color="bg-status-success" />
              <FeeRow label="Taker" value={periodTakerTotal || takerTotal} percent={takerPercent} color="bg-status-error" />
            </div>
          </Card>
        </div>
      )}

      {displayTotal === 0 && (
        <Card className="p-8 border border-border-default bg-surface-card text-center">
          <p className="text-text-secondary">Nenhuma taxa registrada no período selecionado.</p>
        </Card>
      )}
    </div>
  );
}

interface FeeRowProps {
  label: string;
  value: number;
  percent: number;
  color: string;
}

function FeeRow({ label, value, percent, color }: FeeRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", color)} />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-mono font-medium text-text-primary">${value.toFixed(2)}</span>
        <span className="text-xs text-text-muted ml-2">{percent.toFixed(1)}%</span>
      </div>
    </div>
  );
}
