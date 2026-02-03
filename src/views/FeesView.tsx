import { useMemo, useEffect, useState } from 'react';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { ViewLoading, ViewError, PageHeader } from '@/components/shared';
import { useFees, useTransactions } from '@/hooks';
import { usePortfolio } from '@/contexts/PortfolioContext';
import type { Period } from '@/types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// Format currency
const formatCurrency = (value: number): string => {
  return `$${Math.abs(value).toFixed(2)}`;
};

export function FeesView() {
  const { activePortfolioId } = usePortfolio();
  const [period, setPeriod] = useState<Period>('30d');
  
  const { fees, isLoading: feesLoading, error: feesError, fetchFees } = useFees();
  const { summary: txSummary, isLoading: txLoading, error: txError, fetchSummary } = useTransactions();

  // Fetch data
  useEffect(() => {
    if (activePortfolioId) {
      fetchFees(activePortfolioId);
      fetchSummary(period, activePortfolioId);
    }
  }, [fetchFees, fetchSummary, period, activePortfolioId]);

  const isLoading = feesLoading || txLoading;
  const error = feesError || txError;

  // Fees calculations
  const feeStats = useMemo(() => {
    if (!fees) return { total: 0, maker: 0, taker: 0, makerPercent: 0, takerPercent: 0 };
    
    const maker = parseFloat(fees.maker_total);
    const taker = parseFloat(fees.taker_total);
    const total = maker + taker;
    
    return {
      total,
      maker,
      taker,
      makerPercent: total > 0 ? (maker / total) * 100 : 0,
      takerPercent: total > 0 ? (taker / total) * 100 : 0,
    };
  }, [fees]);

  // Period fees from transactions
  const periodFees = useMemo(() => {
    return txSummary ? parseFloat(txSummary.total_fees) : 0;
  }, [txSummary]);

  const displayFees = periodFees > 0 ? periodFees : feeStats.total;

  if (isLoading && !fees) {
    return <ViewLoading message="Carregando taxas..." />;
  }

  if (error) {
    return (
      <ViewError 
        error={error} 
        onRetry={() => {
          if (activePortfolioId) {
            fetchFees(activePortfolioId);
            fetchSummary(period, activePortfolioId);
          }
        }} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader 
        title="Trading Fees" 
        subtitle="Análise das taxas de negociação pagas"
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total em Taxas"
          value={formatCurrency(displayFees)}
          trend="neutral"
          icon={<Receipt className="w-5 h-5" />}
          highlight
        />
        <MetricCard
          label="Taxas Maker"
          value={formatCurrency((displayFees * feeStats.makerPercent) / 100)}
          subtitle={`${feeStats.makerPercent.toFixed(1)}% do total`}
          trend="positive"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Taxas Taker"
          value={formatCurrency((displayFees * feeStats.takerPercent) / 100)}
          subtitle={`${feeStats.takerPercent.toFixed(1)}% do total`}
          trend="negative"
          icon={<TrendingDown className="w-5 h-5" />}
        />
      </div>

      {/* Fees Distribution */}
      {displayFees > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card className="p-5 border border-border-default bg-surface-card">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-action-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Distribuição Maker vs Taker</h3>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { name: 'Maker', value: (displayFees * feeStats.makerPercent) / 100, color: '#34D399' },
                    { name: 'Taker', value: (displayFees * feeStats.takerPercent) / 100, color: '#F87171' },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--chart-axis-label)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-surface-card border border-border-default rounded-lg p-2 shadow-lg">
                        <p className="text-xs text-text-secondary">{payload[0].payload.name}</p>
                        <p className="text-sm font-mono font-medium text-text-primary">
                          ${(payload[0].value as number).toFixed(2)}
                        </p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="var(--status-success)" />
                    <Cell fill="var(--status-error)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Breakdown */}
          <Card className="p-5 border border-border-default bg-surface-card">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-action-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Breakdown de Taxas</h3>
            </div>
            <div className="space-y-5">
              <FeeBreakdownRow
                label="Maker (Limit Orders)"
                value={(displayFees * feeStats.makerPercent) / 100}
                percent={feeStats.makerPercent}
                color="bg-status-success"
                description="Ordens que adicionam liquidez ao order book"
              />
              <FeeBreakdownRow
                label="Taker (Market Orders)"
                value={(displayFees * feeStats.takerPercent) / 100}
                percent={feeStats.takerPercent}
                color="bg-status-error"
                description="Ordens que removem liquidez do order book"
              />
            </div>
            
            <div className="mt-6 p-4 bg-surface-card-alt/50 rounded-lg border border-border-default/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-action-primary-muted flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-action-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary mb-1">Dica de Economia</p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Use ordens <span className="text-status-success font-medium">limit (maker)</span> para pagar menos taxas. 
                    Elas geralmente têm taxas mais baixas que ordens <span className="text-status-error font-medium">market (taker)</span>.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 border border-border-default bg-surface-card text-center">
          <Receipt className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-medium text-text-primary mb-1">Nenhuma taxa registrada</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Você ainda não pagou taxas de trading no período selecionado. 
            As taxas aparecerão aqui após executar trades.
          </p>
        </Card>
      )}

      {/* Fee History Table Preview */}
      {txSummary && parseFloat(txSummary.total_trades) > 0 && (
        <Card className="p-5 border border-border-default bg-surface-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-action-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Resumo do Período</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {parseInt(txSummary.total_trades)} trades
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-surface-card-alt/50 rounded-lg">
              <p className="text-xs text-text-muted mb-1">Total Trades</p>
              <p className="text-lg font-mono font-semibold text-text-primary">
                {txSummary.total_trades}
              </p>
            </div>
            <div className="p-3 bg-surface-card-alt/50 rounded-lg">
              <p className="text-xs text-text-muted mb-1">Volume</p>
              <p className="text-lg font-mono font-semibold text-text-primary">
                ${parseFloat(txSummary.total_volume || '0').toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-surface-card-alt/50 rounded-lg">
              <p className="text-xs text-text-muted mb-1">Taxas</p>
              <p className="text-lg font-mono font-semibold text-status-error">
                ${parseFloat(txSummary.total_fees || '0').toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-surface-card-alt/50 rounded-lg">
              <p className="text-xs text-text-muted mb-1">PnL</p>
              <p className={cn(
                "text-lg font-mono font-semibold",
                parseFloat(txSummary.total_pnl || '0') >= 0 ? 'text-status-success' : 'text-status-error'
              )}>
                {parseFloat(txSummary.total_pnl || '0') >= 0 ? '+' : ''}
                ${parseFloat(txSummary.total_pnl || '0').toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Sub-components
interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  highlight?: boolean;
}

function MetricCard({ label, value, subtitle, trend, icon, highlight }: MetricCardProps) {
  return (
    <Card className={cn(
      "p-4 border",
      highlight ? 'border-action-primary/30 bg-action-primary-muted/10' : 'border-border-default bg-surface-card'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          trend === 'positive' ? 'bg-status-success/20 text-status-success' :
          trend === 'negative' ? 'bg-status-error/20 text-status-error' :
          'bg-surface-elevated text-text-secondary'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-xl font-bold font-mono text-text-primary">{value}</p>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

interface FeeBreakdownRowProps {
  label: string;
  value: number;
  percent: number;
  color: string;
  description: string;
}

function FeeBreakdownRow({ label, value, percent, color, description }: FeeBreakdownRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono text-text-primary">${value.toFixed(2)}</span>
          <span className="text-xs text-text-muted ml-2">({percent.toFixed(1)}%)</span>
        </div>
      </div>
      <p className="text-xs text-text-muted pl-5">{description}</p>
      <div className="h-2 bg-surface-card-alt rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
