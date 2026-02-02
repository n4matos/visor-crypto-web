import { useMemo, useEffect, useState } from 'react';
import { Receipt, DollarSign, TrendingDown, TrendingUp, ArrowRightLeft, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';

import { ViewLoading, ViewError, PageHeader } from '@/components/shared';
import { useFunding, useFees, useTransactions } from '@/hooks';
import type { Period } from '@/types';
import { usePortfolio } from '@/contexts/PortfolioContext';
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

  Area,
  AreaChart,
} from 'recharts';

// Helper to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { 'USDT': '$', 'BTC': '₿', 'ETH': 'Ξ', 'SOL': '◎' };
  return symbols[currency] || currency;
};

// Period to display label
const getPeriodLabel = (period: Period): string => {
  const labels: Record<Period, string> = {
    '24h': '24H',
    '7d': '7D',
    '30d': '30D',
    '90d': '90D',
    '1y': '1A',
    'all': 'TUDO'
  };
  return labels[period];
};

const getPeriodFullLabel = (period: Period): string => {
  const labels: Record<Period, string> = {
    '24h': 'Últimas 24 horas',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '1y': 'Último ano',
    'all': 'Todo período'
  };
  return labels[period];
};



export function CustosView() {
  const { activePortfolioId } = usePortfolio();
  const [period, setPeriod] = useState<Period>('30d');
  const [activeFundingTab, setActiveFundingTab] = useState<'usdt' | 'other'>('usdt');
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

    return { today, week, month, all, periodValue };
  }, [usdtFunding, period]);

  // Waterfall chart data - shows funding evolution across periods
  const fundingWaterfallData = useMemo(() => {
    const periods: { key: 'today' | 'week' | 'month' | 'total'; label: string; shortLabel: string }[] = [
      { key: 'today', label: 'Hoje', shortLabel: '24H' },
      { key: 'week', label: '7 Dias', shortLabel: '7D' },
      { key: 'month', label: '30 Dias', shortLabel: '30D' },
      { key: 'total', label: 'Total', shortLabel: 'TUDO' },
    ];

    return periods.map(p => {
      const value = usdtFunding.reduce((sum, f) => sum + parseFloat(f[p.key]), 0);
      return {
        period: p.label,
        shortPeriod: p.shortLabel,
        value,
        absValue: Math.abs(value),
        isPositive: value >= 0,
      };
    });
  }, [usdtFunding]);

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
  const totalCosts = displayTotalFees + Math.abs(fundingTotals.periodValue < 0 ? fundingTotals.periodValue : 0);

  const impactOnPnl = useMemo(() => {
    const pnl = txSummary ? parseFloat(txSummary.total_pnl) : 0;
    if (pnl === 0) return 0;
    return (displayTotalFees / Math.abs(pnl)) * 100;
  }, [displayTotalFees, txSummary]);

  // Calculate funding trend
  const fundingTrend = useMemo(() => {
    if (fundingWaterfallData.length < 2) return { direction: 'neutral' as const, change: 0 };
    const current = fundingWaterfallData[fundingWaterfallData.length - 1].value;
    const previous = fundingWaterfallData[0].value;
    const change = current - previous;
    return {
      direction: change > 0 ? 'positive' as const : change < 0 ? 'negative' as const : 'neutral' as const,
      change
    };
  }, [fundingWaterfallData]);

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
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Custos de Trading" subtitle="Acompanhe taxas e funding das suas operações">
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      {/* Compact Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CompactMetricCard
          title="Custos Totais"
          value={`$${totalCosts.toFixed(2)}`}
          icon={<Receipt className="w-4 h-4" />}
          variant="error"
          subtitle={getPeriodLabel(period)}
        />
        <CompactMetricCard
          title="Trading Fees"
          value={`$${displayTotalFees.toFixed(2)}`}
          icon={<ArrowRightLeft className="w-4 h-4" />}
          variant="warning"
          subtitle={getPeriodLabel(period)}
        />
        <CompactMetricCard
          title="Funding"
          value={`$${Math.abs(fundingTotals.periodValue).toFixed(2)}`}
          icon={<DollarSign className="w-4 h-4" />}
          variant={fundingTotals.periodValue >= 0 ? 'success' : 'error'}
          subtitle={fundingTotals.periodValue >= 0 ? 'Recebendo' : 'Pagando'}
          trend={fundingTrend.direction}
        />
        <CompactMetricCard
          title="Impacto no PnL"
          value={impactOnPnl > 0 ? `${impactOnPnl.toFixed(1)}%` : '-'}
          icon={<TrendingDown className="w-4 h-4" />}
          variant={impactOnPnl > 10 ? 'error' : impactOnPnl > 5 ? 'warning' : 'default'}
          subtitle={impactOnPnl > 0 ? 'do lucro' : 'sem impacto'}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trading" className="space-y-4">
        <TabsList className="bg-surface-card-alt border border-border-default h-9">
          <TabsTrigger value="trading" className="text-xs data-[state=active]:bg-action-primary data-[state=active]:text-white">
            Trading Fees
          </TabsTrigger>
          <TabsTrigger value="funding" className="text-xs data-[state=active]:bg-action-primary data-[state=active]:text-white">
            Funding
          </TabsTrigger>
        </TabsList>

        {/* Tab: Trading Fees */}
        <TabsContent value="trading" className="space-y-3">
          {displayTotalFees > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Fee Summary Card */}
              <Card className="lg:col-span-2 p-4 border border-border-default bg-surface-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">Taxas Acumuladas</h2>
                    <p className="text-xs text-text-secondary">{getPeriodFullLabel(period)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-status-error font-mono">
                      ${displayTotalFees.toFixed(2)}
                    </p>
                    {period !== 'all' && feeBreakdown.totalFees > 0 && (
                      <p className="text-xs text-text-muted">
                        Total histórico: ${feeBreakdown.totalFees.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Fee trend visualization */}
                <div className="h-[180px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Maker', value: periodMakerTotal || feeBreakdown.makerTotal, type: 'Maker' },
                      { name: 'Taker', value: periodTakerTotal || feeBreakdown.takerTotal, type: 'Taker' },
                    ]}>
                      <defs>
                        <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--status-error)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--status-error)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis-label)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-surface-card border border-border-default rounded-lg p-2 shadow-lg">
                          <p className="text-xs text-text-secondary">{payload[0].payload.type}</p>
                          <p className="text-sm font-mono font-medium text-text-primary">${(payload[0].value as number).toFixed(2)}</p>
                        </div>
                      ) : null} />
                      <Area type="monotone" dataKey="value" stroke="var(--status-error)" fillOpacity={1} fill="url(#feeGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Fee Breakdown Card */}
              <Card className="p-4 border border-border-default bg-surface-card">
                <h2 className="text-sm font-semibold text-text-primary mb-1">Breakdown</h2>
                <p className="text-xs text-text-secondary mb-3">Maker vs Taker</p>
                
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={35} 
                        outerRadius={55} 
                        paddingAngle={3} 
                        dataKey="value"
                      >
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-surface-card border border-border-default rounded-lg p-2 shadow-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                            <span className="text-xs text-text-secondary">{payload[0].name}</span>
                          </div>
                          <p className="text-sm font-mono font-medium text-text-primary">${(payload[0].value as number).toFixed(2)}</p>
                        </div>
                      ) : null} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-2 space-y-2">
                  <CompactFeeRow label="Maker" value={periodMakerTotal || feeBreakdown.makerTotal} percent={feeBreakdown.makerPercent} color="bg-status-success" />
                  <CompactFeeRow label="Taker" value={periodTakerTotal || feeBreakdown.takerTotal} percent={feeBreakdown.takerPercent} color="bg-status-error" />
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6 border border-border-default bg-surface-card text-center">
              <p className="text-sm text-text-secondary">Nenhuma taxa registrada no período selecionado.</p>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Funding */}
        <TabsContent value="funding" className="space-y-3">
          {/* Funding Status Banner */}
          <Card className={cn("p-3 border",
            fundingTotals.periodValue >= 0
              ? "border-status-success/30 bg-status-success-muted/30"
              : "border-status-error/30 bg-status-error-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                  fundingTotals.periodValue >= 0 ? "bg-status-success/20" : "bg-status-error/20"
                )}>
                  {fundingTotals.periodValue >= 0 
                    ? <TrendingUp className="w-5 h-5 text-status-success" />
                    : <TrendingDown className="w-5 h-5 text-status-error" />
                  }
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Status do Funding</p>
                  <p className={cn("text-lg font-bold font-mono",
                    fundingTotals.periodValue >= 0 ? "text-status-success" : "text-status-error"
                  )}>
                    {fundingTotals.periodValue >= 0 ? 'FAVORÁVEL' : 'DESFAVORÁVEL'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-secondary">No período ({getPeriodLabel(period)})</p>
                <p className={cn("text-xl font-bold font-mono",
                  fundingTotals.periodValue >= 0 ? "text-status-success" : "text-status-error"
                )}>
                  {fundingTotals.periodValue >= 0 ? '+' : '-'}
                  ${Math.abs(fundingTotals.periodValue).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          {/* Funding Evolution Chart */}
          {fundingWaterfallData.some(d => d.value !== 0) && (
            <Card className="p-4 border border-border-default bg-surface-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Evolução do Funding</h2>
                  <p className="text-xs text-text-secondary">Comparativo por período (USDT)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-status-success/30 text-status-success">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Receber
                  </Badge>
                  <Badge variant="outline" className="text-xs border-status-error/30 text-status-error">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Pagar
                  </Badge>
                </div>
              </div>
              
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fundingWaterfallData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis 
                      dataKey="shortPeriod" 
                      tick={{ fill: 'var(--chart-axis-label)', fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={{ stroke: 'var(--chart-grid)' }} 
                    />
                    <YAxis 
                      tick={{ fill: 'var(--chart-axis-label)', fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `$${Math.abs(v).toFixed(0)}`} 
                    />
                    <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                      <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-text-secondary mb-1">{label}</p>
                        <p className={cn("text-sm font-mono font-medium",
                          (payload[0].payload as { isPositive: boolean }).isPositive ? "text-status-success" : "text-status-error"
                        )}>
                          {(payload[0].payload as { isPositive: boolean }).isPositive ? '+' : '-'}
                          ${(payload[0].payload as { absValue: number }).absValue.toFixed(4)}
                        </p>
                      </div>
                    ) : null} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {fundingWaterfallData.map((d, i) => (
                        <Cell key={i} fill={d.isPositive ? 'var(--status-success)' : 'var(--status-error)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Funding Tabs for USDT vs Other */}
          {funding.length > 0 && (
            <div className="space-y-3">
              {/* Tab selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveFundingTab('usdt')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    activeFundingTab === 'usdt'
                      ? "bg-action-primary text-white"
                      : "bg-surface-card-alt text-text-secondary hover:text-text-primary"
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  USDT ({usdtFunding.length})
                </button>
                {otherFunding.length > 0 && (
                  <button
                    onClick={() => setActiveFundingTab('other')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      activeFundingTab === 'other'
                        ? "bg-action-primary text-white"
                        : "bg-surface-card-alt text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Outras ({otherFunding.length})
                  </button>
                )}
              </div>

              {/* USDT Funding Table */}
              {activeFundingTab === 'usdt' && usdtFunding.length > 0 && (
                <Card className="border border-border-default bg-surface-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-default bg-surface-card-alt/50">
                          <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Ativo</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">24H</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">7D</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">30D</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Total</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usdtFunding
                          .sort((a, b) => Math.abs(parseFloat(b.total)) - Math.abs(parseFloat(a.total)))
                          .map((asset) => {
                            const displayValue = getFundingDisplayValue(asset, period);
                            return (
                              <tr key={asset.symbol} className="border-b border-border-default/50 hover:bg-surface-card-alt/30 transition-colors">
                                <td className="py-2 px-3">
                                  <span className="text-sm font-medium text-text-primary">
                                    {asset.symbol.replace('USDT', '').replace('USD', '')}
                                  </span>
                                  <span className="text-xs text-text-muted ml-1">/USDT</span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className={cn("text-xs font-mono", parseFloat(asset.today) >= 0 ? "text-status-success" : "text-status-error")}>
                                    {parseFloat(asset.today) >= 0 ? '+' : ''}${parseFloat(asset.today).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className={cn("text-xs font-mono", parseFloat(asset.week) >= 0 ? "text-status-success" : "text-status-error")}>
                                    {parseFloat(asset.week) >= 0 ? '+' : ''}${parseFloat(asset.week).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className={cn("text-xs font-mono font-medium", parseFloat(asset.month) >= 0 ? "text-status-success" : "text-status-error")}>
                                    {parseFloat(asset.month) >= 0 ? '+' : ''}${parseFloat(asset.month).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className={cn("text-xs font-mono", parseFloat(asset.total) >= 0 ? "text-status-success" : "text-status-error")}>
                                    {parseFloat(asset.total) >= 0 ? '+' : ''}${parseFloat(asset.total).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs",
                                      displayValue >= 0 
                                        ? "border-status-success/30 text-status-success bg-status-success/10" 
                                        : "border-status-error/30 text-status-error bg-status-error/10"
                                    )}
                                  >
                                    {displayValue >= 0 ? 'Recebendo' : 'Pagando'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Other Currencies Cards */}
              {activeFundingTab === 'other' && otherFunding.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {otherFunding
                    .sort((a, b) => Math.abs(parseFloat(b.total)) - Math.abs(parseFloat(a.total)))
                    .map((asset) => {
                      const displayValue = getFundingDisplayValue(asset, period);
                      return (
                        <Card key={asset.symbol} className={cn("p-3 border transition-all duration-200",
                          displayValue >= 0 
                            ? "border-status-success/30 bg-status-success-muted/20" 
                            : "border-status-error/30 bg-status-error-muted/20"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-surface-card-alt flex items-center justify-center">
                                <span className="text-xs font-bold text-text-secondary">{asset.currency}</span>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-text-primary">{asset.symbol}</h3>
                                <p className="text-xs text-text-muted">Funding na moeda base</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs",
                                displayValue >= 0 
                                  ? "border-status-success/30 text-status-success" 
                                  : "border-status-error/30 text-status-error"
                              )}
                            >
                              {displayValue >= 0 ? 'Recebendo' : 'Pagando'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <CompactFundingCell label="24H" value={parseFloat(asset.today)} currency={asset.currency} />
                            <CompactFundingCell label="7D" value={parseFloat(asset.week)} currency={asset.currency} />
                            <CompactFundingCell label="30D" value={parseFloat(asset.month)} currency={asset.currency} highlight />
                            <CompactFundingCell label="Total" value={parseFloat(asset.total)} currency={asset.currency} />
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}

              {activeFundingTab === 'usdt' && usdtFunding.length === 0 && (
                <Card className="p-6 border border-border-default bg-surface-card text-center">
                  <p className="text-sm text-text-secondary">Nenhum funding em USDT disponível.</p>
                </Card>
              )}
            </div>
          )}

          {funding.length === 0 && (
            <Card className="p-6 border border-border-default bg-surface-card text-center">
              <p className="text-sm text-text-secondary">Nenhum dado de funding disponível.</p>
            </Card>
          )}
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

// Compact Metric Card Component
interface CompactMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning';
  trend?: 'positive' | 'negative' | 'neutral';
}

function CompactMetricCard({ title, value, subtitle, icon, variant = 'default', trend }: CompactMetricCardProps) {
  const variants = {
    default: 'border-border-default bg-surface-card',
    success: 'border-status-success/30 bg-status-success-muted/20',
    error: 'border-status-error/30 bg-status-error-muted/20',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
  };

  const iconColors = {
    default: 'text-text-secondary bg-surface-card-alt',
    success: 'text-status-success bg-status-success/20',
    error: 'text-status-error bg-status-error/20',
    warning: 'text-yellow-500 bg-yellow-500/20',
  };

  return (
    <Card className={cn("p-3 border", variants[variant])}>
      <div className="flex items-start justify-between">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconColors[variant])}>
          {icon}
        </div>
        {trend && trend !== 'neutral' && (
          <div className={cn("flex items-center", trend === 'positive' ? 'text-status-success' : 'text-status-error')}>
            {trend === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-xs text-text-secondary">{title}</p>
        <p className={cn("text-lg font-bold font-mono",
          variant === 'error' ? 'text-status-error' : 
          variant === 'success' ? 'text-status-success' : 
          'text-text-primary'
        )}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
    </Card>
  );
}

// Compact Fee Row
interface CompactFeeRowProps {
  label: string;
  value: number;
  percent: number;
  color: string;
}

function CompactFeeRow({ label, value, percent, color }: CompactFeeRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-xs font-mono font-medium text-text-primary">${value.toFixed(2)}</span>
        <span className="text-xs text-text-muted ml-1">({percent.toFixed(0)}%)</span>
      </div>
    </div>
  );
}

// Compact Funding Cell for grid layout
interface CompactFundingCellProps {
  label: string;
  value: number;
  currency: string;
  highlight?: boolean;
}

function CompactFundingCell({ label, value, currency, highlight }: CompactFundingCellProps) {
  const symbol = getCurrencySymbol(currency);
  const isUSDT = currency === 'USDT';

  return (
    <div className={cn(
      "rounded-md p-2",
      highlight ? "bg-surface-card-alt/70" : "bg-surface-card-alt/30"
    )}>
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className={cn("text-xs font-mono font-medium truncate",
        value >= 0 ? "text-status-success" : "text-status-error"
      )}>
        {value >= 0 ? '+' : '-'}
        {isUSDT ? '$' : symbol}
        {Math.abs(value).toFixed(isUSDT ? 2 : 6)}
        {!isUSDT && <span className="text-text-muted ml-0.5">{currency}</span>}
      </p>
    </div>
  );
}
