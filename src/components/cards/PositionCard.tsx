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
    <Card className={cn("p-5 border transition-all duration-200 overflow-hidden relative", 
      isLong ? "border-l-4 border-l-status-success border-border-default" : "border-l-4 border-l-status-error border-border-default"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{position.asset}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isLong ? 'default' : 'destructive'} 
              className={cn("text-xs", isLong ? "bg-status-success/20 text-status-success border-status-success/30" : "")}>
              {isLong ? 'LONG' : 'SHORT'} {position.leverage}x
            </Badge>
          </div>
        </div>
        <div className={cn("text-right", isProfit ? "text-status-success" : "text-status-error")}>
          <div className="flex items-center gap-1 justify-end">
            {isProfit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            <span className="text-2xl font-bold font-mono">{isProfit ? '+' : ''}${position.pnl.toFixed(2)}</span>
          </div>
          <span className={cn("text-sm font-medium", isProfit ? "text-status-success" : "text-status-error")}>
            {isProfit ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-text-muted block mb-1">Tamanho</span>
          <span className="text-sm font-medium font-mono text-text-primary">
            {position.size} {position.asset.replace('USDT', '')}
          </span>
        </div>
        <div>
          <span className="text-xs text-text-muted block mb-1">Margem</span>
          <span className="text-sm font-medium font-mono text-text-primary">${position.margin.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted block mb-1">Preço de Entrada</span>
          <span className="text-sm font-medium font-mono text-text-primary">${position.entryPrice.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted block mb-1">Preço Atual</span>
          <span className="text-sm font-medium font-mono text-text-primary">${position.markPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-border-default">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("w-4 h-4", liquidationDistance < 10 ? "text-status-error" : "text-accent-orange")} />
            <span className="text-sm text-text-secondary">Preço de Liquidação</span>
          </div>
          <span className="text-sm font-medium font-mono text-status-error">${position.liquidationPrice.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-surface-card-alt rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-300", 
            liquidationDistance < 10 ? "bg-status-error" : liquidationDistance < 20 ? "bg-accent-orange" : "bg-status-success"
          )} style={{ width: `${Math.min(liquidationDistance, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted">{liquidationDistance.toFixed(1)}% de distância</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between">
        <span className="text-sm text-text-secondary">Funding Rate (8h)</span>
        <span className={cn("text-sm font-medium font-mono", position.fundingRate >= 0 ? "text-status-success" : "text-status-error")}>
          {position.fundingRate >= 0 ? '+' : ''}{position.fundingRate.toFixed(2)} USDT
        </span>
      </div>
    </Card>
  );
});
