import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
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

export function CurvasView() {
  const [period, setPeriod] = useState<Period>('90d');
  const { equityCurve, performance, isLoading, error, fetchDashboardData } = useDashboard();

  // Fetch data when component mounts or period changes
  useEffect(() => {
    fetchDashboardData(period);
  }, [period, fetchDashboardData]);

  // Calculate returns from equity curve data
  const { usdReturn, btcReturn, firstPoint, lastPoint } = useMemo(() => {
    const points = equityCurve?.points || [];
    if (points.length < 2) {
      return {
        firstPoint: { equityUSD: 0, equityBTC: 0, date: '', pnlCumulative: 0 },
        lastPoint: { equityUSD: 0, equityBTC: 0, date: '', pnlCumulative: 0 },
        usdReturn: 0,
        btcReturn: 0,
      };
    }

    const first = points[0];
    const last = points[points.length - 1];

    return {
      firstPoint: first,
      lastPoint: last,
      usdReturn: first.equityUSD > 0 ? ((last.equityUSD - first.equityUSD) / first.equityUSD) * 100 : 0,
      btcReturn: first.equityBTC > 0 ? ((last.equityBTC - first.equityBTC) / first.equityBTC) * 100 : 0,
    };
  }, [equityCurve]);

  // Use performance metrics from API
  const metrics = useMemo(() => ({
    totalReturn: performance?.totalReturn || 0,
    maxDrawdown: performance?.maxDrawdown || 0,
    sharpeRatio: performance?.sharpeRatio || 0,
    winRate: performance?.winRate || 0,
    profitFactor: performance?.profitFactor || 0,
    averageTrade: performance?.averageTrade || 0,
    bestTrade: performance?.bestTrade || 0,
    worstTrade: performance?.worstTrade || 0,
    totalTrades: performance?.totalTrades || 0,
  }), [performance]);

  if (isLoading && !equityCurve) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
        <p className="text-text-secondary">Carregando dados...</p>
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
        <Button onClick={() => fetchDashboardData(period)} variant="outline" className="border-border-default">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const hasData = equityCurve && equityCurve.points.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Curvas de Crescimento</h1>
          <p className="text-text-secondary">Acompanhe a evolução do seu capital ao longo do tempo</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {!hasData ? (
        <Card className="p-8 border border-border-default bg-surface-card text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-card-alt flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Sem dados disponíveis</h3>
            <p className="text-text-secondary max-w-md">
              Não encontramos dados históricos para o período selecionado. 
              Certifique-se de ter sincronizado seus dados da Bybit em Configurações.
            </p>
            <Button 
              onClick={() => fetchDashboardData(period)} 
              variant="outline" 
              className="border-border-default hover:bg-surface-card-alt"
            >
              <Loader2 className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Atualizar dados
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Retorno Total (USD)" 
              value={`${usdReturn >= 0 ? '+' : ''}${usdReturn.toFixed(2)}%`} 
              change={{ value: usdReturn, percent: usdReturn }} 
              icon={<TrendingUp className="w-5 h-5" />} 
              variant={usdReturn >= 0 ? 'success' : 'error'} 
            />
            <MetricCard 
              title="Retorno Total (BTC)" 
              value={`${btcReturn >= 0 ? '+' : ''}${btcReturn.toFixed(2)}%`} 
              change={{ value: btcReturn, percent: btcReturn }} 
              icon={<Activity className="w-5 h-5" />} 
              variant={btcReturn >= 0 ? 'success' : 'error'} 
            />
            <MetricCard 
              title="Drawdown Máximo" 
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
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                      <p className="text-sm text-text-secondary mb-2">{new Date(label || '').toLocaleDateString('pt-BR')}</p>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-sm text-text-secondary">{p.name}:</span>
                          <span className="text-sm font-mono font-medium text-text-primary">
                            {p.name === 'Equity BTC' ? '₿' : '$'}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null} />
                  <Area yAxisId="left" type="monotone" dataKey="equityUSD" stroke="none" fill="var(--chart-line-1)" fillOpacity={0.1} />
                  <Line yAxisId="left" type="monotone" dataKey="equityUSD" stroke="var(--chart-line-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Equity USD" />
                  <Line yAxisId="right" type="monotone" dataKey="equityBTC" stroke="var(--accent-yellow)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Equity BTC" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 border border-border-default bg-surface-card">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-text-primary">PnL Acumulado</h2>
                <p className="text-sm text-text-secondary">Lucro/Prejuízo ao longo do tempo</p>
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
                    <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                      <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                        <p className="text-sm text-text-secondary mb-2">{new Date(label || '').toLocaleDateString('pt-BR')}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-status-success" />
                          <span className="text-sm text-text-secondary">PnL Acumulado:</span>
                          <span className="text-sm font-mono font-medium text-text-primary">
                            ${typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}
                          </span>
                        </div>
                      </div>
                    ) : null} />
                    <Area type="monotone" dataKey="pnlCumulative" stroke="none" fill="var(--status-success)" fillOpacity={0.1} />
                    <Line type="monotone" dataKey="pnlCumulative" stroke="var(--status-success)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 border border-border-default bg-surface-card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Estatísticas de Performance</h2>
              <div className="space-y-4">
                <StatRow icon={<Activity className="w-5 h-5 text-action-primary" />} label="Taxa de Acerto" value={`${metrics.winRate.toFixed(1)}%`} />
                <StatRow icon={<Activity className="w-5 h-5 text-action-primary" />} label="Profit Factor" value={metrics.profitFactor.toFixed(2)} />
                <StatRow icon={<Activity className="w-5 h-5 text-action-primary" />} label="Volatilidade" value={`${(performance?.volatility || 0).toFixed(2)}%`} />
                <StatRow icon={<TrendingUp className="w-5 h-5 text-status-success" />} label="Melhor Trade" value={`+$${metrics.bestTrade.toFixed(2)}`} valueColor="text-status-success" />
                <StatRow icon={<TrendingDown className="w-5 h-5 text-status-error" />} label="Pior Trade" value={`$${metrics.worstTrade.toFixed(2)}`} valueColor="text-status-error" />
                <StatRow icon={<Activity className="w-5 h-5 text-text-secondary" />} label="Total de Trades" value={metrics.totalTrades.toString()} />
              </div>
            </Card>
          </div>

          <Card className={cn("p-6 border bg-surface-card", btcReturn >= 0 ? "border-status-success/30" : "border-status-error/30")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", btcReturn >= 0 ? "bg-status-success/20" : "bg-status-error/20")}>
                  <span className="text-2xl font-bold text-text-primary">₿</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Acumulação de BTC</h3>
                  <p className="text-text-secondary">Seu objetivo principal é acumular Bitcoin ao longo do tempo</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-3xl font-bold font-mono", btcReturn >= 0 ? "text-status-success" : "text-status-error")}>
                  {btcReturn >= 0 ? '+' : ''}{btcReturn.toFixed(2)}%
                </p>
                <p className="text-sm text-text-secondary">
                  {firstPoint.equityBTC.toFixed(6)} ₿ → {lastPoint.equityBTC.toFixed(6)} ₿
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

function StatRow({ icon, label, value, valueColor = 'text-text-primary' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-card-alt">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className={cn("text-lg font-mono font-medium", valueColor)}>{value}</span>
    </div>
  );
}
