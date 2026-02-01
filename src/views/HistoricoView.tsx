import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Trade } from '@/types';

// TODO: Substituir por chamada à API
const tradeHistory: Trade[] = [];

type DirectionFilter = 'ALL' | 'LONG' | 'SHORT';
type ResultFilter = 'ALL' | 'WIN' | 'LOSS';

const MAX_TRADES_DISPLAY = 20;

export function HistoricoView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('ALL');

  const { filteredTrades, winCount, totalPnl, totalFees } = useMemo(() => {
    const filtered = tradeHistory.filter(trade => {
      if (searchQuery && !trade.pair.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (directionFilter !== 'ALL' && trade.direction !== directionFilter) return false;
      if (resultFilter !== 'ALL') { 
        if (resultFilter === 'WIN' && trade.pnl < 0) return false; 
        if (resultFilter === 'LOSS' && trade.pnl >= 0) return false; 
      }
      return true;
    });

    return {
      filteredTrades: filtered,
      winCount: filtered.filter(t => t.pnl >= 0).length,
      totalPnl: filtered.reduce((sum, t) => sum + t.pnl, 0),
      totalFees: filtered.reduce((sum, t) => sum + t.fees, 0),
    };
  }, [searchQuery, directionFilter, resultFilter]);

  const winRate = filteredTrades.length > 0 ? ((winCount / filteredTrades.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Histórico de Trades</h1>
          <p className="text-text-secondary">Visualize todos os seus trades executados</p>
        </div>
        <Button variant="outline" className="gap-2 border-border-default hover:bg-surface-card-alt">
          <Download className="w-4 h-4" />Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border-default bg-surface-card">
          <span className="text-xs text-text-secondary uppercase">Total Trades</span>
          <p className="text-2xl font-bold font-mono text-text-primary">{filteredTrades.length}</p>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-card">
          <span className="text-xs text-text-secondary uppercase">Win Rate</span>
          <p className="text-2xl font-bold font-mono text-status-success">{winRate}%</p>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-card">
          <span className="text-xs text-text-secondary uppercase">PnL Total</span>
          <p className={cn("text-2xl font-bold font-mono", totalPnl >= 0 ? "text-status-success" : "text-status-error")}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-card">
          <span className="text-xs text-text-secondary uppercase">Taxas Totais</span>
          <p className="text-2xl font-bold font-mono text-status-error">${totalFees.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4 border border-border-default bg-surface-card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Buscar por par..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 bg-surface-input border-border-default" 
            />
          </div>
          <FilterButtons 
            options={['ALL', 'LONG', 'SHORT'] as const}
            value={directionFilter}
            onChange={setDirectionFilter}
            labels={{ ALL: 'Tudo', LONG: 'LONG', SHORT: 'SHORT' }}
          />
          <FilterButtons 
            options={['ALL', 'WIN', 'LOSS'] as const}
            value={resultFilter}
            onChange={setResultFilter}
            labels={{ ALL: 'Tudo', WIN: 'Ganhos', LOSS: 'Perdas' }}
            variant="result"
          />
        </div>
      </Card>

      <Card className="border border-border-default bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-surface-card-alt/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Data</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Par</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Direção</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Tamanho</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">PnL</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Taxas</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.slice(0, MAX_TRADES_DISPLAY).map((trade) => (
                <tr key={trade.id} className="border-b border-border-subtle hover:bg-surface-card-alt/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {new Date(trade.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">{trade.pair}</td>
                  <td className="py-3 px-4">
                    <Badge variant={trade.direction === 'LONG' ? 'default' : 'destructive'} 
                      className={cn("text-xs", trade.direction === 'LONG' ? "bg-status-success/20 text-status-success border-status-success/30" : "")}>
                      {trade.direction}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">{trade.size}</td>
                  <td className={cn("py-3 px-4 text-sm font-mono font-medium text-right", trade.pnl >= 0 ? "text-status-success" : "text-status-error")}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-status-error text-right">${trade.fees.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

interface FilterButtonsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labels: Record<T, string>;
  variant?: 'default' | 'result';
}

function FilterButtons<T extends string>({ options, value, onChange, labels, variant = 'default' }: FilterButtonsProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button 
          key={option} 
          onClick={() => onChange(option)} 
          className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200", 
            value === option 
              ? variant === 'result' 
                ? option === 'WIN' 
                  ? "bg-status-success text-white" 
                  : option === 'LOSS' 
                    ? "bg-status-error text-white" 
                    : "bg-action-primary text-white"
                : "bg-action-primary text-white"
              : "bg-surface-card-alt text-text-secondary"
          )}>
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
