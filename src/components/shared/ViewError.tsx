import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewErrorProps {
  error: string;
  onRetry: () => void;
}

export function ViewError({ error, onRetry }: ViewErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="flex items-center gap-2 text-status-error">
        <AlertCircle className="w-6 h-6" />
        <span>{error}</span>
      </div>
      <Button onClick={onRetry} variant="outline" className="border-border-default">
        Tentar novamente
      </Button>
    </div>
  );
}
