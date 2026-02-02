import { useMemo, useEffect, useState } from 'react';
import { Receipt, DollarSign, TrendingDown, TrendingUp, Bitcoin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
import { ViewLoading, ViewError, PageHeader } from '@/components/shared';
import { useFunding, useFees, useTransactions } from '@/hooks';
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
  PieChart,
  Pie,
  Legend,
} from 'recharts';

// Helper to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { 'USDT': '$', 'BTC': '\u20BF', 'ETH': '\u039E', 'SOL': '\u25CE' };
  return symbols[currency] || currency;
};

// Period to display label
const getPeriodLabel = (period: Period): string => {
  switch (period) {
    case '24h': return 'Hoje';
    case '7d': return 'Semana';
    case '30d': return 'Mes';
    case '90d': return 'Trimestre';
    case '1y': return 'Ano';
    case 'all': return 'Total';
    default: return 'Periodo';
  }
};

import { usePortfolio } from '@/contexts/PortfolioContext';

export function CustosView() {
  const { activePortfolioId } = usePortfolio();
  const [period, setPeriod] = useState<Period>('30d');
  const { funding, isLoading: fundingLoading, error: fundingError, fetchFunding } = useFunding();
  const { fees, isLoading: feesLoading, error: feesError, fetchFees } = useFees();
  const { summary: txSummary, isLoading: txLoading, error: txError, fetchSummary } = useTransactions();

  useEffect(() => {
    if (activePortfolioId) {
      fetchFunding(activePortfolioId);
      fetchFees(activePortfolioId);
      fetchSummary(period, activePortfolioId);
    }
  }, [fetchFunding, fetchFees, fetchSummary, period, activePortfolioId]);

  const isLoading = fundingLoading || feesLoading || txLoading;
  const error = fundingError || feesError || txError;

  // --- Funding calculations ---
  const { usdtFunding, otherFunding } = useMemo(() => {
    const usdt = funding.filter(f => f.currency === 'USDT');
    const other = funding.filter(f => f.currency !== 'USDT');
    return { usdtFunding: usdt, otherFunding: other };
  }, [funding]);

  const fundingTotals = useMemo(() => {
    const today = usdtFunding.reduce((sum, f) => sum + parseFloat(f.today), 0);
    const week = usdtFunding.reduce((sum, f) => sum + parseFloat(f.week), 0);
    const month = usdtFunding.reduce((sum, f) => sum + parseFloat(f.month), 0);
    const all = usdtFunding.reduce((sum, f) => sum + parseFloat(f.total), 0);

    let periodValue = month;
    switch (period) {
      case '24h': periodValue = today; break;
      case '7d': periodValue = week; break;
      case '30d': periodValue = month; break;
      case '90d': case '1y': case 'all': periodValue = all !== 0 ? all : month; break;
    }

    return { totalToday: today, totalWeek: week, periodTotal: periodValue };
  }, [usdtFunding, period]);

  // Funding chart data
  const fundingChartData = useMemo(() => {
    let field: 'today' | 'week' | 'month' | 'total' = 'month';
    switch (period) {
      case '24h': field = 'today'; break;
      case '7d': field = 'week'; break;
      case '30d': field = 'month'; break;
      case '90d': case '1y': case 'all': field = 'total'; break;
    }
    return usdtFunding.map(f => ({
      symbol: f.symbol.replace('USDT', '').replace('USD', ''),
      value: parseFloat(f[field]),
      today: parseFloat(f.today),
      week: parseFloat(f.week),
      month: parseFloat(f.month),
      total: parseFloat(f.total),
    }));
  }, [usdtFunding, period]);

  // --- Fee calculations ---
  const feeBreakdown = useMemo(() => {
    if (!fees) return { totalFees: 0, makerTotal: 0, takerTotal: 0, makerPercent: 0, takerPercent: 0 };
    const maker = parseFloat(fees.maker_total);
    const taker = parseFloat(fees.taker_total);
    return { totalFees: maker + taker, makerTotal: maker, takerTotal: taker, makerPercent: fees.maker_percent, takerPercent: fees.taker_percent };
  }, [fees]);

  const periodFees = useMemo(() => txSummary ? parseFloat(txSummary.total_fees) : 0, [txSummary]);
  const displayTotalFees = periodFees > 0 ? periodFees : feeBreakdown.totalFees;

  const periodMakerTotal = useMemo(() => {
    if (feeBreakdown.totalFees === 0) return 0;
    return (periodFees * feeBreakdown.makerTotal) / feeBreakdown.totalFees;
  }, [periodFees, feeBreakdown]);

  const periodTakerTotal = useMemo(() => {
    if (feeBreakdown.totalFees === 0) return 0;
    return (periodFees * feeBreakdown.takerTotal) / feeBreakdown.totalFees;
  }, [periodFees, feeBreakdown]);

  const pieData = useMemo(() => [
    { name: 'Maker', value: periodMakerTotal || feeBreakdown.makerTotal, color: 'var(--status-success)' },
    { name: 'Taker', value: periodTakerTotal || feeBreakdown.takerTotal, color: 'var(--status-error)' },
  ], [periodMakerTotal, periodTakerTotal, feeBreakdown]);

  // --- Combined ---
  const totalCosts = displayTotalFees + Math.abs(fundingTotals.periodTotal < 0 ? fundingTotals.periodTotal : 0);

  const impactOnPnl = useMemo(() => {
    const pnl = txSummary ? parseFloat(txSummary.total_pnl) : 0;
    if (pnl === 0) return 0;
    return (displayTotalFees / Math.abs(pnl)) * 100;
  }, [displayTotalFees, txSummary]);

  const periodLabel = getPeriodLabel(period);

  if (isLoading && !fees && funding.length === 0) {
    return <ViewLoading message="Carregando custos..." />;
  }

  if (error) {
    return <ViewError error={error} onRetry={() => {
      if (activePortfolioId) {
        fetchFunding(activePortfolioId);
        fetchFees(activePortfolioId);
        fetchSummary(period, activePortfolioId);
      }
    }} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Custos de Trading" subtitle="Acompanhe todas as taxas e custos das suas operacoes">
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={`Custos Totais (${periodLabel})`}
          value={`$${totalCosts.toFixed(2)}`}
          icon={<Receipt className="w-5 h-5" />}
          variant="error"
        />
        <MetricCard
          title={`Trading Fees (${periodLabel})`}
          value={`$${displayTotalFees.toFixed(2)}`}
          icon={<Receipt className="w-5 h-5" />}
          variant="warning"
        />
        <MetricCard
          title={`Funding (${periodLabel})`}
          value={`$${Math.abs(fundingTotals.periodTotal).toFixed(2)}`}
          change={{ value: fundingTotals.periodTotal, percent: 0 }}
          icon={<DollarSign className="w-5 h-5" />}
          variant={fundingTotals.periodTotal >= 0 ? 'success' : 'error'}
        />
      </div>

      {/* Impact on PnL */}
      {impactOnPnl > 0 && (
        <Card className="p-4 border border-status-error/30 bg-status-error-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-status-error/20">
                <TrendingDown className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <span className="text-sm text-text-secondary">Impacto no PnL</span>
                <p className="text-lg font-bold font-mono text-status-error">
                  {impactOnPnl.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-sm text-text-muted max-w-xs text-right">
              Taxas de trading representam {impactOnPnl.toFixed(1)}% do seu PnL no periodo
            </p>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="trading" className="space-y-4">
        <TabsList className="bg-surface-card-alt border border-border-default">
          <TabsTrigger value="trading" className="data-[state=active]:bg-action-primary data-[state=active]:text-white">
            Trading Fees
          </TabsTrigger>
          <TabsTrigger value="funding" className="data-[state=active]:bg-action-primary data-[state=active]:text-white">
            Funding
          </TabsTrigger>
        </TabsList>

        {/* Tab: Trading Fees */}
        <TabsContent value="trading">
          {displayTotalFees > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-5 border border-border-default bg-surface-card">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Resumo de Taxas ({periodLabel})</h2>
                  <p className="text-sm text-text-secondary">Total acumulado de taxas pagas no periodo</p>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-6xl font-bold text-status-error font-mono mb-2">
                      ${displayTotalFees.toFixed(2)}
                    </p>
                    <p className="text-text-secondary">Total em taxas ({periodLabel})</p>
                    {period !== 'all' && feeBreakdown.totalFees > 0 && (
                      <p className="text-xs text-text-muted mt-2">
                        Total historico: ${feeBreakdown.totalFees.toFixed(2)}
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
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                            <span className="text-sm text-text-secondary">{payload[0].name}</span>
                          </div>
                          <p className="text-sm font-mono font-medium text-text-primary">${(payload[0].value as number).toFixed(2)}</p>
                        </div>
                      ) : null} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  <FeeRow label="Maker" value={periodMakerTotal || feeBreakdown.makerTotal} percent={feeBreakdown.makerPercent} color="bg-status-success" />
                  <FeeRow label="Taker" value={periodTakerTotal || feeBreakdown.takerTotal} percent={feeBreakdown.takerPercent} color="bg-status-error" />
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 border border-border-default bg-surface-card text-center">
              <p className="text-text-secondary">Nenhuma taxa registrada no periodo selecionado.</p>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Funding */}
        <TabsContent value="funding">
          <div className="space-y-6">
            {/* Funding status */}
            <Card className={cn("p-5 border transition-all duration-200",
              fundingTotals.periodTotal >= 0
                ? "border-status-success/30 bg-status-success-muted"
                : "border-status-error/30 bg-status-error-muted"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-text-secondary">Status ({periodLabel})</span>
                  <p className={cn("text-2xl font-bold font-mono mt-1",
                    fundingTotals.periodTotal >= 0 ? "text-status-success" : "text-status-error"
                  )}>
                    {fundingTotals.periodTotal >= 0 ? 'FAVORAVEL' : 'DESFAVORAVEL'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {fundingTotals.periodTotal >= 0
                      ? 'Voce esta recebendo mais funding do que pagando'
                      : 'Voce esta pagando mais funding do que recebendo'}
                  </p>
                </div>
                {fundingTotals.periodTotal >= 0
                  ? <TrendingUp className="w-5 h-5 text-status-success" />
                  : <TrendingDown className="w-5 h-5 text-status-error" />}
              </div>
            </Card>

            {/* Funding bar chart */}
            {fundingChartData.length > 0 && (
              <Card className="p-5 border border-border-default bg-surface-card">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Funding por Ativo ({periodLabel})</h2>
                  <p className="text-sm text-text-secondary">Valores em USDT - Contratos perpetuos margem USDT</p>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fundingChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="symbol" tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }} />
                      <YAxis tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
                          <p className="text-xs text-text-secondary mb-2">Funding ({periodLabel}) - USDT</p>
                          <p className={cn("text-sm font-mono font-medium", (payload[0].value as number) >= 0 ? "text-status-success" : "text-status-error")}>
                            ${(payload[0].value as number).toFixed(4)}
                          </p>
                        </div>
                      ) : null} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {fundingChartData.map((d, i) => (
                          <Cell key={i} fill={d.value >= 0 ? 'var(--status-success)' : 'var(--status-error)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* USDT Funding Breakdown */}
            {usdtFunding.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Breakdown por Ativo (USDT)</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {usdtFunding.map((asset) => {
                    const displayValue = getFundingDisplayValue(asset, period);
                    return (
                      <Card key={asset.symbol} className={cn("p-5 border transition-all duration-200 card-hover",
                        displayValue >= 0 ? "border-status-success/30 bg-status-success-muted/50" : "border-status-error/30 bg-status-error-muted/50"
                      )}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-text-primary">{asset.symbol.replace('USDT', '')}</h3>
                          <Badge variant={displayValue >= 0 ? 'default' : 'destructive'}
                            className={displayValue >= 0 ? "bg-status-success/20 text-status-success border-status-success/30" : ""}>
                            {displayValue >= 0 ? 'RECEBENDO' : 'PAGANDO'}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <FundingRow label="Hoje" value={parseFloat(asset.today)} currency="USDT" />
                          <FundingRow label="Semana" value={parseFloat(asset.week)} currency="USDT" />
                          <FundingRow label="Mes" value={parseFloat(asset.month)} currency="USDT" isHighlight />
                          <FundingRow label="Total" value={parseFloat(asset.total)} currency="USDT" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Currencies */}
            {otherFunding.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Funding em Outras Moedas</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Estes valores sao pagos na moeda base do contrato (nao convertidos para USDT)
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {otherFunding.map((asset) => {
                    const displayValue = getFundingDisplayValue(asset, period);
                    return (
                      <Card key={asset.symbol} className={cn("p-5 border transition-all duration-200 card-hover",
                        displayValue >= 0 ? "border-status-success/30 bg-status-success-muted/50" : "border-status-error/30 bg-status-error-muted/50"
                      )}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Bitcoin className="w-5 h-5 text-text-secondary" />
                            <h3 className="text-lg font-semibold text-text-primary">{asset.symbol}</h3>
                          </div>
                          <Badge variant={displayValue >= 0 ? 'default' : 'destructive'}
                            className={displayValue >= 0 ? "bg-status-success/20 text-status-success border-status-success/30" : ""}>
                            {displayValue >= 0 ? 'RECEBENDO' : 'PAGANDO'}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <FundingRow label="Hoje" value={parseFloat(asset.today)} currency={asset.currency} />
                          <FundingRow label="Semana" value={parseFloat(asset.week)} currency={asset.currency} />
                          <FundingRow label="Mes" value={parseFloat(asset.month)} currency={asset.currency} isHighlight />
                          <FundingRow label="Total" value={parseFloat(asset.total)} currency={asset.currency} />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {funding.length === 0 && (
              <Card className="p-8 border border-border-default bg-surface-card text-center">
                <p className="text-text-secondary">Nenhum dado de funding disponivel.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Helper functions & sub-components ---

function getFundingDisplayValue(asset: { today: string; week: string; month: string; total: string }, period: Period): number {
  switch (period) {
    case '24h': return parseFloat(asset.today);
    case '7d': return parseFloat(asset.week);
    case '30d': return parseFloat(asset.month);
    case '90d': case '1y': case 'all': return parseFloat(asset.total) || parseFloat(asset.month);
    default: return parseFloat(asset.month);
  }
}

interface FundingRowProps {
  label: string;
  value: number;
  currency: string;
  isHighlight?: boolean;
}

function FundingRow({ label, value, currency, isHighlight }: FundingRowProps) {
  const symbol = getCurrencySymbol(currency);
  const isUSDT = currency === 'USDT';

  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", isHighlight ? "text-text-primary font-medium" : "text-text-secondary")}>{label}</span>
      <span className={cn("text-sm font-mono font-medium", value >= 0 ? "text-status-success" : "text-status-error")}>
        {isUSDT ? (
          `$${Math.abs(value).toFixed(4)}`
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-text-muted">{symbol}</span>
            {Math.abs(value).toFixed(8)} {currency}
          </span>
        )}
      </span>
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
