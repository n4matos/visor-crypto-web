import { useState, useMemo, useCallback, useEffect } from 'react';
import type { View } from '@/types';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { 
  DashboardView,
  CurvasView,
  FundingView,
  TaxasView,
  HistoricoView,
  PosicoesView,
  ConfiguracoesView,
  AuthView,
} from '@/views';
import { cn } from '@/lib/utils';
import { 
  TrendingUp,
  LayoutDashboard,
  DollarSign,
  Receipt,
  History,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

const PAGE_TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  curvas: 'Curvas de Crescimento',
  funding: 'Funding Rate',
  taxas: 'Taxas',
  historico: 'Histórico de Trades',
  posicoes: 'Posições Abertas',
  configuracoes: 'Configurações',
  auth: 'Autenticação',
};

interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'curvas', label: 'Curvas de Crescimento', icon: TrendingUp },
  { id: 'funding', label: 'Funding Rate', icon: DollarSign },
  { id: 'taxas', label: 'Taxas', icon: Receipt },
  { id: 'historico', label: 'Histórico', icon: History },
  { id: 'posicoes', label: 'Posições', icon: Wallet },
];

interface ConnectionStatus {
  connected: boolean;
  exchange: string;
  lastSync: string | null;
  apiKey: string | null;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    exchange: 'Bybit',
    lastSync: null,
    apiKey: null,
  });
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading: authLoading, login, register, logout, error, clearError } = useAuth();

  // Fetch connection status from API
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        // Fetch user data to check if has credentials
        const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Check multiple possible field names from backend
          const hasCredentials = userData.data?.has_bybit_credentials || 
                                userData.data?.bybit_configured || 
                                userData.data?.has_credentials;
          const lastSync = userData.data?.last_sync_at;

          // Consider connected if has credentials (same logic as ConfiguracoesView)
          const isConnected = !!(hasCredentials || lastSync);

          // Fetch credentials to get masked API key
          let apiKey = null;
          if (hasCredentials) {
            const credResponse = await fetch(`${API_BASE_URL}/users/bybit-credentials`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (credResponse.ok) {
              const credData = await credResponse.json();
              apiKey = credData.data?.api_key;
            }
          }

          setConnectionStatus({
            connected: isConnected,
            exchange: 'Bybit',
            lastSync: lastSync,
            apiKey: apiKey,
          });
        }
      } catch (err) {
        console.error('Failed to fetch connection status:', err);
      }
    };

    // Fetch immediately and whenever auth state changes
    fetchConnectionStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const timeAgo = useMemo(() => {
    if (!connectionStatus.lastSync) return null;
    const lastSync = new Date(connectionStatus.lastSync);
    return Math.floor((currentTime - lastSync.getTime()) / 60000);
  }, [currentTime, connectionStatus.lastSync]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    return await login({ email, password });
  }, [login]);

  const handleRegister = useCallback(async (email: string, password: string): Promise<boolean> => {
    return await register({ email, password });
  }, [register]);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentView('dashboard');
  }, [logout]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'curvas': return <CurvasView />;
      case 'funding': return <FundingView />;
      case 'taxas': return <TaxasView />;
      case 'historico': return <HistoricoView />;
      case 'posicoes': return <PosicoesView />;
      case 'configuracoes': return <ConfiguracoesView />;
      default: return <DashboardView />;
    }
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  // Show loading state while checking auth
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

  // Show Auth view if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthView
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={authLoading}
        error={error}
        onClearError={clearError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Mobile Header */}
      <MobileHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} isOpen={mobileMenuOpen} />

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView}
        onNavClick={handleNavClick}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 ease-out min-h-screen",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Header */}
        <Header 
          title={PAGE_TITLES[currentView]}
          theme={theme}
          onThemeToggle={toggleTheme}
          timeAgo={timeAgo}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          connected={connectionStatus.connected}
          exchange={connectionStatus.exchange}
        />

        {/* Page Content */}
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
          <TrendingUp className="w-5 h-5 text-white" />
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
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-surface-sidebar border-r border-border-default z-50 transition-all duration-300 ease-out",
      collapsed ? "w-20" : "w-64",
      mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-action-primary flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="font-semibold text-text-primary whitespace-nowrap">Visor Crypto</span>}
        </div>
        <Button variant="ghost" size="icon" onClick={onCollapseToggle} className="hidden lg:flex h-8 w-8">
          {collapsed ? <ChevronRight className="w-4 h-4 text-text-muted" /> : <ChevronLeft className="w-4 h-4 text-text-muted" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <NavButton
              key={item.id}
              icon={<Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-action-primary" : "text-text-secondary group-hover:text-text-primary"
              )} />}
              label={item.label}
              isActive={isActive}
              collapsed={collapsed}
              onClick={() => onNavClick(item.id)}
            />
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-3 border-t border-border-default",
        collapsed ? "space-y-2" : "space-y-1"
      )}>
        <NavButton
          icon={<Settings className="w-5 h-5 flex-shrink-0" />}
          label="Configurações"
          isActive={currentView === 'configuracoes'}
          collapsed={collapsed}
          onClick={() => onNavClick('configuracoes')}
        />
        <NavButton
          icon={<LogOut className="w-5 h-5 flex-shrink-0" />}
          label="Sair"
          isActive={false}
          collapsed={collapsed}
          onClick={onLogout}
        />
      </div>
    </aside>
  );
}

// Navigation Button Component
interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, collapsed, onClick }: NavButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-surface-card-alt group",
        isActive 
          ? "bg-action-primary-muted text-action-primary border border-action-primary/30" 
          : "text-text-secondary border border-transparent"
      )}
    >
      {icon}
      {!collapsed && (
        <span className={cn(
          "text-sm font-medium whitespace-nowrap",
          isActive ? "text-action-primary" : "text-text-secondary group-hover:text-text-primary"
        )}>
          {label}
        </span>
      )}
    </button>
  );
}

// Header Component
interface HeaderProps {
  title: string;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  timeAgo: number | null;
  onMobileMenuOpen: () => void;
  connected: boolean;
  exchange: string;
}

function Header({ title, theme, onThemeToggle, timeAgo, onMobileMenuOpen, connected, exchange }: HeaderProps) {
  return (
    <header className="h-16 bg-surface-sidebar/80 backdrop-blur-md border-b border-border-default flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMobileMenuOpen} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <ConnectionStatus timeAgo={timeAgo} connected={connected} exchange={exchange} />
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
      </div>
    </header>
  );
}

// Connection Status Component
interface ConnectionStatusProps {
  timeAgo: number | null;
  connected: boolean;
  exchange: string;
}

function ConnectionStatus({ timeAgo, connected, exchange }: ConnectionStatusProps) {
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card-alt border border-border-default">
      {connected ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-status-success" />
          <span className="text-sm text-text-secondary">{exchange}</span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo === null ? 'nunca' : timeAgo < 1 ? 'agora' : `${timeAgo}m`}
          </span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-status-error" />
          <span className="text-sm text-text-secondary">Desconectado</span>
        </>
      )}
    </div>
  );
}
