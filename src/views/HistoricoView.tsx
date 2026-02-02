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

export function HistoricoView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const { transactions, isLoading, error, fetchTransactions } = useTransactions();

  useEffect(() => {
    fetchTransactions({ limit: 100 });
  }, [fetchTransactions]);

  const filteredTrades = useMemo(() => {
    return transactions.filter(trade => {
      if (searchQuery && !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (directionFilter !== 'ALL' && trade.side !== directionFilter) return false;
      if (typeFilter !== 'ALL' && trade.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, searchQuery, directionFilter, typeFilter]);

  if (isLoading && transactions.length === 0) {
    return <ViewLoading message="Carregando historico..." />;
  }

  if (error) {
    return <ViewError error={error} onRetry={() => fetchTransactions({ limit: 100 })} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Historico de Trades" subtitle="Visualize todos os seus trades executados">
        <Button variant="outline" className="gap-2 border-border-default hover:bg-surface-card-alt">
          <Download className="w-4 h-4" />Exportar CSV
        </Button>
      </PageHeader>

      {/* Filters */}
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
            options={['ALL', 'Buy', 'Sell'] as const}
            value={directionFilter}
            onChange={setDirectionFilter}
            labels={{ ALL: 'Tudo', Buy: 'COMPRA', Sell: 'VENDA' }}
          />
          <FilterButtons
            options={['ALL', 'TRADE', 'SETTLEMENT', 'FEE', 'TRANSFER'] as const}
            value={typeFilter}
            onChange={setTypeFilter}
            labels={{ ALL: 'Tudo', TRADE: 'TRADE', SETTLEMENT: 'SETTLE', FEE: 'TAXA', TRANSFER: 'TRANSFER' }}
          />
        </div>
      </Card>

      {/* Trade Table */}
      <Card className="border border-border-default bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-surface-card-alt/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Data</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Par</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Lado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Quantidade</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Preco</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.slice(0, MAX_TRADES_DISPLAY).map((trade) => (
                <tr key={trade.id} className="border-b border-border-subtle hover:bg-surface-card-alt/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {new Date(trade.executed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">{trade.symbol}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs border-border-default">
                      {trade.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={trade.side === 'Buy' ? 'default' : 'destructive'}
                      className={cn("text-xs",
                        trade.side === 'Buy'
                          ? "bg-status-success/20 text-status-success border-status-success/30"
                          : "bg-status-error/20 text-status-error border-status-error/30"
                      )}>
                      {trade.side === 'Buy' ? 'COMPRA' : 'VENDA'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">{parseFloat(trade.qty).toFixed(6)}</td>
                  <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">${parseFloat(trade.price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm font-mono text-status-error text-right">${parseFloat(trade.fee).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTrades.length === 0 && (
          <div className="p-8 text-center text-text-secondary">
            Nenhuma transacao encontrada.
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
              ? "bg-action-primary text-white"
              : "bg-surface-card-alt text-text-secondary hover:text-text-primary"
          )}>
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
