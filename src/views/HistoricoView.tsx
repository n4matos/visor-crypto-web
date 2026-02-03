import { useState, useMemo, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ViewLoading, ViewError, PageHeader } from '@/components/shared';
import { useTransactions } from '@/hooks';

type DirectionFilter = 'ALL' | 'Buy' | 'Sell';
type TypeFilter = 'ALL' | 'TRADE' | 'SETTLEMENT' | 'FEE' | 'TRANSFER';

const MAX_TRADES_DISPLAY = 50;

import { usePortfolio } from '@/contexts/PortfolioContext';

export function HistoricoView() {
  const { activePortfolioId } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const { transactions, isLoading, error, fetchTransactions } = useTransactions();

  useEffect(() => {
    if (activePortfolioId) {
      fetchTransactions({ limit: 100 }, activePortfolioId);
    }
  }, [fetchTransactions, activePortfolioId]);

  const filteredTrades = useMemo(() => {
    return transactions.filter(trade => {
      if (searchQuery && !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (directionFilter !== 'ALL' && trade.side !== directionFilter) return false;
      if (typeFilter !== 'ALL' && trade.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, searchQuery, directionFilter, typeFilter]);

  if (isLoading && transactions.length === 0) {
    return <ViewLoading message="Carregando histórico..." />;
  }

  if (error) {
    return <ViewError error={error} onRetry={() => activePortfolioId && fetchTransactions({ limit: 100 }, activePortfolioId)} />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Histórico de Trades" subtitle="Visualize todos os seus trades executados">
        <Button variant="outline" size="sm" className="h-8 text-xs gap-2 border-border-default hover:bg-surface-card-alt">
          <Download className="w-3.5 h-3.5" />Exportar CSV
        </Button>
      </PageHeader>

      {/* Filters - Compact */}
      <Card className="p-3 border border-border-default bg-surface-card">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Buscar por par..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm bg-surface-input border-border-default"
            />
          </div>
          <FilterButtons
            options={['ALL', 'Buy', 'Sell'] as const}
            value={directionFilter}
            onChange={setDirectionFilter}
            labels={{ ALL: 'Tudo', Buy: 'Compra', Sell: 'Venda' }}
          />
          <FilterButtons
            options={['ALL', 'TRADE', 'SETTLEMENT', 'FEE', 'TRANSFER'] as const}
            value={typeFilter}
            onChange={setTypeFilter}
            labels={{ ALL: 'Tudo', TRADE: 'Trade', SETTLEMENT: 'Settle', FEE: 'Taxa', TRANSFER: 'Transf' }}
          />
        </div>
      </Card>

      {/* Trade Table - Dense */}
      <Card className="border border-border-default bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-surface-card-alt/50">
                <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Data</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Par</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Tipo</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Lado</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Quantidade</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Preço</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.slice(0, MAX_TRADES_DISPLAY).map((trade) => (
                <tr key={trade.id} className="border-b border-border-default/50 hover:bg-surface-card-alt/30 transition-colors">
                  <td className="py-2 px-3 text-xs text-text-secondary">
                    {new Date(trade.executed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-xs font-medium text-text-primary">{trade.symbol.replace('USDT', '')}</span>
                    <span className="text-xs text-text-muted">/USDT</span>
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant="outline" className="text-xs border-border-default">
                      {trade.type}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant="outline"
                      className={cn("text-xs",
                        trade.side === 'Buy'
                          ? "border-status-success/30 text-status-success bg-status-success/10"
                          : "border-status-error/30 text-status-error bg-status-error/10"
                      )}>
                      {trade.side === 'Buy' ? 'COMPRA' : 'VENDA'}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-xs font-mono text-text-primary text-right">{parseFloat(trade.qty).toFixed(6)}</td>
                  <td className="py-2 px-3 text-xs font-mono text-text-primary text-right">${parseFloat(trade.price).toFixed(2)}</td>
                  <td className="py-2 px-3 text-xs font-mono text-status-error text-right">${parseFloat(trade.fee).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTrades.length === 0 && (
          <div className="p-6 text-center text-sm text-text-secondary">
            Nenhuma transação encontrada.
          </div>
        )}
      </Card>
    </div>
  );
}

interface FilterButtonsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labels: Record<T, string>;
}

function FilterButtons<T extends string>({ options, value, onChange, labels }: FilterButtonsProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
            value === option
              ? "bg-action-primary text-text-on-primary"
              : "bg-surface-card-alt text-text-secondary hover:text-text-primary"
          )}>
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
