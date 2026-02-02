import { memo } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: { value: number; percent: number };
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'neutral';
  trend?: 'positive' | 'negative' | 'neutral';
  size?: 'default' | 'compact';
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  change,
  prefix = '',
  suffix = '',
  icon,
  variant = 'default',
  trend,
  size = 'compact',
}: MetricCardProps) {
  const isPositive = change && change.value >= 0;
  const isNegative = change && change.value < 0;

  const getVariantColors = () => {
    switch (variant) {
      case 'success': return 'border-status-success/30 bg-status-success-muted/20';
      case 'error': return 'border-status-error/30 bg-status-error-muted/20';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'neutral': return 'border-border-default bg-surface-card-alt';
      default: return 'border-border-default bg-surface-card hover:border-border-strong';
    }
  };

  const getIconColors = () => {
    switch (variant) {
      case 'success': return 'text-status-success bg-status-success/20';
      case 'error': return 'text-status-error bg-status-error/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/20';
      default: return 'text-text-secondary bg-surface-card-alt';
    }
  };

  if (size === 'compact') {
    return (
      <Card className={cn("p-3 border", getVariantColors())}>
        <div className="flex items-start justify-between">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", getIconColors())}>
            {icon}
          </div>
          {trend && trend !== 'neutral' && (
            <div className={cn("flex items-center", trend === 'positive' ? 'text-status-success' : 'text-status-error')}>
              {trend === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-xs text-text-secondary">{title}</p>
          <p className={cn("text-lg font-bold font-mono",
            variant === 'error' ? 'text-status-error' : 
            variant === 'success' ? 'text-status-success' : 
            'text-text-primary'
          )}>
            {prefix}{value}{suffix}
          </p>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
          {change && (
            <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", 
              isPositive ? "text-status-success" : isNegative ? "text-status-error" : "text-text-secondary"
            )}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
              <span>{isPositive ? '+' : ''}{change.percent.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default size (legacy support)
  return (
    <Card className={cn("p-5 border transition-all duration-200", getVariantColors())}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      <div className="mb-2">
        <span className="text-2xl lg:text-3xl font-bold font-mono text-text-primary">{prefix}{value}{suffix}</span>
      </div>
      {change && (
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1 text-sm font-medium", 
            isPositive ? "text-status-success" : isNegative ? "text-status-error" : "text-text-secondary"
          )}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : isNegative ? <ArrowDownRight className="w-4 h-4" /> : null}
            <span>{isPositive ? '+' : ''}{change.percent.toFixed(2)}%</span>
          </div>
          {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        </div>
      )}
      {!change && subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
    </Card>
  );
});
