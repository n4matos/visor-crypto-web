import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
import { ViewLoading, ViewError, ViewEmpty, PageHeader, StatItem, ChartTooltip } from '@/components/shared';
import { useDashboard } from '@/hooks';
import type { Period } from '@/types';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface PortfolioViewProps {
  connected: boolean;
}

export function PortfolioView({ connected }: PortfolioViewProps) {
  const [period, setPeriod] = useState<Period>('90d');
  const { summary, equityCurve, performance, isLoading, error, fetchDashboardData } = useDashboard();

  useEffect(() => {
    if (connected) {
      fetchDashboardData(period);
    }
  }, [period, fetchDashboardData, connected]);

  // Calculate returns from equity curve
  const { usdReturn, btcReturn, usdReturnAbs, firstPoint, lastPoint } = useMemo(() => {
    const points = equityCurve?.points || [];
    if (points.length < 2) {
      return {
        firstPoint: { equityUSD: 0, equityBTC: 0, date: '', pnlCumulative: 0 },
        lastPoint: { equityUSD: 0, equityBTC: 0, date: '', pnlCumulative: 0 },
        usdReturn: 0,
        btcReturn: 0,
        usdReturnAbs: 0,
        btcReturnAbs: 0,
      };
    }

    const first = points[0];
    const last = points[points.length - 1];
    const usdAbs = last.equityUSD - first.equityUSD;
    const btcAbs = last.equityBTC - first.equityBTC;

    return {
      firstPoint: first,
      lastPoint: last,
      usdReturn: first.equityUSD > 0 ? ((last.equityUSD - first.equityUSD) / first.equityUSD) * 100 : 0,
      btcReturn: first.equityBTC > 0 ? ((last.equityBTC - first.equityBTC) / first.equityBTC) * 100 : 0,
      usdReturnAbs: usdAbs,
      btcReturnAbs: btcAbs,
    };
  }, [equityCurve]);

  const metrics = useMemo(() => ({
    maxDrawdown: performance?.maxDrawdown || 0,
    sharpeRatio: performance?.sharpeRatio || 0,
    winRate: performance?.winRate || 0,
    profitFactor: performance?.profitFactor || 0,
    volatility: performance?.volatility || 0,
    bestTrade: performance?.bestTrade || 0,
    worstTrade: performance?.worstTrade || 0,
    totalTrades: performance?.totalTrades || 0,
  }), [performance]);

  if (!connected) {
    return (
      <ViewEmpty
        icon={<Wallet className="w-8 h-8 text-text-muted" />}
        title="Conecte sua conta"
        description="Para visualizar seus dados, voce precisa configurar suas credenciais da Bybit."
      />
    );
  }

  if (isLoading && !equityCurve && !summary) {
    return <ViewLoading message="Carregando portfolio..." />;
  }

  if (error) {
    return <ViewError error={error} onRetry={() => fetchDashboardData(period)} />;
  }

  const hasData = equityCurve && equityCurve.points.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Portfolio" subtitle="Acompanhe a evolucao do seu capital">
          <PeriodSelector value={period} onChange={setPeriod} />
        </PageHeader>
        <ViewEmpty
          icon={<TrendingUp className="w-8 h-8 text-text-muted" />}
          title="Sem dados disponiveis"
          description="Nao encontramos dados historicos para o periodo selecionado. Certifique-se de ter sincronizado seus dados da Bybit em Configuracoes."
          action={{ label: 'Atualizar dados', onClick: () => fetchDashboardData(period), isLoading }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Period Selector */}
      <PageHeader title="Portfolio" subtitle="Acompanhe a evolucao do seu capital">
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      {/* BTC Accumulation Hero */}
      <Card className={cn(
        "p-6 border bg-surface-card",
        btcReturn >= 0 ? "border-status-success/30" : "border-status-error/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              btcReturn >= 0 ? "bg-status-success/20" : "bg-status-error/20"
            )}>
              <span className="text-2xl font-bold text-text-primary">&#8383;</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Acumulacao de BTC</h3>
              <p className="text-text-secondary">Seu objetivo principal: acumular Bitcoin ao longo do tempo</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-3xl font-bold font-mono",
              btcReturn >= 0 ? "text-status-success" : "text-status-error"
            )}>
              {btcReturn >= 0 ? '+' : ''}{btcReturn.toFixed(2)}%
            </p>
            <p className="text-sm text-text-secondary font-mono">
              {firstPoint.equityBTC.toFixed(6)} &#8383; &rarr; {lastPoint.equityBTC.toFixed(6)} &#8383;
            </p>
          </div>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Total"
          value={`$${summary?.currentEquityUSD.toLocaleString() || '0'}`}
          subtitle={`${summary?.currentEquityBTC.toFixed(6) || '0'} BTC`}
          change={{ value: usdReturnAbs, percent: usdReturn }}
          icon={<Wallet className="w-5 h-5" />}
        />
        <MetricCard
          title="Retorno (USD)"
          value={`${usdReturnAbs >= 0 ? '+' : ''}$${Math.abs(usdReturnAbs).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={{ value: usdReturnAbs, percent: usdReturn }}
          icon={<TrendingUp className="w-5 h-5" />}
          variant={usdReturnAbs >= 0 ? 'success' : 'error'}
        />
        <MetricCard
          title="Drawdown Maximo"
          value={`${metrics.maxDrawdown.toFixed(2)}%`}
          icon={<TrendingDown className="w-5 h-5" />}
          variant="error"
        />
        <MetricCard
          title="Sharpe Ratio"
          value={metrics.sharpeRatio.toFixed(2)}
          icon={<Activity className="w-5 h-5" />}
          variant="neutral"
        />
      </div>

      {/* Main Equity Curve - Full Width */}
      <Card className="p-5 border border-border-default bg-surface-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Equity Curve</h2>
            <p className="text-sm text-text-secondary">Comparativo USD vs BTC</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--chart-line-1)]" />
              <span className="text-sm text-text-secondary">USD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-yellow)]" />
              <span className="text-sm text-text-secondary">BTC</span>
            </div>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={equityCurve?.points || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-grid)' }}
                tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip
                items={[
                  { dataKey: 'equityUSD', label: 'Equity USD', prefix: '$', color: 'var(--chart-line-1)' },
                  { dataKey: 'equityBTC', label: 'Equity BTC', prefix: '', color: 'var(--accent-yellow)', formatValue: (v) => `${v.toFixed(6)} BTC` },
                ]}
              />} />
              <Area yAxisId="left" type="monotone" dataKey="equityUSD" stroke="none" fill="var(--chart-line-1)" fillOpacity={0.1} />
              <Line yAxisId="left" type="monotone" dataKey="equityUSD" stroke="var(--chart-line-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Equity USD" />
              <Line yAxisId="right" type="monotone" dataKey="equityBTC" stroke="var(--accent-yellow)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Equity BTC" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* PnL Cumulative + Performance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border border-border-default bg-surface-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">PnL Acumulado</h2>
            <p className="text-sm text-text-secondary">Lucro/Prejuizo ao longo do tempo</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={equityCurve?.points || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--chart-grid)' }}
                  tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                />
                <YAxis
                  tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                />
                <Tooltip content={<ChartTooltip
                  items={[
                    { dataKey: 'pnlCumulative', label: 'PnL Acumulado', prefix: '$', color: 'var(--status-success)' },
                  ]}
                />} />
                <Area type="monotone" dataKey="pnlCumulative" stroke="none" fill="var(--status-success)" fillOpacity={0.1} />
                <Line type="monotone" dataKey="pnlCumulative" stroke="var(--status-success)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border border-border-default bg-surface-card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Estatisticas de Performance</h2>
          <div className="space-y-4">
            <StatItem
              icon={<Activity className="w-5 h-5 text-action-primary" />}
              label="Taxa de Acerto"
              value={`${metrics.winRate.toFixed(1)}%`}
            />
            <StatItem
              icon={<Activity className="w-5 h-5 text-action-primary" />}
              label="Profit Factor"
              value={metrics.profitFactor.toFixed(2)}
            />
            <StatItem
              icon={<Activity className="w-5 h-5 text-action-primary" />}
              label="Volatilidade"
              value={`${metrics.volatility.toFixed(2)}%`}
            />
            <StatItem
              icon={<TrendingUp className="w-5 h-5 text-status-success" />}
              label="Melhor Trade"
              value={`+$${metrics.bestTrade.toFixed(2)}`}
              valueColor="text-status-success"
            />
            <StatItem
              icon={<TrendingDown className="w-5 h-5 text-status-error" />}
              label="Pior Trade"
              value={`$${metrics.worstTrade.toFixed(2)}`}
              valueColor="text-status-error"
            />
            <StatItem
              icon={<Activity className="w-5 h-5 text-text-secondary" />}
              label="Total de Trades"
              value={metrics.totalTrades.toString()}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
