import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ViewLoading, ViewError, ViewEmpty } from '@/components/shared';
import { useDashboard, useWallet } from '@/hooks';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { SyncButton } from '@/components/SyncButton';
import type { Period, WalletAsset } from '@/types';
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

type TimeRange = '1D' | '1W' | '1M' | '1Y' | 'ALL';

const TIME_RANGE_TO_PERIOD: Record<TimeRange, Period> = {
  '1D': '24h',
  '1W': '7d',
  '1M': '30d',
  '1Y': '1y',
  'ALL': 'all',
};

// Format currency with $ and commas
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format number with commas
function formatNumber(value: number, decimals = 6): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Format percentage
function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Asset Table Row component - 5 columns
function AssetTableRow({ asset, index }: { asset: WalletAsset & { percentage: number }; index: number }) {
  const isPositive = asset.change24h >= 0;

  return (
    <div
      className={cn(
        "grid grid-cols-5 items-center py-3.5 px-4 transition-colors cursor-pointer group",
        "hover:bg-surface-card-alt",
        index !== 0 && "border-t border-border-subtle"
      )}
    >
      {/* Column 1: Coin (Icon + Symbol) */}
      <div className="flex items-center gap-3">
        <img
          src={asset.iconUrl}
          alt={asset.coin}
          className="w-8 h-8 rounded-full bg-surface-card-alt"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/32x32/1E222D/FFFFFF?text=${asset.coin[0]}`;
          }}
        />
        <span className="text-sm font-semibold text-text-primary">{asset.coin}</span>
      </div>

      {/* Column 2: Amount */}
      <div className="text-left">
        <span className="text-sm text-text-primary font-mono">
          {formatNumber(parseFloat(asset.amount), 6)}
        </span>
      </div>

      {/* Column 3: Price */}
      <div className="text-left">
        <span className="text-sm text-text-secondary font-mono">
          ${formatNumber(asset.price, 2)}
        </span>
      </div>

      {/* Column 4: Total */}
      <div className="text-left">
        <span className="text-sm font-semibold text-text-primary font-mono">
          {formatCurrency(asset.total)}
        </span>
      </div>

      {/* Column 5: Change 24h */}
      <div className="text-right">
        <div className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          isPositive ? "text-status-success" : "text-status-error"
        )}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span className="font-mono">{formatPercentage(asset.change24h)}</span>
        </div>
      </div>
    </div>
  );
}

// Quick Stat Card for side panel
function QuickStatCard({
  icon,
  label,
  value,
  subvalue,
  variant = 'neutral'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subvalue?: string;
  variant?: 'neutral' | 'success' | 'error' | 'warning';
}) {
  const variantStyles = {
    neutral: 'text-text-primary',
    success: 'text-status-success',
    error: 'text-status-error',
    warning: 'text-status-warning',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-card-alt/50 hover:bg-surface-card-alt transition-colors">
      <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center text-text-secondary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className={cn("text-sm font-semibold truncate", variantStyles[variant])}>
          {value}
        </p>
        {subvalue && (
          <p className="text-xs text-text-muted">{subvalue}</p>
        )}
      </div>
    </div>
  );
}

export function PortfolioView() {
  const { activePortfolioId, refreshPortfolios, portfolios } = usePortfolio();
  const activePortfolio = portfolios.find(p => p.id === activePortfolioId);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const period = TIME_RANGE_TO_PERIOD[timeRange];

  const {
    wallet,
    isLoading: isWalletLoading,
    error: walletError,
    fetchWallet
  } = useWallet();

  const {
    summary,
    equityCurve,
    performance,
    isLoading: isDashboardLoading,
    error: dashboardError,
    fetchDashboardData
  } = useDashboard();

  useEffect(() => {
    if (activePortfolioId) {
      fetchWallet(activePortfolioId);
      fetchDashboardData(period, activePortfolioId);
    }
  }, [activePortfolioId, fetchWallet, fetchDashboardData, period]);

  // Calculate returns from equity curve
  const chartData = useMemo(() => {
    return equityCurve?.points || [];
  }, [equityCurve]);

  const totalReturn = useMemo(() => {
    const points = equityCurve?.points || [];
    if (points.length < 2) return 0;
    const first = points[0].equityUSD;
    const last = points[points.length - 1].equityUSD;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [equityCurve]);

  // Calculate allocation data
  const allocationData = useMemo(() => {
    if (!wallet?.assets) return [];
    const total = wallet.totalUSD;
    return wallet.assets.map(asset => ({
      ...asset,
      percentage: total > 0 ? (asset.total / total) * 100 : 0,
    }));
  }, [wallet]);

  const isLoading = isWalletLoading || isDashboardLoading;
  const error = walletError || dashboardError;

  if (!activePortfolioId) {
    return (
      <ViewEmpty
        icon={<Wallet className="w-8 h-8 text-text-muted" />}
        title="Selecione uma Carteira"
        description="Selecione uma carteira no menu lateral ou adicione uma nova em Configurações."
      />
    );
  }

  if (isLoading && !wallet && !summary) {
    return <ViewLoading message="Carregando portfolio..." />;
  }

  if (error) {
    return (
      <ViewError
        error={error}
        onRetry={() => {
          fetchWallet(activePortfolioId);
          fetchDashboardData(period, activePortfolioId);
        }}
      />
    );
  }

  const hasData = wallet && wallet.assets.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-4 animate-fade-in">
        <ViewEmpty
          icon={<TrendingUp className="w-8 h-8 text-text-muted" />}
          title="Sem dados disponíveis"
          description="Não encontramos dados da sua carteira. Certifique-se de ter sincronizado seus dados da Bybit em Configurações."
          action={{
            label: 'Atualizar dados',
            onClick: () => fetchWallet(activePortfolioId),
            isLoading
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text-primary">Overview</h1>
          <p className="text-sm text-text-secondary">
            Acompanhe o desempenho da sua carteira e seus ativos em tempo real.
          </p>
        </div>

        <SyncButton
          lastSyncTime={activePortfolio?.last_sync_at}
          onSyncComplete={async () => {
            if (activePortfolioId) {
              await Promise.all([
                fetchWallet(activePortfolioId),
                fetchDashboardData(period, activePortfolioId),
                refreshPortfolios()
              ]);
            }
          }}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Content (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Total Balance Card with Chart */}
          <Card className="p-6 border border-border-default bg-surface-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-text-secondary mb-1">Total Balance</p>
                <h2 className="text-4xl font-semibold text-text-primary tracking-tight">
                  {formatCurrency(wallet?.totalUSD || 0)}
                </h2>
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-sm",
                  totalReturn >= 0 ? "text-status-success" : "text-status-error"
                )}>
                  {totalReturn >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {formatPercentage(totalReturn)}
                  </span>
                  <span className="text-text-muted ml-1">
                    {timeRange === 'ALL' ? 'no período' : `em ${timeRange.toLowerCase()}`}
                  </span>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-1 p-1 bg-surface-card-alt rounded-lg">
                {(['1D', '1W', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
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

            {/* Chart */}
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-line-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-line-1)" stopOpacity={0} />
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
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-surface-elevated border border-border-default rounded-lg p-3 shadow-lg">
                            <p className="text-xs text-text-muted mb-1">
                              {new Date(label).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-sm font-semibold text-text-primary">
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="equityUSD"
                    stroke="none"
                    fill="url(#colorEquity)"
                  />
                  <Line
                    type="monotone"
                    dataKey="equityUSD"
                    stroke="var(--chart-line-1)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--chart-line-1)' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column - Portfolio Insights (1/3) */}
        <div className="h-full">
          <Card className="h-full flex flex-col p-5 border border-border-default bg-surface-card">
            <h3 className="text-base font-semibold text-text-primary mb-4">Portfolio Insights</h3>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              <QuickStatCard
                icon={<Target className="w-5 h-5" />}
                label="Taxa de Acerto"
                value={`${(performance?.winRate || 0).toFixed(1)}%`}
                subvalue={`${performance?.winningTrades || 0} / ${performance?.totalTrades || 0} trades`}
                variant={performance?.winRate && performance.winRate > 50 ? 'success' : 'neutral'}
              />

              <QuickStatCard
                icon={<Activity className="w-5 h-5" />}
                label="Profit Factor"
                value={(performance?.profitFactor || 0).toFixed(2)}
                subvalue={performance?.profitFactor && performance.profitFactor > 1.5 ? 'Excelente' : 'Bom'}
                variant={performance?.profitFactor && performance.profitFactor > 1.5 ? 'success' : 'neutral'}
              />

              <QuickStatCard
                icon={<Zap className="w-5 h-5" />}
                label="Sharpe Ratio"
                value={(performance?.sharpeRatio || 0).toFixed(2)}
                subvalue="Risco / Retorno"
                variant={performance?.sharpeRatio && performance.sharpeRatio > 1 ? 'success' : 'neutral'}
              />

              <QuickStatCard
                icon={<TrendingDown className="w-5 h-5" />}
                label="Max Drawdown"
                value={`${(performance?.maxDrawdown || 0).toFixed(1)}%`}
                subvalue="Maior queda"
                variant="error"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Portfolio Overview - Full Width Table Section */}
      <Card className="border border-border-default bg-surface-card overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Portfolio Overview</h3>
              <p className="text-xs text-text-secondary">
                {wallet?.assets.length} ativos na carteira
              </p>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-5 items-center py-3 px-4 bg-surface-card-alt/50 text-xs font-medium text-text-muted uppercase tracking-wider">
          <div className="text-left">Asset</div>
          <div className="text-left">Amount</div>
          <div className="text-left">Price</div>
          <div className="text-left">Total</div>
          <div className="text-right">24h Change</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border-subtle">
          {allocationData.map((asset, index) => (
            <AssetTableRow key={asset.coin} asset={asset} index={index} />
          ))}
        </div>
      </Card>
    </div>
  );
}
