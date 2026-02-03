import { useEffect, useMemo, useState } from 'react';
import {
  Bitcoin,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Calendar,
  Zap,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ViewLoading, ViewError, ViewEmpty } from '@/components/shared';
import { useBTCTimeseries } from '@/hooks';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { SyncButton } from '@/components/SyncButton';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

type TimeRange = '7D' | '30D' | '90D' | '1Y' | 'ALL';

const TIME_RANGE_TO_PERIOD: Record<TimeRange, string> = {
  '7D': '7d',
  '30D': '30d',
  '90D': '90d',
  '1Y': '1y',
  'ALL': 'all',
};

// Format BTC with 8 decimals
function formatBTC(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}

// Format currency with $ and commas
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage
function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Stat Card Component
function StatCard({
  label,
  value,
  subvalue,
  icon: Icon,
  variant = 'neutral',
  isLoading = false,
}: {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'neutral' | 'success' | 'error' | 'accent';
  isLoading?: boolean;
}) {
  const variantStyles = {
    neutral: {
      bg: 'bg-surface-card',
      iconBg: 'bg-surface-elevated',
      iconColor: 'text-text-secondary',
      valueColor: 'text-text-primary',
    },
    success: {
      bg: 'bg-surface-card',
      iconBg: 'bg-status-success/10',
      iconColor: 'text-status-success',
      valueColor: 'text-status-success',
    },
    error: {
      bg: 'bg-surface-card',
      iconBg: 'bg-status-error/10',
      iconColor: 'text-status-error',
      valueColor: 'text-status-error',
    },
    accent: {
      bg: 'bg-surface-card',
      iconBg: 'bg-accent-yellow/10',
      iconColor: 'text-accent-yellow',
      valueColor: 'text-accent-yellow',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn(
      "p-5 border border-border-default transition-all duration-200",
      styles.bg
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {label}
          </span>
          {isLoading ? (
            <div className="h-8 w-32 bg-surface-elevated animate-pulse rounded" />
          ) : (
            <div className={cn("text-2xl font-bold tracking-tight", styles.valueColor)}>
              {value}
            </div>
          )}
          {subvalue && !isLoading && (
            <span className="text-xs text-text-muted">{subvalue}</span>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
      </div>
    </Card>
  );
}

// Insight Card Component
function InsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 border border-border-default bg-surface-card">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
      {children}
    </Card>
  );
}

// Progress Bar Component
function ProgressBar({
  current,
  goal,
  label,
}: {
  current: number;
  goal: number;
  label: string;
}) {
  const progress = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">
          {progress.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-action-primary to-accent-yellow rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{formatBTC(current)} BTC</span>
        <span>Meta: {formatBTC(goal)} BTC</span>
      </div>
    </div>
  );
}

export function BTCView() {
  const { activePortfolioId, refreshPortfolios, portfolios } = usePortfolio();
  const activePortfolio = portfolios.find(p => p.id === activePortfolioId);
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const period = TIME_RANGE_TO_PERIOD[timeRange];

  const {
    timeseries,
    summary,
    isLoading,
    error,
    fetchBTCTimeseries,
  } = useBTCTimeseries();

  useEffect(() => {
    if (activePortfolioId) {
      fetchBTCTimeseries(activePortfolioId, period);
    }
  }, [activePortfolioId, fetchBTCTimeseries, period]);

  const chartData = useMemo(() => {
    return timeseries?.points || [];
  }, [timeseries]);

  const btcChange = useMemo(() => {
    if (!timeseries || timeseries.points.length < 2) return 0;
    const first = timeseries.points[0].btcAmount;
    const last = timeseries.points[timeseries.points.length - 1].btcAmount;
    return last - first;
  }, [timeseries]);

  const btcChangePercent = useMemo(() => {
    if (!timeseries || timeseries.points.length < 2) return 0;
    const first = timeseries.points[0].btcAmount;
    const last = timeseries.points[timeseries.points.length - 1].btcAmount;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [timeseries]);

  if (!activePortfolioId) {
    return (
      <ViewEmpty
        icon={<Bitcoin className="w-8 h-8 text-text-muted" />}
        title="Selecione uma Carteira"
        description="Selecione uma carteira no menu lateral para acompanhar sua acumulação de Bitcoin."
      />
    );
  }

  if (isLoading && !timeseries) {
    return <ViewLoading message="Carregando dados de BTC..." />;
  }

  if (error) {
    return (
      <ViewError
        error={error}
        onRetry={() => {
          if (activePortfolioId) {
            fetchBTCTimeseries(activePortfolioId, period);
          }
        }}
      />
    );
  }

  const hasData = timeseries && timeseries.points.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-4 animate-fade-in">
        <ViewEmpty
          icon={<Bitcoin className="w-8 h-8 text-text-muted" />}
          title="Sem dados de BTC"
          description="Não encontramos dados de Bitcoin na sua carteira. Certifique-se de ter sincronizado seus dados da Bybit."
          action={{
            label: 'Atualizar dados',
            onClick: () => fetchBTCTimeseries(activePortfolioId, period),
            isLoading,
          }}
        />
      </div>
    );
  }

  const isPositiveChange = btcChange >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-accent-yellow" />
            <h1 className="text-2xl font-semibold text-text-primary">Bitcoin Tracker</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Acompanhe sua jornada de acumulação de BTC ao longo do tempo.
          </p>
        </div>

        <SyncButton
          lastSyncTime={activePortfolio?.last_sync_at}
          onSyncComplete={async () => {
            if (activePortfolioId) {
              await Promise.all([
                fetchBTCTimeseries(activePortfolioId, period),
                refreshPortfolios(),
              ]);
            }
          }}
        />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Saldo Atual"
          value={`${formatBTC(summary?.currentBTC || 0)} BTC`}
          subvalue={formatCurrency(summary?.currentValueUSD || 0)}
          icon={Bitcoin}
          variant="accent"
          isLoading={isLoading}
        />

        <StatCard
          label="Variação no Período"
          value={`${isPositiveChange ? '+' : ''}${formatBTC(btcChange)} BTC`}
          subvalue={formatPercentage(btcChangePercent)}
          icon={isPositiveChange ? TrendingUp : TrendingDown}
          variant={isPositiveChange ? 'success' : 'error'}
          isLoading={isLoading}
        />

        <StatCard
          label="Preço Médio"
          value={formatCurrency(summary?.avgEntryPrice || 0)}
          subvalue="Custo médio de entrada"
          icon={Target}
          variant="neutral"
          isLoading={isLoading}
        />

        <StatCard
          label="Dias Acumulando"
          value={`${summary?.daysAccumulating || 0}`}
          subvalue="Desde o início"
          icon={Calendar}
          variant="neutral"
          isLoading={isLoading}
        />
      </div>

      {/* Main Chart Section */}
      <Card className="p-6 border border-border-default bg-surface-card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Evolução do Saldo BTC</h2>
            <p className="text-sm text-text-secondary">
              Acompanhe como sua quantidade de Bitcoin evoluiu ao longo do tempo
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-surface-card-alt rounded-lg">
            {(['7D', '30D', '90D', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeRange === range
                    ? "bg-surface-elevated text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* BTC Chart */}
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5D245" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F5D245" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-grid)' }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                minTickGap={30}
              />
              <YAxis
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(4)}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface-elevated border border-border-default rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-text-muted mb-1">
                          {new Date(label).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm font-semibold text-accent-yellow">
                          {formatBTC(data.btcAmount)} BTC
                        </p>
                        <p className="text-xs text-text-secondary">
                          ≈ {formatCurrency(data.btcValueUSD)}
                        </p>
                        {data.pnlBTC !== 0 && (
                          <p className={cn(
                            "text-xs mt-1",
                            data.pnlBTC >= 0 ? "text-status-success" : "text-status-error"
                          )}>
                            {data.pnlBTC >= 0 ? '+' : ''}{formatBTC(data.pnlBTC)} BTC
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="btcAmount"
                stroke="none"
                fill="url(#colorBTC)"
              />
              <Line
                type="monotone"
                dataKey="btcAmount"
                stroke="#F5D245"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#F5D245' }}
              />
              {chartData.length > 0 && (
                <ReferenceLine
                  y={chartData[0].btcAmount}
                  stroke="var(--text-muted)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom Section: Insights & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Stats */}
        <InsightCard title="Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">P&L Não Realizado</span>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                (summary?.unrealizedPnL || 0) >= 0 ? "text-status-success" : "text-status-error"
              )}>
                {(summary?.unrealizedPnL || 0) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {formatCurrency(summary?.unrealizedPnL || 0)}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Retorno %</span>
              <span className={cn(
                "text-sm font-medium",
                (summary?.unrealizedPnLPercent || 0) >= 0 ? "text-status-success" : "text-status-error"
              )}>
                {formatPercentage(summary?.unrealizedPnLPercent || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Custo Base</span>
              <span className="text-sm font-medium text-text-primary">
                {formatCurrency(summary?.costBasis || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Valor Atual</span>
              <span className="text-sm font-medium text-text-primary">
                {formatCurrency(summary?.currentValueUSD || 0)}
              </span>
            </div>
          </div>
        </InsightCard>

        {/* Goal Progress */}
        <InsightCard title="Progresso para Meta">
          {summary?.btcGoal ? (
            <div className="space-y-6">
              <ProgressBar
                current={summary.currentBTC}
                goal={summary.btcGoal}
                label="Progresso da Meta"
              />

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-3 bg-surface-card-alt rounded-lg">
                  <p className="text-xs text-text-muted mb-1">Faltam</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {formatBTC(Math.max(0, (summary.btcGoal || 0) - summary.currentBTC))}
                  </p>
                  <p className="text-xs text-text-muted">BTC</p>
                </div>
                <div className="text-center p-3 bg-surface-card-alt rounded-lg">
                  <p className="text-xs text-text-muted mb-1">Na meta valerá</p>
                  <p className="text-lg font-semibold text-accent-yellow">
                    {formatCurrency((summary.btcGoal || 0) * (summary.avgEntryPrice || 0))}
                  </p>
                  <p className="text-xs text-text-muted">USD</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="w-10 h-10 text-text-muted mb-3" />
              <p className="text-sm text-text-secondary mb-1">Nenhuma meta definida</p>
              <p className="text-xs text-text-muted">
                Defina uma meta de BTC nas configurações para acompanhar seu progresso.
              </p>
            </div>
          )}
        </InsightCard>

        {/* Best/Worst Days */}
        <InsightCard title="Destaques do Período">
          <div className="space-y-4">
            {timeseries?.bestDay && (
              <div className="flex items-center gap-3 p-3 bg-status-success/5 rounded-lg border border-status-success/10">
                <div className="w-10 h-10 rounded-lg bg-status-success/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-status-success" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-muted">Melhor Dia</p>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(timeseries.bestDay.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-status-success">
                    +{formatBTC(timeseries.bestDay.change)} BTC
                  </p>
                </div>
              </div>
            )}

            {timeseries?.worstDay && (
              <div className="flex items-center gap-3 p-3 bg-status-error/5 rounded-lg border border-status-error/10">
                <div className="w-10 h-10 rounded-lg bg-status-error/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-status-error" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-muted">Pior Dia</p>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(timeseries.worstDay.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-status-error">
                    {formatBTC(timeseries.worstDay.change)} BTC
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-surface-card-alt rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted">Média Diária</p>
                <p className="text-sm font-medium text-text-primary">
                  {timeseries?.avgDailyChange && timeseries.avgDailyChange >= 0 ? '+' : ''}
                  {formatBTC(timeseries?.avgDailyChange || 0)} BTC
                </p>
                <p className="text-xs text-text-muted">por dia</p>
              </div>
            </div>
          </div>
        </InsightCard>
      </div>
    </div>
  );
}
