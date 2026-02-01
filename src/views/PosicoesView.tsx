import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PositionCard } from '@/components/cards';
import type { Position } from '@/types';

// TODO: Substituir por chamada à API
const openPositions: Position[] = [];

interface PositionStats {
  totalPnl: number;
  totalMargin: number;
  longCount: number;
  shortCount: number;
  totalFunding: number;
}

export function PosicoesView() {
  const stats = useMemo<PositionStats>(() => {
    return openPositions.reduce((acc, pos) => ({
      totalPnl: acc.totalPnl + pos.pnl,
      totalMargin: acc.totalMargin + pos.margin,
      longCount: acc.longCount + (pos.direction === 'LONG' ? 1 : 0),
      shortCount: acc.shortCount + (pos.direction === 'SHORT' ? 1 : 0),
      totalFunding: acc.totalFunding + pos.fundingRate,
    }), { totalPnl: 0, totalMargin: 0, longCount: 0, shortCount: 0, totalFunding: 0 });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Posições Abertas</h1>
        <p className="text-text-secondary">Acompanhe suas posições em tempo real</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Wallet className="w-5 h-5 text-action-primary" />}
          bgColor="bg-action-primary-muted"
          label="PnL Não-Realizado"
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
          valueColor={stats.totalPnl >= 0 ? 'text-status-success' : 'text-status-error'}
        />
        <StatCard 
          icon={<span className="text-lg font-bold text-text-primary">$</span>}
          bgColor="bg-surface-card-alt"
          label="Margem Total"
          value={`$${stats.totalMargin.toFixed(2)}`}
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-status-success" />}
          bgColor="bg-status-success-muted"
          label="Posições Long"
          value={stats.longCount.toString()}
          valueColor="text-status-success"
        />
        <StatCard 
          icon={<TrendingDown className="w-5 h-5 text-status-error" />}
          bgColor="bg-status-error-muted"
          label="Posições Short"
          value={stats.shortCount.toString()}
          valueColor="text-status-error"
        />
      </div>

      <Card className={cn("p-4 border transition-all duration-200", stats.totalFunding >= 0 ? "border-status-success/30 bg-status-success-muted/20" : "border-status-error/30 bg-status-error-muted/20")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stats.totalFunding >= 0 ? "bg-status-success/20" : "bg-status-error/20")}>
              <Clock className={cn("w-5 h-5", stats.totalFunding >= 0 ? "text-status-success" : "text-status-error")} />
            </div>
            <div>
              <span className="text-sm text-text-secondary">Funding Rate Total (8h)</span>
              <p className={cn("text-lg font-bold font-mono", stats.totalFunding >= 0 ? "text-status-success" : "text-status-error")}>
                {stats.totalFunding >= 0 ? '+' : ''}${stats.totalFunding.toFixed(2)}
              </p>
            </div>
          </div>
          <Badge variant={stats.totalFunding >= 0 ? 'default' : 'destructive'} 
            className={stats.totalFunding >= 0 ? "bg-status-success/20 text-status-success border-status-success/30" : ""}>
            {stats.totalFunding >= 0 ? 'RECEBENDO' : 'PAGANDO'}
          </Badge>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Detalhes das Posições</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {openPositions.map((position) => <PositionCard key={position.id} position={position} />)}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: string;
  valueColor?: string;
}

function StatCard({ icon, bgColor, label, value, valueColor = 'text-text-primary' }: StatCardProps) {
  return (
    <Card className="p-4 border border-border-default bg-surface-card">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
          {icon}
        </div>
        <div>
          <span className="text-xs text-text-secondary uppercase">{label}</span>
          <p className={cn("text-xl font-bold font-mono", valueColor)}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
