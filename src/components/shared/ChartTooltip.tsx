interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    name?: string;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  formatDate?: boolean;
  items?: Array<{
    dataKey: string;
    label: string;
    prefix?: string;
    color: string;
    formatValue?: (value: number) => string;
  }>;
}

export function ChartTooltip({ active, payload, label, formatDate = true, items }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const dateStr = formatDate && label
    ? new Date(label).toLocaleDateString('pt-BR')
    : label;

  return (
    <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
      {dateStr && (
        <p className="text-sm text-text-secondary mb-2">{dateStr}</p>
      )}
      {items ? (
        items.map((item, i) => {
          const entry = payload.find(p => p.dataKey === item.dataKey) || payload[i];
          if (!entry) return null;
          const rawValue = typeof entry.value === 'number' ? entry.value : parseFloat(String(entry.value));
          const displayValue = item.formatValue
            ? item.formatValue(rawValue)
            : `${item.prefix || ''}${rawValue.toLocaleString()}`;

          return (
            <div key={item.dataKey} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-text-secondary">{item.label}:</span>
              <span className="text-sm font-mono font-medium text-text-primary">{displayValue}</span>
            </div>
          );
        })
      ) : (
        payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-sm text-text-secondary">{p.name}:</span>
            <span className="text-sm font-mono font-medium text-text-primary">
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
