import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SyncButtonProps {
    onSyncComplete: () => Promise<void>;
    lastSyncTime?: string | null;
    className?: string; // Add className prop for flexibility
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

export function SyncButton({ onSyncComplete, lastSyncTime, className }: SyncButtonProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [timeAgo, setTimeAgo] = useState<string>('');

    // Format relative time
    useEffect(() => {
        const updateTimeAgo = () => {
            if (!lastSyncTime) {
                setTimeAgo('');
                return;
            }

            const now = new Date();
            const lastSync = new Date(lastSyncTime);
            const diffInSeconds = Math.floor((now.getTime() - lastSync.getTime()) / 1000);

            if (diffInSeconds < 60) {
                setTimeAgo('<1 minute ago');
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
            } else {
                const days = Math.floor(diffInSeconds / 86400);
                setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lastSyncTime]);

    const handleSync = async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            toast.error('Você precisa estar logado para sincronizar.');
            return;
        }

        setIsSyncing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Falha ao sincronizar dados');
            }

            toast.success('Sincronização iniciada com sucesso!');
            await onSyncComplete();
        } catch (error) {
            console.error('Sync error:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar dados');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className={cn("flex flex-col items-end gap-1", className)}>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-surface-card-alt border border-border-default hover:bg-surface-elevated text-text-primary gap-2"
            >
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                Sync
            </Button>
            {lastSyncTime && (
                <span className="text-xs text-text-secondary">
                    Last Updated {timeAgo}
                </span>
            )}
        </div>
    );
}
