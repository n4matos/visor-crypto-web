import { memo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
}: MetricCardProps) {
  const isPositive = change && change.value >= 0;
  const isNegative = change && change.value < 0;

  const getVariantColors = () => {
    switch (variant) {
      case 'success': return 'border-status-success/30 bg-status-success-muted';
      case 'error': return 'border-status-error/30 bg-status-error-muted';
      case 'warning': return 'border-accent-orange/30 bg-accent-orange/10';
      case 'neutral': return 'border-border-default bg-surface-card-alt';
      default: return 'border-border-default bg-surface-card hover:border-border-strong';
    }
  };

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
