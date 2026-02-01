import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/hooks';

type DirectionFilter = 'ALL' | 'Buy' | 'Sell';
type TypeFilter = 'ALL' | 'TRADE' | 'SETTLEMENT' | 'FEE' | 'TRANSFER';

const MAX_TRADES_DISPLAY = 50;

export function HistoricoView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  
  const { transactions, summary, isLoading, error, fetchTransactions, fetchSummary } = useTransactions();

  // Fetch data on component mount
  useEffect(() => {
    fetchTransactions({ limit: 100 });
    fetchSummary('all');
  }, [fetchTransactions, fetchSummary]);



  const { filteredTrades, winCount, totalPnL, totalFees } = useMemo(() => {
    const filtered = transactions.filter(trade => {
      if (searchQuery && !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (directionFilter !== 'ALL' && trade.side !== directionFilter) return false;
      if (typeFilter !== 'ALL' && trade.type !== typeFilter) return false;
      return true;
    });

    // Calculate total fees from filtered trades
    const fees = filtered.reduce((sum, t) => sum + parseFloat(t.fee), 0);
    
    // Use summary data for PnL if available
    const pnl = summary ? parseFloat(summary.total_pnl) : 0;

    return {
      filteredTrades: filtered,
      winCount: summary?.win_count || 0,
      totalPnL: pnl,
      totalFees: fees,
    };
  }, [transactions, searchQuery, directionFilter, typeFilter, summary]);

  const totalTrades = summary?.total_trades || filteredTrades.length;
  const winRate = summary?.win_rate || (totalTrades > 0 ? (winCount / totalTrades) * 100 : 0);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
        <p className="text-text-secondary">Carregando histórico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="flex items-center gap-2 text-status-error">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
        <Button 
          onClick={() => {
            fetchTransactions({ limit: 100 });
            fetchSummary('all');
          }} 
          variant="outline" 
          className="border-border-default"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

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
          <p className="text-2xl font-bold font-mono text-text-primary">{totalTrades}</p>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-card">
          <span className="text-xs text-text-secondary uppercase">Win Rate</span>
          <p className="text-2xl font-bold font-mono text-status-success">{winRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-card">
          <span className="text-xs text-text-secondary uppercase">PnL Total</span>
          <p className={cn("text-2xl font-bold font-mono", totalPnL >= 0 ? "text-status-success" : "text-status-error")}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
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
            variant="type"
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
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Lado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Quantidade</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Preço</th>
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
                      className={cn("text-xs", trade.side === 'Buy' ? "bg-status-success/20 text-status-success border-status-success/30" : "bg-status-error/20 text-status-error border-status-error/30")}>
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
  variant?: 'default' | 'type';
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
