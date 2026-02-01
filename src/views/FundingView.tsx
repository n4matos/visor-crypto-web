import { useState, useMemo } from 'react';
import { DollarSign, Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
import type { Period, FundingDataPoint } from '@/types';

// TODO: Substituir por chamadas à API
const accountData = {
  fundingToday: 0,
  fundingWeek: 0,
};

const fundingData: FundingDataPoint[] = [];

interface FundingSummaryItem {
  asset: string;
  today: number;
  week: number;
  month: number;
  status: 'favorable' | 'unfavorable';
}

const fundingSummary: FundingSummaryItem[] = [];
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

const PERIOD_DAYS: Record<Period, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 30, // Limitado a 30 dias
  '1y': 30,
  'all': 30,
};

export function FundingView() {
  const [period, setPeriod] = useState<Period>('30d');
  
  const { filteredData, totalMonth } = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const data = fundingData.slice(-days);
    const total = data.reduce((sum, d) => sum + d.total, 0);
    
    return {
      filteredData: data,
      totalMonth: total,
    };
  }, [period]);

  const totalToday = accountData.fundingToday;
  const totalWeek = accountData.fundingWeek;

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
          title="Funding Mês" 
          value={`$${Math.abs(totalMonth).toFixed(2)}`} 
          change={{ value: totalMonth, percent: 0 }} 
          icon={<Clock className="w-5 h-5" />} 
          variant={totalMonth >= 0 ? 'success' : 'error'} 
        />
        <Card className={cn("p-5 border transition-all duration-200", totalMonth >= 0 ? "border-status-success/30 bg-status-success-muted" : "border-status-error/30 bg-status-error-muted")}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">Status</span>
            {totalMonth >= 0 ? <TrendingUp className="w-5 h-5 text-status-success" /> : <TrendingDown className="w-5 h-5 text-status-error" />}
          </div>
          <div>
            <span className={cn("text-2xl lg:text-3xl font-bold font-mono", totalMonth >= 0 ? "text-status-success" : "text-status-error")}>
              {totalMonth >= 0 ? 'FAVORÁVEL' : 'DESFAVORÁVEL'}
            </span>
            <p className="text-xs text-text-muted mt-1">
              {totalMonth >= 0 ? 'Você está recebendo mais funding do que pagando' : 'Você está pagando mais funding do que recebendo'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-5 border border-border-default bg-surface-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Evolução do Funding</h2>
            <p className="text-sm text-text-secondary">Funding rate acumulado ao longo do tempo</p>
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData.map(d => ({ date: d.date, value: d.total }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  <p className="text-sm text-text-secondary mb-1">{new Date(label || '').toLocaleDateString('pt-BR')}</p>
                  <p className={cn("text-sm font-mono font-medium", (payload[0].value as number) >= 0 ? "text-status-success" : "text-status-error")}>
                    ${payload[0].value?.toLocaleString()}
                  </p>
                </div>
              ) : null} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {filteredData.map((d, i) => <Cell key={i} fill={d.total >= 0 ? 'var(--status-success)' : 'var(--status-error)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Breakdown por Ativo</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {fundingSummary.map((asset) => (
            <Card key={asset.asset} 
              className={cn("p-5 border transition-all duration-200 card-hover", 
                asset.today >= 0 ? "border-status-success/30 bg-status-success-muted/50" : "border-status-error/30 bg-status-error-muted/50"
              )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{asset.asset}</h3>
                <Badge variant={asset.today >= 0 ? 'default' : 'destructive'} 
                  className={asset.today >= 0 ? "bg-status-success/20 text-status-success border-status-success/30" : ""}>
                  {asset.today >= 0 ? 'RECEBENDO' : 'PAGANDO'}
                </Badge>
              </div>
              <div className="space-y-3">
                <FundingRow label="Hoje" value={asset.today} />
                <FundingRow label="Semana" value={asset.week} />
                <FundingRow label="Mês" value={asset.month} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FundingRowProps {
  label: string;
  value: number;
}

function FundingRow({ label, value }: FundingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn("text-sm font-mono font-medium", value >= 0 ? "text-status-success" : "text-status-error")}>
        {value >= 0 ? '+' : ''}${value.toFixed(2)}
      </span>
    </div>
  );
}
