import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatItemProps {
  icon?: React.ReactNode;
  iconBg?: string;
  label: string;
  value: string;
  valueColor?: string;
  layout?: 'row' | 'compact';
}

export function StatItem({
  icon,
  iconBg = 'bg-surface-card-alt',
  label,
  value,
  valueColor = 'text-text-primary',
  layout = 'row',
}: StatItemProps) {
  if (layout === 'compact') {
    return (
      <Card className="p-4 border border-border-default bg-surface-card">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
              {icon}
            </div>
          )}
          <div>
            <span className="text-xs text-text-secondary uppercase">{label}</span>
            <p className={cn("text-xl font-bold font-mono", valueColor)}>{value}</p>
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
