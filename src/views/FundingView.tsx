import { useMemo, useEffect, useState } from 'react';
import { DollarSign, Calendar, Clock, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
import { useFunding } from '@/hooks';
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

export function FundingView() {
  const [period, setPeriod] = useState<Period>('30d');
  const { funding, isLoading, error, fetchFunding } = useFunding();

  // Fetch data on component mount
  useEffect(() => {
    fetchFunding();
  }, [fetchFunding]);

  // Calculate totals based on selected period
  const { totalToday, totalWeek, periodTotal } = useMemo(() => {
    const today = funding.reduce((sum, f) => sum + parseFloat(f.today), 0);
    const week = funding.reduce((sum, f) => sum + parseFloat(f.week), 0);
    const month = funding.reduce((sum, f) => sum + parseFloat(f.month), 0);
    const all = funding.reduce((sum, f) => sum + parseFloat(f.total), 0);
    
    // Select which value to show based on period
    let periodValue = month;
    switch (period) {
      case '24h':
        periodValue = today;
        break;
      case '7d':
        periodValue = week;
        break;
      case '30d':
        periodValue = month;
        break;
      case '90d':
      case '1y':
      case 'all':
        // For longer periods, use total (or month if total is too old)
        periodValue = all !== 0 ? all : month;
        break;
    }
    
    return {
      totalToday: today,
      totalWeek: week,
      periodTotal: periodValue,
    };
  }, [funding, period]);

  // Create chart data from funding - show appropriate field based on period
  const chartData = useMemo(() => {
    let field: 'today' | 'week' | 'month' | 'total' = 'month';
    switch (period) {
      case '24h':
        field = 'today';
        break;
      case '7d':
        field = 'week';
        break;
      case '30d':
        field = 'month';
        break;
      case '90d':
      case '1y':
      case 'all':
        field = 'total';
        break;
    }
    
    return funding.map(f => ({
      symbol: f.symbol.replace('USDT', ''),
      value: parseFloat(f[field]),
      today: parseFloat(f.today),
      week: parseFloat(f.week),
      month: parseFloat(f.month),
      total: parseFloat(f.total),
    }));
  }, [funding, period]);

  // Get period label for display
  const periodLabel = useMemo(() => {
    switch (period) {
      case '24h': return 'Hoje';
      case '7d': return 'Semana';
      case '30d': return 'Mês';
      case '90d': return 'Trimestre';
      case '1y': return 'Ano';
      case 'all': return 'Total';
      default: return 'Período';
    }
  }, [period]);

  if (isLoading && funding.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
        <p className="text-text-secondary">Carregando dados de funding...</p>
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
        <Button onClick={fetchFunding} variant="outline" className="border-border-default">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Funding Rate</h1>
          <p className="text-text-secondary">Acompanhe o funding pago ou recebido nas suas posições</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Funding Hoje" 
          value={`$${Math.abs(totalToday).toFixed(2)}`} 
          change={{ value: totalToday, percent: 0 }} 
          icon={<DollarSign className="w-5 h-5" />} 
          variant={totalToday >= 0 ? 'success' : 'error'} 
        />
        <MetricCard 
          title="Funding Semana" 
          value={`$${Math.abs(totalWeek).toFixed(2)}`} 
          change={{ value: totalWeek, percent: 0 }} 
          icon={<Calendar className="w-5 h-5" />} 
          variant={totalWeek >= 0 ? 'success' : 'error'} 
        />
        <MetricCard 
          title={`Funding ${periodLabel}`} 
          value={`$${Math.abs(periodTotal).toFixed(2)}`} 
          change={{ value: periodTotal, percent: 0 }} 
          icon={<Clock className="w-5 h-5" />} 
          variant={periodTotal >= 0 ? 'success' : 'error'} 
        />
        <Card className={cn("p-5 border transition-all duration-200", periodTotal >= 0 ? "border-status-success/30 bg-status-success-muted" : "border-status-error/30 bg-status-error-muted")}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">Status ({periodLabel})</span>
            {periodTotal >= 0 ? <TrendingUp className="w-5 h-5 text-status-success" /> : <TrendingDown className="w-5 h-5 text-status-error" />}
          </div>
          <div>
            <span className={cn("text-2xl lg:text-3xl font-bold font-mono", periodTotal >= 0 ? "text-status-success" : "text-status-error")}>
              {periodTotal >= 0 ? 'FAVORÁVEL' : 'DESFAVORÁVEL'}
            </span>
            <p className="text-xs text-text-muted mt-1">
              {periodTotal >= 0 ? 'Você está recebendo mais funding do que pagando' : 'Você está pagando mais funding do que recebendo'}
            </p>
          </div>
        </Card>
      </div>

      {funding.length > 0 && (
        <Card className="p-5 border border-border-default bg-surface-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Funding por Ativo ({periodLabel})</h2>
              <p className="text-sm text-text-secondary">Total acumulado por par de trading</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis 
                  dataKey="symbol" 
                  tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--chart-grid)' }} 
                />
                <YAxis 
                  tick={{ fill: 'var(--chart-axis-label)', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${v.toLocaleString()}`} 
                />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
                    <p className="text-xs text-text-secondary mb-2">Funding ({periodLabel})</p>
                    <p className={cn("text-sm font-mono font-medium", (payload[0].value as number) >= 0 ? "text-status-success" : "text-status-error")}>
                      ${(payload[0].value as number).toFixed(2)}
                    </p>
                  </div>
                ) : null} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.value >= 0 ? 'var(--status-success)' : 'var(--status-error)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Breakdown por Ativo</h2>
        {funding.length === 0 ? (
          <Card className="p-8 border border-border-default bg-surface-card text-center">
            <p className="text-text-secondary">Nenhum dado de funding disponível.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {funding.map((asset) => {
              // Select which value to display based on period
              let displayValue = parseFloat(asset.month);
              switch (period) {
                case '24h':
                  displayValue = parseFloat(asset.today);
                  break;
                case '7d':
                  displayValue = parseFloat(asset.week);
                  break;
                case '30d':
                  displayValue = parseFloat(asset.month);
                  break;
                case '90d':
                case '1y':
                case 'all':
                  displayValue = parseFloat(asset.total) || parseFloat(asset.month);
                  break;
              }
              
              return (
                <Card key={asset.symbol} 
                  className={cn("p-5 border transition-all duration-200 card-hover", 
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
                    {period === '24h' || period === 'all' ? (
                      <FundingRow label="Hoje" value={parseFloat(asset.today)} />
                    ) : null}
                    {period === '7d' || period === 'all' ? (
                      <FundingRow label="Semana" value={parseFloat(asset.week)} />
                    ) : null}
                    {period === '30d' || period === '90d' || period === '1y' || period === 'all' ? (
                      <FundingRow label="Mês" value={parseFloat(asset.month)} />
                    ) : null}
                    <FundingRow label="Total" value={parseFloat(asset.total)} isHighlight />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface FundingRowProps {
  label: string;
  value: number;
  isHighlight?: boolean;
}

function FundingRow({ label, value, isHighlight }: FundingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", isHighlight ? "text-text-primary font-medium" : "text-text-secondary")}>{label}</span>
      <span className={cn("text-sm font-mono font-medium", value >= 0 ? "text-status-success" : "text-status-error")}>
        {value >= 0 ? '+' : ''}${value.toFixed(2)}
      </span>
    </div>
  );
}
