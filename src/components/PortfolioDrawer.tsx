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
import { Plus, MoreVertical, Wallet, Trash2, Settings } from 'lucide-react';
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
                    className="w-[380px] sm:w-[500px] flex flex-col p-0 bg-surface-page border-l border-border-default shadow-2xl"
                >
                    <SheetHeader className="px-6 py-8 border-b border-border-subtle bg-surface-sidebar/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-lg bg-action-primary/10">
                                <Wallet className="w-5 h-5 text-action-primary" />
                            </div>
                            <SheetTitle className="text-xl font-bold text-text-primary tracking-tight">
                                Meus Portfólios
                            </SheetTitle>
                        </div>
                        <SheetDescription className="text-text-secondary text-sm ml-11">
                            Gerencie as conexões e carteiras que alimentam seu painel.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Global View Option */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1">Visão Global</h4>
                            <div
                                onClick={() => handleSelect(null)}
                                className={cn(
                                    "relative group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                                    activePortfolioId === null
                                        ? "bg-action-primary-muted border-action-primary shadow-glow"
                                        : "bg-surface-card hover:bg-surface-card-alt border-border-default hover:border-border-strong"
                                )}
                            >
                                {/* Active Indicator Bar */}
                                {activePortfolioId === null && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-action-primary" />
                                )}

                                <div className={cn(
                                    "mt-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner",
                                    activePortfolioId === null
                                        ? "bg-action-primary text-white shadow-lg shadow-action-primary/20 scale-105"
                                        : "bg-surface-elevated text-text-muted group-hover:text-text-primary group-hover:bg-surface-input"
                                )}>
                                    <TrendingUpIcon active={activePortfolioId === null} />
                                </div>

                                <div className="flex-1 min-w-0 py-0.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn(
                                            "font-semibold text-base transition-colors",
                                            activePortfolioId === null ? "text-action-primary" : "text-text-primary"
                                        )}>
                                            Todos os Ativos
                                        </h3>
                                        {activePortfolioId === null && (
                                            <Badge className="bg-action-primary text-white hover:bg-action-primary border-0 shadow-sm">
                                                Selecionado
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                                        Consolida todas as suas contas conectadas em uma única visão unificada.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Connected Wallets List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                    Contas Individuais
                                </h4>
                                <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                                    {portfolios.length}
                                </span>
                            </div>

                            <div className="grid gap-3">
                                {portfolios.map((portfolio) => {
                                    const isActive = activePortfolioId === portfolio.id;
                                    return (
                                        <div
                                            key={portfolio.id}
                                            onClick={() => handleSelect(portfolio.id)}
                                            className={cn(
                                                "group relative flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                                                isActive
                                                    ? "bg-surface-elevated border-action-primary/50 shadow-glow-strong"
                                                    : "bg-surface-card hover:bg-surface-card-alt border-border-default hover:border-border-strong hover:translate-x-1"
                                            )}
                                        >
                                            {/* Exchange Logo/Initial */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 shrink-0",
                                                isActive
                                                    ? "bg-gradient-to-br from-action-primary to-action-primary-hover border-transparent text-white shadow-lg"
                                                    : "bg-surface-input border-border-subtle text-text-secondary group-hover:border-border-strong"
                                            )}>
                                                <span className="text-xs font-bold tracking-widest">
                                                    {portfolio.exchange.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className={cn(
                                                        "font-semibold truncate transition-colors",
                                                        isActive ? "text-action-primary" : "text-text-primary group-hover:text-text-primary"
                                                    )}>
                                                        {portfolio.label}
                                                    </h3>
                                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-action-primary animate-pulse" />}
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-text-secondary">
                                                    <span className="flex items-center gap-1.5 text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded-md border border-border-subtle">
                                                        {portfolio.exchange}
                                                    </span>
                                                    <span className="font-mono opacity-60 tracking-wider">
                                                        {portfolio.api_key_masked}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-8 w-8 rounded-lg transition-all",
                                                                isActive
                                                                    ? "text-text-secondary hover:text-text-primary hover:bg-surface-card"
                                                                    : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
                                                            )}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 bg-surface-card border-border-default shadow-xl rounded-xl p-1">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(portfolio)}
                                                            className="flex items-center gap-2 p-2.5 rounded-lg focus:bg-surface-elevated cursor-pointer"
                                                        >
                                                            <Settings className="w-4 h-4 text-text-secondary" />
                                                            <span className="text-sm font-medium">Renomear</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 p-2.5 rounded-lg focus:bg-status-error-muted text-status-error focus:text-status-error cursor-pointer"
                                                            onClick={() => setPortfolioToDelete(portfolio)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Desconectar</span>
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

                    <SheetFooter className="p-6 border-t border-border-subtle bg-surface-elevated/30">
                        <Button
                            className="w-full h-11 gap-2 bg-action-primary hover:bg-action-primary-hover text-white shadow-glow hover:shadow-glow-strong transition-all duration-300 rounded-xl"
                            onClick={() => setShowAddDialog(true)}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Conectar Nova Carteira</span>
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
                <AlertDialogContent className="bg-surface-card border-border-default">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-text-primary">Desconectar Carteira?</AlertDialogTitle>
                        <AlertDialogDescription className="text-text-secondary">
                            Tem certeza que deseja desconectar a carteira <span className="font-semibold text-text-primary">{portfolioToDelete?.label}</span>?
                            Esta ação não pode ser desfeita e você perderá o histórico de visualização desta conta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-surface-elevated text-text-primary border-border-default hover:bg-surface-card-alt">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-status-error text-white hover:bg-status-error/90 border-0"
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

// Icon component for the "All Assets" view
function TrendingUpIcon({ active }: { active: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-5 h-5", active ? "text-white" : "text-current")}
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}
