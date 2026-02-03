import { useState, useMemo, useCallback, useEffect } from 'react';
import type { View } from '@/types';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/hooks';
import { PortfolioDrawer } from '@/components/PortfolioDrawer';
import {
  PortfolioView,
  FundingView,
  FeesView,
  HistoricoView,
  PosicoesView,
  BTCView,
  AuthView,
  LandingView,
  OnboardingView,
} from '@/views';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Receipt,
  History,
  Wallet,
  Bitcoin,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  DollarSign,
  ArrowRightLeft,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';


// Main navigation items
interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'portfolio', label: 'Overview', icon: TrendingUp },
  { id: 'btc', label: 'Bitcoin', icon: Bitcoin },
  { 
    id: 'funding', 
    label: 'Custos', 
    icon: Receipt,
    subItems: [
      { id: 'funding', label: 'Funding', icon: DollarSign },
      { id: 'fees', label: 'Trading Fees', icon: ArrowRightLeft },
    ]
  },
  { id: 'posicoes', label: 'Posicoes', icon: Wallet },
  { id: 'historico', label: 'Historico', icon: History },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('portfolio');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { portfolios, activePortfolioId, isLoading: portfolioLoading, refreshPortfolios } = usePortfolio();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, login, register, logout, error, clearError } = useAuth();

  const connected = portfolios.length > 0 || !!user?.has_bybit_credentials;
  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0];
  const lastSync = activePortfolio?.last_sync_at || null;

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = useMemo(() => {
    if (!lastSync) return null;
    const lastSyncDate = new Date(lastSync);
    return Math.floor((currentTime - lastSyncDate.getTime()) / 60000);
  }, [currentTime, lastSync]);

  // Redirect to onboarding if authenticated but not connected
  useEffect(() => {
    if (isAuthenticated && !authLoading && !portfolioLoading) {
      if (!connected && currentView !== 'onboarding') {
        setCurrentView('onboarding');
      }
    }
  }, [isAuthenticated, authLoading, portfolioLoading, connected, currentView]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    const success = await login({ email, password });
    if (success) {
      await refreshPortfolios();
      setCurrentView('portfolio');
    }
    return success;
  }, [login, refreshPortfolios]);

  const handleRegister = useCallback(async (email: string, password: string): Promise<boolean> => {
    const success = await register({ email, password });
    if (success) {
      setCurrentView('onboarding');
      await refreshPortfolios();
    }
    return success;
  }, [register, refreshPortfolios]);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentView('landing');
  }, [logout]);

  const renderView = () => {
    switch (currentView) {
      case 'portfolio': return <PortfolioView />;
      case 'btc': return <BTCView />;
      case 'funding': return <FundingView />;
      case 'fees': return <FeesView />;
      case 'historico': return <HistoricoView />;
      case 'posicoes': return <PosicoesView />;
      default: return <PortfolioView />;
    }
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === 'auth') {
      return (
        <AuthView
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={authLoading}
          error={error}
          onClearError={clearError}
          onBack={() => setCurrentView('landing')}
        />
      );
    }

    return (
      <LandingView
        onLogin={() => setCurrentView('auth')}
        onRegister={() => setCurrentView('auth')}
      />
    );
  }

  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <Header
          title="Boas Vindas"
          theme={theme}
          onThemeToggle={toggleTheme}
          timeAgo={null}
          onMobileMenuOpen={() => { }}
          onLogout={handleLogout}
          connected={connected}
          displayLabel="Boas Vindas"
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <OnboardingView
            onComplete={async () => {
              await refreshPortfolios();
              setCurrentView('portfolio');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-surface-overlay z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <MobileHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} isOpen={mobileMenuOpen} />

      <Sidebar
        currentView={currentView}
        onNavClick={handleNavClick}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onLogout={handleLogout}
      />

      <main className={cn(
        "transition-all duration-300 ease-out min-h-screen",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-[240px]"
      )}>
        <Header
          title=""
          theme={theme}
          onThemeToggle={toggleTheme}
          timeAgo={timeAgo}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          connected={connected}
          displayLabel={
            activePortfolioId === null && connected
              ? 'Todos os Ativos'
              : (activePortfolioId ? (portfolios.find(p => p.id === activePortfolioId)?.label || portfolios[0]?.label) : 'Desconectado')
          }
        />

        <div className="p-4 lg:p-6 pt-20 lg:pt-6">
          <div className="max-w-7xl mx-auto">{renderView()}</div>
        </div>
      </main>
    </div>
  );
}

