import { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import type { Portfolio } from '@/contexts/PortfolioContext';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Wallet, Trash2, Settings, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AddPortfolioDialog } from './AddPortfolioDialog';
import { EditPortfolioDialog } from './EditPortfolioDialog';

interface PortfolioDrawerProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function PortfolioDrawer({ children, open, onOpenChange }: PortfolioDrawerProps) {
    const { portfolios, activePortfolioId, setActivePortfolio, removePortfolio } = usePortfolio();
    const [internalOpen, setInternalOpen] = useState(false);

    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
    const [portfolioToDelete, setPortfolioToDelete] = useState<Portfolio | null>(null);

    // Use controlled or uncontrolled state
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

    const handleSelect = (id: string | null) => {
        setActivePortfolio(id);
        setIsOpen(false);
    };

    const handleEdit = (portfolio: Portfolio) => {
        setSelectedPortfolio(portfolio);
        setShowEditDialog(true);
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                {children && <SheetTrigger asChild>{children}</SheetTrigger>}
                <SheetContent
                    side="right"
                    className="w-[380px] sm:w-[460px] flex flex-col p-0 bg-surface-sidebar border-l border-border-default"
                >
                    {/* Header - Following Sidebar spec from design-system */}
                    <SheetHeader className="px-5 py-6 border-b border-border-subtle bg-surface-sidebar">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-action-primary-muted flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-action-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-semibold text-text-primary tracking-tight">
                                    Meus Portfólios
                                </SheetTitle>
                                <SheetDescription className="text-sm text-text-secondary mt-0.5">
                                    Gerencie suas carteiras conectadas
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {/* Global View Option - Following Card spec */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                                Visão Global
                            </h4>
                            <div
                                onClick={() => handleSelect(null)}
                                className={cn(
                                    "relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                                    activePortfolioId === null
                                        ? "bg-action-primary-muted border-action-primary"
                                        : "bg-surface-card border-border-default hover:border-border-strong hover:bg-surface-card-alt"
                                )}
                            >
                                {/* Active Indicator - Following Table Row spec */}
                                {activePortfolioId === null && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-action-primary rounded-r-full" />
                                )}

                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                                    activePortfolioId === null
                                        ? "bg-action-primary text-text-on-primary"
                                        : "bg-surface-elevated text-text-muted"
                                )}>
                                    <TrendingUp className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn(
                                            "font-semibold text-sm",
                                            activePortfolioId === null ? "text-action-primary" : "text-text-primary"
                                        )}>
                                            Todos os Ativos
                                        </h3>
                                        {activePortfolioId === null && (
                                            <Badge className="bg-action-primary text-text-on-primary border-0 text-xs">
                                                Ativo
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary mt-0.5">
                                        Consolida todas as suas contas
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Connected Wallets List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                                    Contas Individuais
                                </h4>
                                <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-md">
                                    {portfolios.length}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {portfolios.map((portfolio) => {
                                    const isActive = activePortfolioId === portfolio.id;
                                    return (
                                        <div
                                            key={portfolio.id}
                                            onClick={() => handleSelect(portfolio.id)}
                                            className={cn(
                                                "group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                                                isActive
                                                    ? "bg-surface-elevated border-action-primary/50"
                                                    : "bg-surface-card border-border-default hover:border-border-strong hover:bg-surface-card-alt"
                                            )}
                                        >
                                            {/* Active Indicator */}
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-action-primary rounded-r-full" />
                                            )}

                                            {/* Exchange Logo */}
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold tracking-wider shrink-0 border",
                                                isActive
                                                    ? "bg-action-primary border-action-primary text-text-on-primary"
                                                    : "bg-surface-input border-border-subtle text-text-secondary"
                                            )}>
                                                {portfolio.exchange.substring(0, 2).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "font-medium text-sm truncate",
                                                        isActive ? "text-action-primary" : "text-text-primary"
                                                    )}>
                                                        {portfolio.label}
                                                    </h3>
                                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-action-primary" />}
                                                </div>

                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                                                        {portfolio.exchange}
                                                    </span>
                                                    <span className="text-xs text-text-muted font-mono">
                                                        {portfolio.api_key_masked}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions Dropdown */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-card"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent 
                                                        align="end" 
                                                        className="w-44 bg-surface-card border-border-default shadow-lg rounded-lg p-1"
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(portfolio)}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-md focus:bg-surface-elevated cursor-pointer"
                                                        >
                                                            <Settings className="w-4 h-4 text-text-secondary" />
                                                            <span className="text-sm">Renomear</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 px-3 py-2 rounded-md focus:bg-status-error-muted text-status-error focus:text-status-error cursor-pointer"
                                                            onClick={() => setPortfolioToDelete(portfolio)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="text-sm">Desconectar</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <SheetFooter className="p-5 border-t border-border-subtle bg-surface-sidebar">
                        <Button
                            className="w-full h-11 gap-2 bg-action-primary hover:bg-action-primary-hover text-text-on-primary shadow-glow transition-all duration-200 rounded-lg"
                            onClick={() => setShowAddDialog(true)}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium text-sm">Conectar Nova Carteira</span>
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AddPortfolioDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />

            <EditPortfolioDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                portfolio={selectedPortfolio}
            />

            <AlertDialog open={!!portfolioToDelete} onOpenChange={(open) => !open && setPortfolioToDelete(null)}>
                <AlertDialogContent className="bg-surface-card border-border-default rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-text-primary text-lg">
                            Desconectar Carteira?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-text-secondary text-sm">
                            Tem certeza que deseja desconectar a carteira <span className="font-medium text-text-primary">{portfolioToDelete?.label}</span>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-surface-elevated text-text-primary border-border-default hover:bg-surface-card-alt rounded-lg h-10">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-status-error text-text-on-primary hover:bg-status-error/90 border-0 rounded-lg h-10"
                            onClick={() => {
                                if (portfolioToDelete) {
                                    removePortfolio(portfolioToDelete.id);
                                    setPortfolioToDelete(null);
                                }
                            }}
                        >
                            Desconectar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
