import { useState, useEffect, useCallback } from 'react';
import { Key, Upload, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, Server, Info, Wallet, Play, Trash2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

interface UserData {
  id: string;
  email: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  bybit_configured?: boolean;
  has_bybit_credentials?: boolean;
}

interface BybitCredentials {
  api_key: string;
  updated_at: string;
}

interface SyncStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  last_sync_at: string | null;
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  balance?: {
    available: string;
    total: string;
  };
}

interface ConfiguracoesViewProps {
  onConfigChange?: (options?: { credentialsRemoved?: boolean }) => void;
}

export function ConfiguracoesView({ onConfigChange }: ConfiguracoesViewProps) {
  // User data state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [credentials, setCredentials] = useState<BybitCredentials | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  // Fetch user data and sync status
  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setIsLoading(true);

      // Fetch user data
      const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserData(userData.data);
      }

      // Always try to fetch credentials (will fail with 404 if not set)
      await fetchCredentials();

      // Fetch sync status
      await fetchSyncStatus();
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCredentials = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Note: Backend should return masked credentials (only last 4 chars of API key)
      const response = await fetch(`${API_BASE_URL}/users/bybit-credentials`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.data);
      } else if (response.status === 404) {
        // No credentials found - this is expected for new users
        setCredentials(null);
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
      setCredentials(null);
    }
  };

  const fetchSyncStatus = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const syncResponse = await fetch(`${API_BASE_URL}/sync/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        setSyncStatus(syncData.data);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll sync status every 3 seconds if syncing
  useEffect(() => {
    if (syncStatus?.status !== 'running') return;

    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [syncStatus?.status]);

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleSaveCredentials = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      showError('Preencha a API Key e o Secret');
      return;
    }

    setIsSaving(true);
    setError(null);
    setTestResult(null);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/users/bybit-credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          secret: apiSecret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Falha ao salvar credenciais');
      }

      showSuccess('Credenciais salvas com sucesso!');
      setApiKey('');
      setApiSecret('');
      setShowEditForm(false);

      // Refresh data to show saved credentials
      await fetchData();

      // Notify parent
      onConfigChange?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao salvar credenciais');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/users/test-bybit-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setTestResult({
          success: false,
          message: data.message || 'Falha ao conectar com a Bybit',
        });
        return;
      }

      setTestResult({
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        balance: data.data?.balance,
      });
      showSuccess('Conexão testada com sucesso!');
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erro ao testar conexão',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Falha ao iniciar sincronização');
      }

      showSuccess('Sincronização iniciada!');
      fetchSyncStatus();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCredentials = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/users/bybit-credentials`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao remover credenciais');
      }

      showSuccess('Credenciais removidas com sucesso!');
      setCredentials(null);
      setTestResult(null);
      setTestResult(null);
      fetchData();

      // Notify parent with credentialsRemoved flag
      onConfigChange?.({ credentialsRemoved: true });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao remover credenciais');
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  };

  // Check if user has configured bybit credentials
  // We check multiple sources: explicit flags from API, credentials object, or last_sync_at
  const isConfigured = !!(
    userData?.has_bybit_credentials ||
    userData?.bybit_configured ||
    credentials?.api_key ||
    userData?.last_sync_at
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-action-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
        <p className="text-text-secondary">Gerencie sua conexão com a Bybit e preferências</p>
      </div>

      {/* Status Card */}
      <Card className={cn(
        "p-5 border transition-all duration-200",
        isConfigured
          ? testResult?.success === false
            ? "border-status-warning/30 bg-status-warning/5"
            : "border-status-success/30 bg-status-success/5"
          : "border-status-error/30 bg-status-error/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isConfigured
                ? testResult?.success === false
                  ? "bg-status-warning/20"
                  : "bg-status-success/20"
                : "bg-status-error/20"
            )}>
              {isConfigured ?
                testResult?.success === false ? (
                  <AlertCircle className="w-6 h-6 text-status-warning" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-status-success" />
                ) : (
                  <Key className="w-6 h-6 text-status-error" />
                )
              }
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {isConfigured
                  ? testResult?.success === false
                    ? 'Credenciais Salvas (Não Validadas)'
                    : 'Conectado à Bybit'
                  : 'Não Configurado'
                }
              </h3>
              <p className="text-sm text-text-secondary">
                {isConfigured
                  ? credentials
                    ? `API Key: ${credentials.api_key}`
                    : 'Credenciais configuradas'
                  : 'Configure suas credenciais da API para sincronizar dados'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-text-muted hover:text-status-error"
                    title="Remover credenciais"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-surface-card border-border-default">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-text-primary">Remover credenciais</AlertDialogTitle>
                    <AlertDialogDescription className="text-text-secondary">
                      Tem certeza que deseja remover as credenciais da Bybit? Seus dados historicos serao mantidos, mas novas sincronizacoes nao serao possiveis ate configurar novas credenciais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border-default hover:bg-surface-card-alt">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCredentials}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Badge
              variant={isConfigured ? 'default' : 'destructive'}
              className={cn(
                isConfigured
                  ? testResult?.success === false
                    ? "bg-status-warning/20 text-status-warning border-status-warning/30"
                    : "bg-status-success/20 text-status-success border-status-success/30"
                  : "bg-status-error/20 text-status-error border-status-error/30"
              )}
            >
              {isConfigured
                ? testResult?.success === false ? 'NÃO VALIDADO' : 'CONFIGURADO'
                : 'PENDENTE'
              }
            </Badge>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={cn(
            "mt-4 p-4 rounded-lg border",
            testResult.success
              ? "bg-status-success/10 border-status-success/20"
              : "bg-status-error/10 border-status-error/20"
          )}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  testResult.success ? "text-status-success" : "text-status-error"
                )}>
                  {testResult.message}
                </p>
                {testResult.balance && (
                  <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Wallet className="w-4 h-4" />
                      Disponível: {testResult.balance.available} USDT
                    </span>
                    <span>Total: {testResult.balance.total} USDT</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sync Status */}
        {isConfigured && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Server className="w-4 h-4" />
                <span>Status:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    syncStatus?.status === 'running' && "bg-action-primary/10 text-action-primary border-action-primary/30",
                    syncStatus?.status === 'completed' && "bg-status-success/10 text-status-success border-status-success/30",
                    syncStatus?.status === 'failed' && "bg-status-error/10 text-status-error border-status-error/30",
                    syncStatus?.status === 'idle' && "bg-text-muted/10 text-text-muted"
                  )}
                >
                  {syncStatus?.status === 'idle' && 'Ocioso'}
                  {syncStatus?.status === 'running' && 'Sincronizando...'}
                  {syncStatus?.status === 'completed' && 'Concluído'}
                  {syncStatus?.status === 'failed' && 'Falhou'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span>Última sync:</span>
                <span>{formatLastSync(syncStatus?.last_sync_at ?? userData?.last_sync_at ?? null)}</span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {isConfigured && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="border-border-default hover:bg-surface-card-alt"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isTesting && "animate-spin")} />
                    {isTesting ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing || syncStatus?.status === 'running'}
                  className="bg-action-primary hover:bg-action-primary-hover"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isSyncing || syncStatus?.status === 'running' ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </div>
            </div>

            {syncStatus?.progress && syncStatus.status === 'running' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Progresso</span>
                  <span>{syncStatus.progress.current} / {syncStatus.progress.total}</span>
                </div>
                <div className="h-1.5 bg-surface-card-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-action-primary rounded-full transition-all duration-300"
                    style={{ width: `${(syncStatus.progress.current / syncStatus.progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
          <p className="text-sm text-status-success">{success}</p>
        </div>
      )}

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-surface-card-alt">
          <TabsTrigger value="api" className="data-[state=active]:bg-action-primary data-[state=active]:text-white">
            <Key className="w-4 h-4 mr-2" />Conectar via API
          </TabsTrigger>
          <TabsTrigger value="csv" className="data-[state=active]:bg-action-primary data-[state=active]:text-white">
            <Upload className="w-4 h-4 mr-2" />Importar CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card className="p-6 border border-border-default bg-surface-card">
            <div className="space-y-6">
              {/* Credentials Summary (when configured) */}
              {isConfigured && !showEditForm && (
                <div className="p-4 rounded-lg bg-surface-card-alt border border-border-default">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-action-primary/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-action-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Credenciais Configuradas</p>
                        <p className="text-xs text-text-muted">
                          {credentials?.api_key || 'API Key salva'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditForm(true)}
                        className="border-border-default hover:bg-surface-card"
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Form */}
              {(!isConfigured || showEditForm) && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {isConfigured ? 'Atualizar Credenciais' : 'Conectar com API da Bybit'}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Insira suas credenciais de API da Bybit para sincronizar seus dados automaticamente.
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 rounded-lg bg-surface-card-alt border border-border-default">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-action-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-text-secondary">
                        <p className="mb-2">Para criar uma API Key na Bybit:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-1">
                          <li>Acesse <a href="https://www.bybit.com/app/user/api-management" target="_blank" rel="noopener noreferrer" className="text-text-link hover:underline inline-flex items-center gap-1">API Management <ExternalLink className="w-3 h-3" /></a></li>
                          <li>Crie uma nova API Key com permissões de <strong>Read</strong></li>
                          <li>Copie a API Key e o Secret gerados</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* API Key */}
                    <div>
                      <Label htmlFor="apiKey" className="block text-sm font-medium text-text-secondary mb-2">
                        API Key
                      </Label>
                      <Input
                        id="apiKey"
                        type="text"
                        placeholder="Digite sua API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-surface-input border-border-default h-11"
                      />
                    </div>

                    {/* API Secret */}
                    <div>
                      <Label htmlFor="apiSecret" className="block text-sm font-medium text-text-secondary mb-2">
                        API Secret
                      </Label>
                      <div className="relative">
                        <Input
                          id="apiSecret"
                          type={showSecret ? 'text' : 'password'}
                          placeholder="Digite seu API Secret"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="bg-surface-input border-border-default pr-10 h-11"
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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSaveCredentials}
                        disabled={isSaving || !apiKey || !apiSecret}
                        className="flex-1 bg-action-primary hover:bg-action-primary-hover h-11"
                      >
                        {isSaving ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-2" />Salvar Credenciais</>
                        )}
                      </Button>
                      {isConfigured && (
                        <Button
                          variant="outline"
                          onClick={() => setShowEditForm(false)}
                          className="border-border-default hover:bg-surface-card-alt h-11"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="csv">
          <Card className="p-6 border border-border-default bg-surface-card">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Importar dados via CSV</h3>
                <p className="text-sm text-text-secondary">Faça upload de arquivos CSV exportados da Bybit.</p>
              </div>
              <div className="border-2 border-dashed border-border-default rounded-xl p-8 text-center hover:border-border-strong transition-all duration-200">
                <div className="w-16 h-16 rounded-full bg-surface-card-alt flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-text-secondary" />
                </div>
                <h4 className="text-lg font-medium text-text-primary mb-2">Arraste e solte seus arquivos CSV aqui</h4>
                <p className="text-sm text-text-secondary mb-4">ou clique para selecionar arquivos</p>
                <Button variant="outline" className="border-border-default hover:bg-surface-card-alt">
                  Selecionar Arquivo
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
