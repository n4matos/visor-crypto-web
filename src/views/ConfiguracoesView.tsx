import { useState } from 'react';
import { Key, Upload, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// TODO: Substituir por dados da API
const connectionStatus = {
  connected: false,
  exchange: 'Bybit',
  lastSync: new Date().toISOString(),
  apiKey: '****1234',
};

export function ConfiguracoesView() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnecting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
        <p className="text-text-secondary">Gerencie sua conexão e preferências</p>
      </div>

      <Card className={cn("p-5 border transition-all duration-200", connectionStatus.connected ? "border-status-success/30 bg-status-success-muted/20" : "border-status-error/30 bg-status-error-muted/20")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", connectionStatus.connected ? "bg-status-success/20" : "bg-status-error/20")}>
              {connectionStatus.connected ? <CheckCircle2 className="w-6 h-6 text-status-success" /> : <AlertCircle className="w-6 h-6 text-status-error" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{connectionStatus.connected ? 'Conectado' : 'Desconectado'}</h3>
              <p className="text-sm text-text-secondary">{connectionStatus.connected ? `Conectado à ${connectionStatus.exchange} • API Key: ${connectionStatus.apiKey}` : 'Conecte sua conta para sincronizar dados'}</p>
            </div>
          </div>
          <Badge variant={connectionStatus.connected ? 'default' : 'destructive'} 
            className={connectionStatus.connected ? "bg-status-success/20 text-status-success border-status-success/30" : ""}>
            {connectionStatus.connected ? 'ATIVO' : 'INATIVO'}
          </Badge>
        </div>
      </Card>

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
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Conectar com API da Bybit</h3>
                <p className="text-sm text-text-secondary">Insira suas credenciais de API da Bybit para sincronizar seus dados automaticamente.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">API Key</label>
                  <Input 
                    type="text" 
                    placeholder="Digite sua API Key" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className="bg-surface-input border-border-default" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">API Secret</label>
                  <div className="relative">
                    <Input 
                      type={showSecret ? 'text' : 'password'} 
                      placeholder="Digite seu API Secret" 
                      value={apiSecret} 
                      onChange={(e) => setApiSecret(e.target.value)} 
                      className="bg-surface-input border-border-default pr-10" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSecret(!showSecret)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting} 
                    className="flex-1 bg-action-primary hover:bg-action-primary-hover"
                  >
                    {isConnecting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Conectando...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Conectar</>}
                  </Button>
                  <Button variant="outline" className="border-border-default hover:bg-surface-card-alt">
                    <RefreshCw className="w-4 h-4 mr-2" />Testar
                  </Button>
                </div>
              </div>
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
                <Button variant="outline" className="border-border-default hover:bg-surface-card-alt">Selecionar Arquivo</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
