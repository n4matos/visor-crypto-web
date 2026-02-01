import { useEffect, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Receipt,
  DollarSign,
  Activity,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MetricCard, PositionCard } from '@/components/cards';
import { useDashboard, usePositions, useTransactions } from '@/hooks';
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

interface DashboardViewProps {
  connected: boolean;
}

export function DashboardView({ connected }: DashboardViewProps) {
  const { summary, equityCurve, isLoading: dashboardLoading, error: dashboardError, fetchDashboardData } = useDashboard();
  const { positions, isLoading: positionsLoading, error: positionsError, fetchPositions } = usePositions();
  const { transactions, isLoading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransactions();

  // Fetch all data on component mount
  useEffect(() => {
    if (connected) {
      fetchDashboardData('all');
      fetchPositions();
      fetchTransactions({ limit: 5 });
    }
  }, [fetchDashboardData, fetchPositions, fetchTransactions, connected]);

  const isLoading = connected && (dashboardLoading || positionsLoading || transactionsLoading);
  const error = connected && (dashboardError || positionsError || transactionsError);

  // Get recent equity data (last 30 days)
  const recentEquityData = useMemo(() => {
    if (!equityCurve?.points) return [];
    return equityCurve.points.slice(-RECENT_EQUITY_DAYS);
  }, [equityCurve]);

  // Calculate change percent for badge
  const change30dPercent = useMemo(() => {
    if (!equityCurve?.points || equityCurve.points.length < 2) return 0;
    const first = equityCurve.points[0].equityUSD;
    const last = equityCurve.points[equityCurve.points.length - 1].equityUSD;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [equityCurve]);

  // Get change 7d percent
  const change7dPercent = useMemo(() => {
    if (!equityCurve?.points || equityCurve.points.length < 8) return 0;
    const point7dAgo = equityCurve.points[equityCurve.points.length - 8].equityUSD;
    const last = equityCurve.points[equityCurve.points.length - 1].equityUSD;
    return point7dAgo > 0 ? ((last - point7dAgo) / point7dAgo) * 100 : 0;
  }, [equityCurve]);

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
        <p className="text-text-secondary">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="flex items-center gap-2 text-status-error">
          <AlertCircle className="w-6 h-6" />
          <span>{typeof error === 'string' ? error : 'Erro ao carregar dados'}</span>
        </div>
        <Button
          onClick={() => {
            if (connected) {
              fetchDashboardData('all');
              fetchPositions();
              fetchTransactions({ limit: 5 });
            }
          }}
          variant="outline"
          className="border-border-default"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const hasData = connected && summary && summary.totalPositions > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {!connected ? (
        <Card className="p-8 border border-border-default bg-surface-card text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-card-alt flex items-center justify-center">
              <Wallet className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Conecte sua conta</h3>
            <p className="text-text-secondary max-w-md">
              Para visualizar seus dados, você precisa configurar suas credenciais da Bybit.
            </p>
          </div>
        </Card>
      ) : !hasData ? (
        <Card className="p-8 border border-border-default bg-surface-card text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-card-alt flex items-center justify-center">
              <Wallet className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Bem-vindo ao Visor Crypto</h3>
            <p className="text-text-secondary max-w-md">
              Para começar a visualizar seus dados, configure suas credenciais da Bybit em Configurações
              e sincronize seus dados.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Saldo Total"
              value={`$${summary?.currentEquityUSD.toLocaleString() || '0'}`}
              subtitle={`₿${summary?.currentEquityBTC.toFixed(6) || '0'}`}
              change={{ value: summary?.todayPnL || 0, percent: (summary?.totalReturnUSD || 0) }}
              icon={<Wallet className="w-5 h-5" />}
            />
            <MetricCard
              title="PnL Hoje"
              value={`$${(summary?.todayPnL || 0).toFixed(2)}`}
              change={{ value: summary?.todayPnL || 0, percent: summary?.currentEquityUSD ? ((summary?.todayPnL || 0) / summary?.currentEquityUSD) * 100 : 0 }}
              icon={<TrendingUp className="w-5 h-5" />}
              variant={(summary?.todayPnL || 0) >= 0 ? 'success' : 'error'}
            />
            <MetricCard
              title="PnL Semana"
              value={`$${(summary?.weekPnL || 0).toFixed(2)}`}
              change={{ value: summary?.weekPnL || 0, percent: summary?.currentEquityUSD ? ((summary?.weekPnL || 0) / summary?.currentEquityUSD) * 100 : 0 }}
              icon={<Receipt className="w-5 h-5" />}
              variant={(summary?.weekPnL || 0) >= 0 ? 'success' : 'error'}
            />
            <MetricCard
              title="PnL Mês"
              value={`$${(summary?.monthPnL || 0).toFixed(2)}`}
              change={{ value: summary?.monthPnL || 0, percent: summary?.currentEquityUSD ? ((summary?.monthPnL || 0) / summary?.currentEquityUSD) * 100 : 0 }}
              icon={<DollarSign className="w-5 h-5" />}
              variant={(summary?.monthPnL || 0) >= 0 ? 'success' : 'error'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5 border border-border-default bg-surface-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Curva de Equity</h2>
                  <p className="text-sm text-text-secondary">Evolução do capital em USD</p>
                </div>
                <Badge variant="secondary" className={cn(
                  change30dPercent >= 0 ? "bg-status-success/20 text-status-success border-status-success/30" : "bg-status-error/20 text-status-error border-status-error/30"
                )}>
                  {change30dPercent >= 0 ? '+' : ''}{change30dPercent.toFixed(2)}% (30d)
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
                          <span className="text-sm font-mono font-medium text-text-primary">${typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}</span>
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
                  label="Posições Abertas"
                  value={summary?.openPositions?.toString() || '0'}
                  isMono
                />
                <SummaryItem
                  icon={<ArrowUpRight className={cn("w-5 h-5", change7dPercent >= 0 ? "text-status-success" : "text-status-error")} />}
                  bgColor={change7dPercent >= 0 ? "bg-status-success-muted" : "bg-status-error-muted"}
                  label="Variação 7D"
                  value={`${change7dPercent >= 0 ? '+' : ''}${change7dPercent.toFixed(2)}%`}
                  valueColor={change7dPercent >= 0 ? "text-status-success" : "text-status-error"}
                  isMono
                />
                <SummaryItem
                  icon={<TrendingUp className="w-5 h-5 text-status-success" />}
                  bgColor="bg-status-success-muted"
                  label="Total de Trades"
                  value={summary?.totalPositions?.toString() || '0'}
                  isMono
                />
                <SummaryItem
                  icon={<DollarSign className="w-5 h-5 text-action-primary" />}
                  bgColor="bg-action-primary-muted"
                  label="Retorno Total"
                  value={`${summary?.totalReturnUSD >= 0 ? '+' : ''}${(summary?.totalReturnUSD || 0).toFixed(2)}%`}
                  valueColor={summary?.totalReturnUSD >= 0 ? "text-status-success" : "text-status-error"}
                  isMono
                />
              </div>
            </Card>
          </div>

          {positions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Posições Abertas</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {positions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={{
                      id: position.id,
                      asset: position.symbol.replace('USDT', ''),
                      direction: position.side,
                      leverage: parseInt(position.leverage),
                      size: parseFloat(position.size),
                      entryPrice: parseFloat(position.entry_price),
                      markPrice: parseFloat(position.mark_price),
                      pnl: parseFloat(position.unrealized_pnl),
                      pnlPercent: parseFloat(position.unrealized_pnl_pct),
                      margin: parseFloat(position.margin),
                      liquidationPrice: parseFloat(position.liquidation_price),
                      fundingRate: parseFloat(position.funding_rate) || 0,
                      fundingInterval: position.funding_interval,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <Card className="p-5 border border-border-default bg-surface-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Atividade Recente</h2>
                <Badge variant="secondary" className="text-xs bg-surface-card-alt">Últimas 5 transações</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Par</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Tipo</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Lado</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border-subtle hover:bg-surface-card-alt/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-text-secondary">{new Date(tx.executed_at).toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4 text-sm font-medium text-text-primary">{tx.symbol}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs border-border-default">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={tx.side === 'Buy' ? 'default' : 'destructive'}
                            className={cn("text-xs", tx.side === 'Buy' ? "bg-status-success/20 text-status-success border-status-success/30" : "bg-status-error/20 text-status-error border-status-error/30")}>
                            {tx.side === 'Buy' ? 'Compra' : 'Venda'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono font-medium text-right text-text-primary">
                          ${(parseFloat(tx.price) * parseFloat(tx.qty)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
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
