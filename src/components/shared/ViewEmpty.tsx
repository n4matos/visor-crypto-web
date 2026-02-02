import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewEmptyProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
}

export function ViewEmpty({ icon, title, description, action }: ViewEmptyProps) {
  return (
    <Card className="p-8 border border-border-default bg-surface-card text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-card-alt flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-text-secondary max-w-md">{description}</p>
        {action && (
          <Button
            onClick={action.onClick}
            variant="outline"
            className="border-border-default hover:bg-surface-card-alt"
          >
            <Loader2 className={cn("w-4 h-4 mr-2", action.isLoading && "animate-spin")} />
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
