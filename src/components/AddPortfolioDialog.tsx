import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePortfolio } from '@/contexts/PortfolioContext';

interface AddPortfolioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddPortfolioDialog({ open, onOpenChange }: AddPortfolioDialogProps) {
    const { addPortfolio } = usePortfolio();

    // Form state
    const [label, setLabel] = useState('');
    const [exchange] = useState('Bybit');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!label.trim() || !apiKey.trim() || !apiSecret.trim()) {
            setError('Preencha Label, API Key e Secret');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await addPortfolio({ label, apiKey, secret: apiSecret, exchange });
            // Reset form
            setLabel('');
            setApiKey('');
            setApiSecret('');
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar credenciais');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-surface-card border-border-default">
                <DialogHeader>
                    <DialogTitle className="text-text-primary">Nova Conexão</DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        Adicione suas chaves de API para conectar uma nova carteira.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0" />
                            <p className="text-xs text-status-error">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Nome da Conta (Apelido)</Label>
                        <Input
                            placeholder="Ex: Conta Scalping"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="bg-surface-input border-border-default h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Exchange</Label>
                        <div className="p-2.5 border border-action-primary/50 bg-action-primary/5 rounded-md text-action-primary text-sm font-medium flex items-center gap-2">
                            Bybit <Badge className="ml-auto bg-action-primary h-5 text-[10px]">Suportado</Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                            placeholder="Cole sua API Key"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="bg-surface-input border-border-default font-mono h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>API Secret</Label>
                        <div className="relative">
                            <Input
                                type={showSecret ? "text" : "password"}
                                placeholder="Cole seu API Secret"
                                value={apiSecret}
                                onChange={e => setApiSecret(e.target.value)}
                                className="bg-surface-input border-border-default pr-10 font-mono h-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                            >
                                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border-default">Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-action-primary hover:bg-action-primary-hover"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Conectar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
