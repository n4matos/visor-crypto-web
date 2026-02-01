import { cn } from '@/lib/utils';
import type { Period } from '@/types';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1A' },
  { value: 'all', label: 'TUDO' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-card-alt border border-border-default">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
            value === period.value 
              ? "bg-action-primary text-white" 
              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
