import { Loader2 } from 'lucide-react';

interface ViewLoadingProps {
  message?: string;
}

export function ViewLoading({ message = 'Carregando...' }: ViewLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
