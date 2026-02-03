import { memo } from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Position } from '@/types';

interface PositionCardProps {
  position: Position;
}

export const PositionCard = memo(function PositionCard({ position }: PositionCardProps) {
  const isLong = position.direction === 'LONG';
  const isProfit = position.pnl >= 0;
  const liquidationDistance = Math.abs(((position.markPrice - position.liquidationPrice) / position.markPrice) * 100);

  return (
    <Card className={cn("p-3 border transition-all duration-200 overflow-hidden relative", 
      isLong ? "border-l-4 border-l-status-success border-border-default" : "border-l-4 border-l-status-error border-border-default"
    )}>
      {/* Header: Asset + PnL */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">{position.asset}</h3>
          <Badge variant={isLong ? 'default' : 'destructive'} 
            className={cn("text-xs", isLong ? "bg-status-success/20 text-status-success border-status-success/30" : "")}>
            {isLong ? 'LONG' : 'SHORT'} {position.leverage}x
          </Badge>
        </div>
        <div className={cn("text-right", isProfit ? "text-status-success" : "text-status-error")}>
          <div className="flex items-center gap-1 justify-end">
            {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-base font-bold font-mono">{isProfit ? '+' : ''}${position.pnl.toFixed(2)}</span>
          </div>
          <span className={cn("text-xs font-medium", isProfit ? "text-status-success" : "text-status-error")}>
            {isProfit ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Grid de detalhes */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div>
          <span className="text-xs text-text-muted block">Tamanho</span>
          <span className="text-xs font-medium font-mono text-text-primary truncate block">
            {position.size}
          </span>
        </div>
        <div>
          <span className="text-xs text-text-muted block">Margem</span>
          <span className="text-xs font-medium font-mono text-text-primary">${position.margin.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted block">Entrada</span>
          <span className="text-xs font-medium font-mono text-text-primary">${position.entryPrice.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted block">Atual</span>
          <span className="text-xs font-medium font-mono text-text-primary">${position.markPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Liquidation Bar */}
      <div className="pt-3 border-t border-border-default/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={cn("w-3 h-3", liquidationDistance < 10 ? "text-status-error" : "text-accent-orange")} />
            <span className="text-xs text-text-secondary">Liq.</span>
            <span className="text-xs font-medium font-mono text-status-error">${position.liquidationPrice.toLocaleString()}</span>
          </div>
          <span className="text-xs text-text-muted">{liquidationDistance.toFixed(1)}%</span>
        </div>
        <div className="h-1 bg-surface-card-alt rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-300", 
            liquidationDistance < 10 ? "bg-status-error" : liquidationDistance < 20 ? "bg-accent-orange" : "bg-status-success"
          )} style={{ width: `${Math.min(liquidationDistance, 100)}%` }} />
        </div>
      </div>

      {/* Funding Rate */}
      <div className="mt-3 pt-2 border-t border-border-default/50 flex items-center justify-between">
        <span className="text-xs text-text-secondary">Funding (8h)</span>
        <span className={cn("text-xs font-medium font-mono", position.fundingRate >= 0 ? "text-status-success" : "text-status-error")}>
          {position.fundingRate >= 0 ? '+' : ''}{position.fundingRate.toFixed(2)} USDT
        </span>
      </div>
    </Card>
  );
});
