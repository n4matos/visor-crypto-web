import { useMemo, useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Activity,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PeriodSelector } from '@/components/PeriodSelector';
import { ViewLoading, ViewError, PageHeader } from '@/components/shared';
import { useFunding, useFundingTimeseries } from '@/hooks';
import { FundingTimeseriesChart } from '@/components/charts/FundingTimeseriesChart';
import { usePortfolio } from '@/contexts/PortfolioContext';
import type { Period } from '@/types';

// Format currency with symbol
const formatCurrency = (value: number, currency = 'USDT'): string => {
  const absValue = Math.abs(value);
  const symbols: Record<string, string> = { 
    'USDT': '$', 
    'BTC': '₿', 
    'ETH': 'Ξ' 
  };
  const symbol = symbols[currency] || '$';
  
  if (currency === 'USDT') {
    return `${symbol}${absValue.toFixed(2)}`;
  }
  return `${symbol}${absValue.toFixed(8)}`;
};

export function FundingView() {
  const { activePortfolioId } = usePortfolio();
  const [period, setPeriod] = useState<Period>('30d');
  const [fundingCurrency, setFundingCurrency] = useState<string>('USDT');
  
  const { funding, isLoading: fundingLoading, error: fundingError, fetchFunding } = useFunding();
  const { 
    data: fundingTimeseriesData, 
    isLoading: fundingTimeseriesLoading, 
    error: fundingTimeseriesError,
    fetchTimeseries: fetchFundingTimeseries 
  } = useFundingTimeseries();

  // Fetch funding data
  useEffect(() => {
    if (activePortfolioId) {
      fetchFunding(activePortfolioId);
    }
  }, [fetchFunding, activePortfolioId]);

  // Calculate date range based on period
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        return { startDate: undefined, endDate: undefined };
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  // Fetch timeseries
  useEffect(() => {
    if (activePortfolioId && fundingCurrency) {
      const { startDate, endDate } = getDateRange();
      fetchFundingTimeseries({
        currency: fundingCurrency,
        groupBy: period === '24h' ? 'day' : 'day',
        credentialId: activePortfolioId,
        startDate,
        endDate,
      });
    }
  }, [fetchFundingTimeseries, fundingCurrency, activePortfolioId, period]);

  const isLoading = fundingLoading || fundingTimeseriesLoading;
  const error = fundingError || fundingTimeseriesError;

  // Funding calculations based on selected currency
  const fundingStats = useMemo(() => {
    // Filter by selected currency
    const selectedFunding = funding.filter(f => f.currency === fundingCurrency);
    const otherFunding = funding.filter(f => f.currency !== fundingCurrency);
    
    const getPeriodValue = (item: { today: string; week: string; month: string; total: string }) => {
      switch (period) {
        case '24h': return parseFloat(item.today);
        case '7d': return parseFloat(item.week);
        case '30d': return parseFloat(item.month);
        default: return parseFloat(item.total);
      }
    };

    const totalReceived = selectedFunding
      .filter(f => getPeriodValue(f) > 0)
      .reduce((sum, f) => sum + getPeriodValue(f), 0);
    
    const totalPaid = selectedFunding
      .filter(f => getPeriodValue(f) < 0)
      .reduce((sum, f) => sum + Math.abs(getPeriodValue(f)), 0);
    
    const netFunding = totalReceived - totalPaid;
    
    return {
      selectedFunding,
      otherFunding,
      totalReceived,
      totalPaid,
      netFunding,
      isPositive: netFunding >= 0,
    };
  }, [funding, period, fundingCurrency]);

  if (isLoading && funding.length === 0) {
    return <ViewLoading message="Carregando funding..." />;
  }

  if (error) {
    return (
      <ViewError 
        error={error} 
        onRetry={() => {
          if (activePortfolioId) fetchFunding(activePortfolioId);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader 
        title="Funding" 
        subtitle="Acompanhe os custos e receitas de funding das suas posições"
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Recebido"
          value={formatCurrency(fundingStats.totalReceived, fundingCurrency)}
          trend="positive"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Total Pago"
          value={formatCurrency(fundingStats.totalPaid, fundingCurrency)}
          trend="negative"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <MetricCard
          label="Saldo Líquido"
          value={formatCurrency(Math.abs(fundingStats.netFunding), fundingCurrency)}
          valueColor={fundingStats.isPositive ? 'text-status-success' : 'text-status-error'}
          trend={fundingStats.isPositive ? 'positive' : 'negative'}
          icon={fundingStats.isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          highlight
        />
      </div>

      {/* Currency Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">Moeda:</span>
        <div className="flex items-center bg-surface-card-alt rounded-lg p-0.5 border border-border-default">
          {['USDT', 'BTC', 'ETH'].map((curr) => (
            <button
              key={curr}
              onClick={() => setFundingCurrency(curr)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                fundingCurrency === curr
                  ? "bg-action-primary text-text-on-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Timeseries Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-action-primary" />
            Evolução do Funding
          </h3>
          {fundingTimeseriesData?.summary && (
            <Badge variant="outline" className="text-xs border-border-strong">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(fundingTimeseriesData.summary.period_start).toLocaleDateString('pt-BR')} - {new Date(fundingTimeseriesData.summary.period_end).toLocaleDateString('pt-BR')}
            </Badge>
          )}
        </div>
        
        <FundingTimeseriesChart
          data={fundingTimeseriesData?.data || []}
          currency={fundingCurrency}
          isLoading={fundingTimeseriesLoading}
        />
      </div>

      {/* Funding Details Table */}
      {fundingStats.selectedFunding.length > 0 && (
        <Card className="border border-border-default bg-surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border-default bg-surface-card-alt/30">
            <h3 className="text-sm font-semibold text-text-primary">Detalhes por Ativo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default bg-surface-card-alt/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary">Ativo</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary">24H</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary">7D</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary">30D</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary">Total</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {fundingStats.selectedFunding
                  .sort((a, b) => Math.abs(parseFloat(b.total)) - Math.abs(parseFloat(a.total)))
                  .map((asset) => (
                    <tr key={asset.symbol} className="border-b border-border-default/50 hover:bg-surface-card-alt/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-text-primary">
                          {asset.symbol.replace(fundingCurrency, '')}
                        </span>
                        <span className="text-xs text-text-muted ml-1">/{fundingCurrency}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <FundingValue value={parseFloat(asset.today)} currency={fundingCurrency} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <FundingValue value={parseFloat(asset.week)} currency={fundingCurrency} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <FundingValue value={parseFloat(asset.month)} highlight currency={fundingCurrency} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <FundingValue value={parseFloat(asset.total)} currency={fundingCurrency} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FundingStatusBadge value={parseFloat(asset.total)} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Other Currencies */}
      {fundingStats.otherFunding.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Outras Moedas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fundingStats.otherFunding
              .sort((a, b) => Math.abs(parseFloat(b.total)) - Math.abs(parseFloat(a.total)))
              .map((asset) => (
                <OtherCurrencyCard key={asset.symbol} asset={asset} />
              ))}
          </div>
        </div>
      )}

      {funding.length === 0 && (
        <Card className="p-8 border border-border-default bg-surface-card text-center">
          <DollarSign className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-medium text-text-primary mb-1">Nenhum dado de funding</h3>
          <p className="text-xs text-text-secondary">
            Você não possui posições com funding no momento.
          </p>
        </Card>
      )}
    </div>
  );
}

// Sub-components
interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  valueColor?: string;
  highlight?: boolean;
}

function MetricCard({ label, value, subtitle, trend, icon, valueColor, highlight }: MetricCardProps) {
  return (
    <Card className={cn(
      "p-4 border",
      highlight ? 'border-action-primary/30 bg-action-primary-muted/10' : 'border-border-default bg-surface-card'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          trend === 'positive' ? 'bg-status-success/20 text-status-success' :
          trend === 'negative' ? 'bg-status-error/20 text-status-error' :
          'bg-surface-elevated text-text-secondary'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-secondary">{label}</p>
          <p className={cn("text-xl font-bold font-mono", valueColor || 'text-text-primary')}>{value}</p>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

function FundingValue({ value, highlight, currency = 'USDT' }: { value: number; highlight?: boolean; currency?: string }) {
  const symbols: Record<string, string> = { 'USDT': '$', 'BTC': '₿', 'ETH': 'Ξ' };
  const symbol = symbols[currency] || '$';
  const decimals = currency === 'USDT' ? 2 : 8;
  
  return (
    <span className={cn(
      "text-xs font-mono",
      highlight ? "font-semibold" : "",
      value >= 0 ? "text-status-success" : "text-status-error"
    )}>
      {value >= 0 ? '+' : '-'}{symbol}{Math.abs(value).toFixed(decimals)}
    </span>
  );
}

function FundingStatusBadge({ value }: { value: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        value >= 0
          ? "border-status-success/30 text-status-success bg-status-success/10"
          : "border-status-error/30 text-status-error bg-status-error/10"
      )}
    >
      {value >= 0 ? 'Recebendo' : 'Pagando'}
    </Badge>
  );
}

function OtherCurrencyCard({ asset }: { 
  asset: { symbol: string; currency: string; today: string; week: string; month: string; total: string };
}) {
  const total = parseFloat(asset.total);
  const symbols: Record<string, string> = { 'USDT': '$', 'BTC': '₿', 'ETH': 'Ξ' };
  const symbol = symbols[asset.currency] || asset.currency;

  return (
    <Card className={cn(
      "p-3 border",
      total >= 0
        ? "border-status-success/30 bg-status-success/5"
        : "border-status-error/30 bg-status-error/5"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-card-alt flex items-center justify-center">
            <span className="text-xs font-bold text-text-secondary">{asset.currency}</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-primary">{asset.symbol}</h4>
          </div>
        </div>
        <FundingStatusBadge value={total} />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-card-alt/50 rounded p-2">
          <p className="text-xs text-text-muted">30D</p>
          <p className={cn("text-xs font-mono", parseFloat(asset.month) >= 0 ? "text-status-success" : "text-status-error")}>
            {parseFloat(asset.month) >= 0 ? '+' : '-'}{symbol}{Math.abs(parseFloat(asset.month)).toFixed(6)}
          </p>
        </div>
        <div className="bg-surface-card-alt/50 rounded p-2">
          <p className="text-xs text-text-muted">Total</p>
          <p className={cn("text-xs font-mono", total >= 0 ? "text-status-success" : "text-status-error")}>
            {total >= 0 ? '+' : '-'}{symbol}{Math.abs(total).toFixed(6)}
          </p>
        </div>
      </div>
    </Card>
  );
}
