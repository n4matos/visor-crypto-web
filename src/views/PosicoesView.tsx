import { useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PositionCard } from '@/components/cards';
import { ViewLoading, ViewError, ViewEmpty, PageHeader, StatItem } from '@/components/shared';
import { usePositions } from '@/hooks';

import { usePortfolio } from '@/contexts/PortfolioContext';

export function PosicoesView() {
  const { activePortfolioId } = usePortfolio();
  const { positions, summary, isLoading, error, fetchPositions } = usePositions();

  useEffect(() => {
    if (activePortfolioId) {
      fetchPositions(activePortfolioId);
      const interval = setInterval(() => fetchPositions(activePortfolioId), 30000);
      return () => clearInterval(interval);
    }
  }, [fetchPositions, activePortfolioId]);

  const stats = useMemo(() => {
    const totalPnl = positions.reduce((acc, pos) => acc + parseFloat(pos.unrealized_pnl), 0);
    const totalMargin = summary?.total_margin || positions.reduce((acc, pos) => acc + parseFloat(pos.margin), 0);
    const longCount = summary?.long_count || positions.filter(p => p.side === 'LONG').length;
    const shortCount = summary?.short_count || positions.filter(p => p.side === 'SHORT').length;
    const totalFunding = positions.reduce((acc, pos) => acc + parseFloat(pos.funding_rate || '0'), 0);

    return { totalPnl, totalMargin, longCount, shortCount, totalFunding };
  }, [positions, summary]);

  if (!activePortfolioId) {
    return (
      <ViewEmpty
        icon={<Wallet className="w-8 h-8 text-text-muted" />}
        title="Selecione uma Carteira"
        description="Selecione uma carteira para ver suas posições."
      />
    );
  }

  if (activePortfolioId && isLoading && positions.length === 0) {
    return <ViewLoading message="Carregando posicoes..." />;
  }

  if (error) {
    return <ViewError error={error} onRetry={() => fetchPositions(activePortfolioId)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Posicoes Abertas" subtitle="Acompanhe suas posicoes em tempo real" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem
          layout="compact"
          icon={<Wallet className="w-5 h-5 text-action-primary" />}
          iconBg="bg-action-primary-muted"
          label="PnL Nao-Realizado"
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
          valueColor={stats.totalPnl >= 0 ? 'text-status-success' : 'text-status-error'}
        />
        <StatItem
          layout="compact"
          icon={<span className="text-lg font-bold text-text-primary">$</span>}
          iconBg="bg-surface-card-alt"
          label="Margem Total"
          value={`$${stats.totalMargin.toFixed(2)}`}
        />
        <StatItem
          layout="compact"
          icon={<TrendingUp className="w-5 h-5 text-status-success" />}
          iconBg="bg-status-success-muted"
          label="Posicoes Long"
          value={stats.longCount.toString()}
          valueColor="text-status-success"
        />
        <StatItem
          layout="compact"
          icon={<TrendingDown className="w-5 h-5 text-status-error" />}
          iconBg="bg-status-error-muted"
          label="Posicoes Short"
          value={stats.shortCount.toString()}
          valueColor="text-status-error"
        />
      </div>

      <Card className={cn("p-4 border transition-all duration-200",
        stats.totalFunding >= 0 ? "border-status-success/30 bg-status-success-muted/20" : "border-status-error/30 bg-status-error-muted/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
              stats.totalFunding >= 0 ? "bg-status-success/20" : "bg-status-error/20"
            )}>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Detalhes das Posicoes</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPositions(activePortfolioId)}
            disabled={isLoading}
            className="text-text-secondary hover:text-text-primary"
          >
            <Loader2 className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {positions.length === 0 ? (
          <Card className="p-8 border border-border-default bg-surface-card text-center">
            <p className="text-text-secondary">Nenhuma posicao aberta no momento.</p>
          </Card>
        ) : (
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
        )}
      </div>
    </div>
  );
}
