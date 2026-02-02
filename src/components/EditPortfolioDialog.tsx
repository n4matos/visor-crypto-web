import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Portfolio } from '@/contexts/PortfolioContext';

interface EditPortfolioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portfolio: Portfolio | null;
}

export function EditPortfolioDialog({ open, onOpenChange, portfolio }: EditPortfolioDialogProps) {
    const { updatePortfolio } = usePortfolio();

    const [label, setLabel] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (portfolio) {
            setLabel(portfolio.label);
        }
    }, [portfolio]);

    const handleSave = async () => {
        if (!portfolio) return;
        if (!label.trim()) {
            setError('O nome não pode ser vazio');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updatePortfolio(portfolio.id, { label });
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-surface-card border-border-default">
                <DialogHeader>
                    <DialogTitle className="text-text-primary">Editar Carteira</DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        Atualize o nome de identificação desta carteira.
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
                            placeholder="Ex: Conta Principal"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="bg-surface-input border-border-default h-10"
                        />
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
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
