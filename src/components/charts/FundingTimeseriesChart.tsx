import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { FundingTimeseriesDataPoint } from '@/hooks/useFundingTimeseries';

interface FundingTimeseriesChartProps {
  data: FundingTimeseriesDataPoint[];
  currency: string;
  isLoading?: boolean;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  timestamp: number;
  totalFunding: number; // Cumulative value
  dailyFunding: number; // Daily value
  fundingPaid: number;
  fundingReceived: number;
  transactionCount: number;
  symbols: string[];
  isPositive: boolean;
}

export function FundingTimeseriesChart({
  data,
  currency,
  isLoading,
  className,
}: FundingTimeseriesChartProps) {
  // Transform data for chart with cumulative values
  const chartData: ChartDataPoint[] = useMemo(() => {
    let cumulativeFunding = 0;
    
    return data.map((point) => {
      const dailyFunding = parseFloat(point.total_funding);
      cumulativeFunding += dailyFunding; // Acumula o funding dia a dia
      
      const date = new Date(point.date);
      return {
        date: date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        }),
        fullDate: date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        timestamp: date.getTime(),
        totalFunding: cumulativeFunding, // Valor acumulado até este dia
        dailyFunding, // Valor do dia (para referência)
        fundingPaid: parseFloat(point.funding_paid),
        fundingReceived: parseFloat(point.funding_received),
        transactionCount: point.transaction_count,
        symbols: point.symbols,
        isPositive: cumulativeFunding >= 0,
      };
    });
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const values = chartData.map((d) => d.totalFunding);
    const positiveDays = chartData.filter((d) => d.totalFunding > 0).length;
    const negativeDays = chartData.filter((d) => d.totalFunding < 0).length;
    const neutralDays = chartData.filter((d) => d.totalFunding === 0).length;
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      positiveDays,
      negativeDays,
      neutralDays,
    };
  }, [chartData]);

  // Calculate domain for Y axis
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [-1, 1];
    const values = chartData.map((d) => d.totalFunding);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.1, Math.abs(max) * 0.1);
    return [min - padding, max + padding];
  }, [chartData]);

  // Format currency value
  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    if (currency === 'USDT') {
      return `$${absValue.toFixed(4)}`;
    }
    return `${absValue.toFixed(8)} ${currency}`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDataPoint }>;
  }) => {
    if (active && payload && payload.length > 0) {
      const point = payload[0].payload;
      return (
        <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg min-w-[220px]">
          {/* Date Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-default/50">
            <CalendarIcon className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-secondary">{point.fullDate}</span>
          </div>
          
          {/* Cumulative Funding */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">Acumulado:</span>
            <div className="flex items-center gap-1.5">
              {point.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-status-success" />
              ) : point.totalFunding < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-status-error" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-text-muted" />
              )}
              <span className={cn(
                "text-sm font-mono font-semibold",
                point.isPositive ? "text-status-success" : point.totalFunding < 0 ? "text-status-error" : "text-text-muted"
              )}>
                {point.isPositive ? '+' : point.totalFunding < 0 ? '-' : ''}
                {formatCurrency(point.totalFunding)}
              </span>
            </div>
          </div>

          {/* Daily Funding */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-default/30">
            <span className="text-xs text-text-muted">No dia:</span>
            <span className={cn(
              "text-xs font-mono",
              point.dailyFunding >= 0 ? "text-status-success" : "text-status-error"
            )}>
              {point.dailyFunding >= 0 ? '+' : '-'}{formatCurrency(Math.abs(point.dailyFunding))}
            </span>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Recebido:</span>
              <span className="text-xs font-mono text-status-success">
                +{formatCurrency(point.fundingReceived)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Pago:</span>
              <span className="text-xs font-mono text-status-error">
                -{formatCurrency(Math.abs(point.fundingPaid))}
              </span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-border-default/50 pt-2 mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Transações:</span>
              <span className="text-xs font-mono text-text-primary">{point.transactionCount}</span>
            </div>
            {point.symbols.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Ativos:</span>
                <span className="text-xs text-text-primary truncate max-w-[100px]">
                  {point.symbols.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={cn("p-6 border border-border-default bg-surface-card", className)}>
        <div className="h-[300px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando histórico...</span>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={cn("p-6 border border-border-default bg-surface-card", className)}>
        <div className="h-[300px] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-card-alt flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-secondary text-center">
            Nenhum dado de funding disponível<br />
            <span className="text-xs text-text-muted">para o período selecionado</span>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("border border-border-default bg-surface-card overflow-hidden", className)}>
      {/* Stats Header */}
      {stats && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-surface-card-alt/30">
          <div className="flex items-center gap-4">
            <StatItem 
              icon={<TrendingUp className="w-3 h-3" />} 
              label="Dias Positivos" 
              value={stats.positiveDays}
              color="text-status-success"
            />
            <StatItem 
              icon={<TrendingDown className="w-3 h-3" />} 
              label="Dias Negativos" 
              value={stats.negativeDays}
              color="text-status-error"
            />
          </div>
          <div className="text-xs text-text-muted">
            {chartData.length} dias analisados
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--action-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--action-primary)" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-grid)' }}
                interval="preserveStartEnd"
                minTickGap={40}
              />

              <YAxis
                tick={{ fill: 'var(--chart-axis-label)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => {
                  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
                  if (Math.abs(v) >= 1) return v.toFixed(1);
                  return v.toFixed(2);
                }}
                domain={yDomain as [number, number]}
                width={50}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Zero line reference */}
              <ReferenceLine
                y={0}
                stroke="var(--border-strong)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              {/* Area */}
              <Area
                type="monotone"
                dataKey="totalFunding"
                stroke="var(--action-primary)"
                strokeWidth={2}
                fill="url(#fundingGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface-card)', fill: 'var(--action-primary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border-default/50">
          <LegendItem color="var(--status-success)" label="Recebendo funding" />
          <LegendItem color="var(--action-primary)" label="Zero / Neutro" />
          <LegendItem color="var(--status-error)" label="Pagando funding" />
        </div>
      </div>
    </Card>
  );
}

// ===== SUB-COMPONENTS =====

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StatItem({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-xs text-text-muted">{label}:</span>
      <span className={cn("text-xs font-mono font-medium", color)}>{value}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div 
        className="w-2.5 h-2.5 rounded-full" 
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
