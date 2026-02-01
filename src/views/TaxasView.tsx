import { useState, useMemo } from 'react';
import { Receipt, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MetricCard } from '@/components/cards';
import type { Period, FeesDataPoint } from '@/types';

// TODO: Substituir por chamadas à API
const accountData = {
  feesToday: 0,
  feesWeek: 0,
};

const feesData: FeesDataPoint[] = [];

const feesSummary = {
  makerTotal: 0,
  takerTotal: 0,
  makerPercent: 0,
  takerPercent: 0,
  impactOnPnl: 0,
};
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PERIOD_DAYS: Record<Period, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 30,
  '1y': 30,
  'all': 30,
};

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

export function TaxasView() {
  const [period, setPeriod] = useState<Period>('30d');
  
  const { totalMonth, totalMaker, totalTaker, pieData } = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const data = feesData.slice(-days);
    const total = data.reduce((sum, d) => sum + d.total, 0);
    const maker = data.reduce((sum, d) => sum + d.maker, 0);
    const taker = data.reduce((sum, d) => sum + d.taker, 0);
    
    const pie: PieDataItem[] = [
      { name: 'Maker', value: maker, color: 'var(--status-success)' }, 
      { name: 'Taker', value: taker, color: 'var(--status-error)' }
    ];
    
    return {
      totalMonth: total,
      totalMaker: maker,
      totalTaker: taker,
      pieData: pie,
    };
  }, [period]);

  const pieTotal = totalMaker + totalTaker;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Taxas de Trading</h1>
          <p className="text-text-secondary">Acompanhe quanto você paga em taxas de trading</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Taxas Hoje" value={`$${accountData.feesToday.toFixed(2)}`} icon={<Receipt className="w-5 h-5" />} variant="error" />
        <MetricCard title="Taxas Semana" value={`$${accountData.feesWeek.toFixed(2)}`} icon={<Receipt className="w-5 h-5" />} variant="error" />
        <MetricCard title="Taxas Mês" value={`$${totalMonth.toFixed(2)}`} icon={<Receipt className="w-5 h-5" />} variant="error" />
        <MetricCard title="Impacto no PnL" value={`${feesSummary.impactOnPnl.toFixed(1)}%`} icon={<TrendingDown className="w-5 h-5" />} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 border border-border-default bg-surface-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Evolução das Taxas</h2>
            <p className="text-sm text-text-secondary">Taxas pagas ao longo do tempo</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feesData.slice(-PERIOD_DAYS[period]).map(d => ({ date: d.date, value: d.total }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                    <p className="text-sm font-mono font-medium text-status-error">${payload[0].value?.toLocaleString()}</p>
                  </div>
                ) : null} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--status-error)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border border-border-default bg-surface-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Breakdown</h2>
            <p className="text-sm text-text-secondary">Maker vs Taker fees</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData.map(d => ({ ...d, total: pieTotal }))} 
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value"
                >
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                      <span className="text-sm text-text-secondary">{payload[0].name}</span>
                    </div>
                    <p className="text-sm font-mono font-medium text-text-primary">${payload[0].value?.toLocaleString()}</p>
                    <p className="text-xs text-text-muted mt-1">{((payload[0].value as number / pieTotal) * 100).toFixed(1)}%</p>
                  </div>
                ) : null} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            <FeeRow label="Maker" value={totalMaker} percent={feesSummary.makerPercent} color="bg-status-success" />
            <FeeRow label="Taker" value={totalTaker} percent={feesSummary.takerPercent} color="bg-status-error" />
          </div>
        </Card>
      </div>
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
