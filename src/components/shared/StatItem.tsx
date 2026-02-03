import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatItemProps {
  icon?: React.ReactNode;
  iconBg?: string;
  label: string;
  value: string;
  valueColor?: string;
  layout?: 'row' | 'compact';
  subtitle?: string;
}

export function StatItem({
  icon,
  iconBg = 'bg-surface-card-alt',
  label,
  value,
  valueColor = 'text-text-primary',
  layout = 'compact',
  subtitle,
}: StatItemProps) {
  if (layout === 'compact') {
    return (
      <Card className="p-3 border border-border-default bg-surface-card">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-text-secondary truncate">{label}</p>
            <p className={cn("text-base font-bold font-mono truncate", valueColor)}>{value}</p>
            {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-card-alt">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className={cn("text-lg font-mono font-medium", valueColor)}>{value}</span>
    </div>
  );
}