// Mobile Header Component
interface MobileHeaderProps {
  onMenuToggle: () => void;
  isOpen: boolean;
}

function MobileHeader({ onMenuToggle, isOpen }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-sidebar border-b border-border-default z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-action-primary flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-text-on-primary" />
        </div>
        <span className="font-semibold text-text-primary">Visor Crypto</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onMenuToggle}>
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
    </div>
  );
}

// Sidebar Component
interface SidebarProps {
  currentView: View;
  onNavClick: (view: View) => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  mobileOpen: boolean;
  onLogout: () => void;
}


function Sidebar({ currentView, onNavClick, collapsed, onCollapseToggle, mobileOpen, onLogout }: SidebarProps) {
  const { portfolios, activePortfolioId } = usePortfolio();
  const connected = portfolios.length > 0;
  
  // Estado para controlar submenus expandidos
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Inicialmente, expandir o menu que contém a view ativa
    const activeItem = NAV_ITEMS.find(item => 
      item.subItems?.some(sub => sub.id === currentView)
    );
    return activeItem ? new Set([activeItem.id]) : new Set();
  });

  const toggleMenu = (itemId: string, hasSubItems: boolean) => {
    if (!hasSubItems) return;
    
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Determine display info
  let displayName = 'Sem Conexão';

  if (activePortfolioId === null && connected) {
    displayName = 'Todos os Ativos';
  } else if (activePortfolioId) {
    const active = portfolios.find(p => p.id === activePortfolioId);
    if (active) {
      displayName = active.label || active.exchange;
    }
  }

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-surface-sidebar z-50 transition-all duration-300 ease-out flex flex-col border-r border-border-default",
      collapsed ? "w-20" : "w-[240px]",
      mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo Area */}
      <div className="h-24 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-none flex items-center justify-center flex-shrink-0">
            {/* Using a simpler icon/logo representation if needed, or keeping the existing one but styled differently */}
            <TrendingUp className="w-6 h-6 text-action-primary" />
          </div>
          {!collapsed && <span className="text-xl font-bold text-text-primary tracking-tight">VisorCrypto</span>}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapseToggle}
          className={cn(
            "text-text-muted hover:text-text-primary hidden lg:flex",
            collapsed ? "w-full justify-center" : ""
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">

        {/* Portfolio Section / "Context" */}
        <div className="mb-8">
          <PortfolioDrawer>
            <button className={cn(
              "w-full group outline-none",
              collapsed ? "flex justify-center" : ""
            )}>
              {!collapsed ? (
                <div className="flex items-center justify-between px-3 py-3 rounded-2xl bg-surface-card border border-border-default hover:border-action-primary/30 transition-all group-hover:bg-surface-card-alt">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center text-action-primary">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block text-xs text-text-muted font-medium">Carteira Atual</span>
                      <span className="block text-sm font-semibold text-text-primary truncate">{displayName}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-default flex items-center justify-center text-action-primary group-hover:bg-surface-card-alt transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
              )}
            </button>
          </PortfolioDrawer>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.subItems?.some(sub => sub.id === currentView) || currentView === item.id;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus.has(item.id);

            // If collapsed, just show the parent icon
            if (collapsed) {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.id, hasSubItems);
                    } else {
                      onNavClick(item.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 group relative",
                    isParentActive
                      ? "text-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-card"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-colors flex-shrink-0",
                    isParentActive ? "text-action-primary" : "text-text-muted group-hover:text-text-primary"
                  )} />
                  {isParentActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-action-primary/10 to-transparent rounded-xl opacity-50 pointer-events-none" />
                  )}
                </button>
              );
            }

            // Expanded view with collapsible submenu
            return (
              <div key={item.id} className="space-y-1">
                {/* Parent Item - Click to toggle submenu */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.id, hasSubItems);
                    } else {
                      onNavClick(item.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                    isParentActive
                      ? "text-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-card"
                  )}
                >
                  {/* Active Indicator Line (Left) */}
                  {isParentActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-action-primary rounded-r-full shadow-glow" />
                  )}

                  <Icon className={cn(
                    "w-5 h-5 transition-colors flex-shrink-0",
                    isParentActive ? "text-action-primary" : "text-text-muted group-hover:text-text-primary"
                  )} />

                  <span className="text-sm font-medium flex-1 text-left">
                    {item.label}
                  </span>

                  {/* Chevron for expandable items */}
                  {hasSubItems && (
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200 text-text-muted",
                      isExpanded ? "rotate-180" : ""
                    )} />
                  )}

                  {isParentActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-action-primary/10 to-transparent rounded-xl opacity-50 pointer-events-none" />
                  )}
                </button>

                {/* Submenu Items - Animated */}
                {hasSubItems && isExpanded && (
                  <div className="ml-4 pl-4 border-l border-border-default space-y-1 animate-fade-in">
                    {item.subItems!.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentView === subItem.id;
                      
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => onNavClick(subItem.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-left",
                            isSubActive
                              ? "text-text-primary bg-action-primary-muted/30"
                              : "text-text-muted hover:text-text-primary hover:bg-surface-card"
                          )}
                        >
                          <SubIcon className={cn(
                            "w-4 h-4 transition-colors flex-shrink-0",
                            isSubActive ? "text-action-primary" : "text-text-muted group-hover:text-text-primary"
                          )} />
                          <span className="text-sm">
                            {subItem.label}
                          </span>
                          {isSubActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-action-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-border-default mt-auto">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-4 px-3 py-3 rounded-xl text-text-muted hover:text-status-error hover:bg-status-error/10 transition-all duration-200 group",
            collapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>

      </div>
    </aside>
  );
}

// Header Component
interface HeaderProps {
  title: string;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  timeAgo: number | null;
  onMobileMenuOpen: () => void;
  onLogout?: () => void;
  // Props for simple status display
  connected: boolean;
  displayLabel: string;
}

function Header({ title, theme, onThemeToggle, onMobileMenuOpen, onLogout, connected, displayLabel }: HeaderProps) {
  return (
    <header className="h-16 bg-surface-sidebar/80 backdrop-blur-md border-b border-border-default flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMobileMenuOpen} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        {title && <h1 className="text-xl font-semibold text-text-primary">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">
        {/* Connection status simplified for header since selector is in sidebar */}
        <div className="hidden md:flex items-center text-sm">
          {connected ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-card-alt border border-border-default/50" title={`Conectado: ${displayLabel}`}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-status-success shadow-success"></span>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-card-alt border border-border-default/50" title="Desconectado">
              <span className="w-2.5 h-2.5 rounded-full bg-status-error opacity-80" />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onThemeToggle}
          className="hover:bg-surface-card-alt"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-text-secondary" /> : <Moon className="w-4 h-4 text-text-secondary" />}
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-surface-card-alt">
          <RefreshCw className="w-4 h-4 text-text-secondary" />
        </Button>
        {onLogout && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="hover:bg-surface-card-alt hover:text-status-error"
            title="Sair"
          >
            <LogOut className="w-4 h-4 text-text-secondary" />
          </Button>
        )}
      </div>
    </header>
  );
}
