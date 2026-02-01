import { useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Receipt, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MetricCard, PositionCard } from '@/components/cards';
import type { EquityDataPoint, Trade, Position } from '@/types';
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

const RECENT_EQUITY_DAYS = 30;
const RECENT_TRADES_COUNT = 5;

// TODO: Substituir por chamadas à API
const accountData = {
  balanceUSD: 0,
  balanceBTC: 0,
  change24h: { value: 0, percent: 0 },
  change7d: { value: 0, percent: 0 },
  change30d: { value: 0, percent: 0 },
  pnlToday: 0,
  pnlWeek: 0,
  pnlMonth: 0,
  tradesToday: 0,
  tradesWeek: 0,
  tradesMonth: 0,
  feesToday: 0,
  feesWeek: 0,
  feesMonth: 0,
  fundingToday: 0,
  fundingWeek: 0,
  fundingMonth: 0,
};

const equityData: EquityDataPoint[] = [];
const tradeHistory: Trade[] = [];
const openPositions: Position[] = [];

export function DashboardView() {
  const recentEquityData = useMemo(() => 
    equityData.slice(-RECENT_EQUITY_DAYS), 
    []
  );
  
  const recentTrades = useMemo(() => 
    tradeHistory.slice(0, RECENT_TRADES_COUNT), 
    []
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Saldo Total" 
          value={`$${accountData.balanceUSD.toLocaleString()}`} 
          subtitle={`₿${accountData.balanceBTC}`} 
          change={accountData.change24h} 
          icon={<Wallet className="w-5 h-5" />} 
        />
        <MetricCard 
          title="PnL Hoje" 
          value={`$${accountData.pnlToday.toFixed(2)}`} 
          change={{ value: accountData.pnlToday, percent: (accountData.pnlToday / accountData.balanceUSD) * 100 }} 
          icon={<TrendingUp className="w-5 h-5" />} 
          variant={accountData.pnlToday >= 0 ? 'success' : 'error'} 
        />
        <MetricCard 
          title="Taxas Hoje" 
          value={`$${accountData.feesToday.toFixed(2)}`} 
          icon={<Receipt className="w-5 h-5" />} 
          variant="error" 
        />
        <MetricCard 
          title="Funding Hoje" 
          value={`$${accountData.fundingToday.toFixed(2)}`} 
          change={{ value: accountData.fundingToday, percent: 0 }} 
          icon={<DollarSign className="w-5 h-5" />} 
          variant={accountData.fundingToday >= 0 ? 'success' : 'error'} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 border border-border-default bg-surface-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Curva de Equity</h2>
              <p className="text-sm text-text-secondary">Evolução do capital em USD</p>
            </div>
            <Badge variant="secondary" className="bg-status-success/20 text-status-success border-status-success/30">
              +{accountData.change30d.percent.toFixed(2)}% (30d)
            </Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={recentEquityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      <div className="w-3 h-3 rounded-full bg-[var(--chart-line-1)]" />
                      <span className="text-sm text-text-secondary">Equity USD:</span>
                      <span className="text-sm font-mono font-medium text-text-primary">${payload[0].value?.toLocaleString()}</span>
                    </div>
                  </div>
                ) : null} />
                <Area type="monotone" dataKey="equityUSD" stroke="none" fill="var(--chart-line-1)" fillOpacity={0.1} />
                <Line type="monotone" dataKey="equityUSD" stroke="var(--chart-line-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border border-border-default bg-surface-card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Resumo Rápido</h2>
          <div className="space-y-4">
            <SummaryItem 
              icon={<Activity className="w-5 h-5 text-action-primary" />}
              bgColor="bg-action-primary-muted"
              label="Trades Hoje"
              value={accountData.tradesToday.toString()}
              isMono
            />
            <SummaryItem 
              icon={<ArrowUpRight className="w-5 h-5 text-status-success" />}
              bgColor="bg-status-success-muted"
              label="Variação 7D"
              value={`+${accountData.change7d.percent.toFixed(2)}%`}
              valueColor="text-status-success"
              isMono
            />
            <SummaryItem 
              icon={<ArrowDownRight className="w-5 h-5 text-status-error" />}
              bgColor="bg-status-error-muted"
              label="Taxas Mês"
              value={`$${accountData.feesMonth.toFixed(2)}`}
              valueColor="text-status-error"
              isMono
            />
            <SummaryItem 
              icon={<DollarSign className="w-5 h-5 text-status-success" />}
              bgColor="bg-status-success-muted"
              label="Funding Mês"
              value={`${accountData.fundingMonth >= 0 ? '+' : ''}$${accountData.fundingMonth.toFixed(2)}`}
              valueColor={accountData.fundingMonth >= 0 ? 'text-status-success' : 'text-status-error'}
              isMono
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Posições Abertas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {openPositions.map((position) => <PositionCard key={position.id} position={position} />)}
        </div>
      </div>

      <Card className="p-5 border border-border-default bg-surface-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Atividade Recente</h2>
          <Badge variant="secondary" className="text-xs bg-surface-card-alt">Últimos 5 trades</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Data</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Par</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Direção</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">PnL</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-border-subtle hover:bg-surface-card-alt/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-text-secondary">{new Date(trade.date).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">{trade.pair}</td>
                  <td className="py-3 px-4">
                    <Badge variant={trade.direction === 'LONG' ? 'default' : 'destructive'} 
                      className={cn("text-xs", trade.direction === 'LONG' ? "bg-status-success/20 text-status-success border-status-success/30" : "")}>
                      {trade.direction}
                    </Badge>
                  </td>
                  <td className={cn("py-3 px-4 text-sm font-mono font-medium text-right", trade.pnl >= 0 ? "text-status-success" : "text-status-error")}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

interface SummaryItemProps {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: string;
  valueColor?: string;
  isMono?: boolean;
}

function SummaryItem({ icon, bgColor, label, value, valueColor = 'text-text-primary', isMono }: SummaryItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-card-alt">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className={cn("text-lg font-semibold", valueColor, isMono && "font-mono")}>{value}</p>
        </div>
      </div>
    </div>
  );
}
