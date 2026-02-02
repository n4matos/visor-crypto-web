import { useState } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, Eye, EyeOff, LayoutTemplate, Lock, BookOpen, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

interface OnboardingViewProps {
    onComplete: () => void;
}

type Step = 'exchange' | 'credentials' | 'account' | 'success';

export function OnboardingView({ onComplete }: OnboardingViewProps) {
    const [step, setStep] = useState<Step>('exchange');
    const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAccountType, setSelectedAccountType] = useState<'unified' | 'standard' | null>('unified');

    // Reuse logic from useAuth or similar if needed, but we essentially need a token
    const getToken = () => localStorage.getItem('visor_jwt');

    const handleSelectExchange = (exchange: string) => {
        setSelectedExchange(exchange);
        setStep('credentials');
        setError(null);
    };

    const handleCredentialsSubmit = async () => {
        if (!apiKey.trim() || !apiSecret.trim()) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = getToken();
            if (!token) throw new Error('Sessão expirada. Faça login novamente.');

            // 1. Test Connection first (without saving)
            const testResponse = await fetch(`${API_BASE_URL}/credentials/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    exchange: 'Bybit',
                    api_key: apiKey,
                    secret: apiSecret,
                }),
            });

            if (!testResponse.ok) {
                const testData = await testResponse.json().catch(() => null);
                throw new Error(testData?.error || 'Falha na conexão com a Bybit. Verifique suas chaves.');
            }

            // 2. Save Credentials (using new multi-account API)
            const saveResponse = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    label: 'Principal', // Default label for the first account
                    exchange: 'Bybit',
                    api_key: apiKey,
                    secret: apiSecret,
                }),
            });

            if (!saveResponse.ok) {
                const data = await saveResponse.json().catch(() => null);
                throw new Error(data?.error || 'Falha ao salvar credenciais.');
            }

            // Success
            setStep('account');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAccountSelection = async () => {
        setIsSubmitting(true);
        try {
            const token = getToken();

            // 3. Trigger Initial Sync
            await fetch(`${API_BASE_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            setStep('success');

            // Redirect after delay
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err) {
            console.error('Failed to trigger sync:', err);
            // Verify step success anyway as credentials are good
            setStep('success');
            setTimeout(() => {
                onComplete();
            }, 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-4">

            {/* Container with max-width */}
            <div className={cn("w-full animate-fade-in-up", step === 'credentials' ? "max-w-4xl" : "max-w-2xl")}>

                {/* Header / Steps Indicator */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        {step === 'exchange' && 'Conecte sua Exchange'}
                        {step === 'credentials' && 'Configure suas Credenciais'}
                        {step === 'account' && 'Selecione o Tipo de Conta'}
                        {step === 'success' && 'Tudo Pronto!'}
                    </h1>
                    <p className="text-text-secondary">
                        {step === 'exchange' && 'Escolha uma corretora para importar seus dados.'}
                        {step === 'credentials' && `Insira as chaves de API da ${selectedExchange || 'sua corretora'}.`}
                        {step === 'account' && 'Identifique o tipo de conta para sincronização correta.'}
                        {step === 'success' && 'Seus dados estão sendo sincronizados.'}
                    </p>
                </div>

                {/* Card Content */}
                <Card className="bg-surface-card border-border-default shadow-lg overflow-hidden relative">

                    {/* Progress Bar (Optional) */}
                    <div className="h-1 bg-surface-card-alt w-full">
                        <div
                            className="h-full bg-action-primary transition-all duration-500 ease-out"
                            style={{
                                width: step === 'exchange' ? '25%' :
                                    step === 'credentials' ? '50%' :
                                        step === 'account' ? '75%' : '100%'
                            }}
                        />
                    </div>

                    <div className="p-8">

                        {/* Step 1: Exchange Selection */}
                        {step === 'exchange' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSelectExchange('Bybit')}
                                    className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border border-border-default bg-surface-card-alt hover:border-action-primary/50 hover:bg-surface-elevated transition-all duration-200"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[#17181e] flex items-center justify-center border border-border-strong group-hover:scale-110 transition-transform">
                                        {/* Simple Bybit Logo Placeholder (Text or customized SVG) */}
                                        <span className="font-bold text-[#F7A600]">Bybit</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-text-primary">Bybit</h3>
                                        <div className="mt-2 text-xs px-2 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/20 inline-block">
                                            Recomendado
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CheckCircle2 className="w-5 h-5 text-action-primary" />
                                    </div>
                                </button>

                                <button
                                    disabled
                                    className="flex flex-col items-center gap-4 p-6 rounded-xl border border-border-subtle bg-surface-card-alt/50 opacity-50 cursor-not-allowed"
                                >
                                    <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center border border-border-subtle">
                                        <span className="font-bold text-text-muted">Binance</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-text-muted">Binance</h3>
                                        <span className="text-xs text-text-muted mt-1 block">Em breve</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Step 2: Credentials */}
                        {step === 'credentials' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left: Form + Trust Badges */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="apiKey" className="text-text-secondary">API Key</Label>
                                            <Input
                                                id="apiKey"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="Copie sua API Key da Bybit"
                                                className="bg-surface-input border-border-default h-12 mt-1.5 focus:border-action-primary"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="apiSecret" className="text-text-secondary">API Secret</Label>
                                            <div className="relative mt-1.5">
                                                <Input
                                                    id="apiSecret"
                                                    type={showSecret ? 'text' : 'password'}
                                                    value={apiSecret}
                                                    onChange={(e) => setApiSecret(e.target.value)}
                                                    placeholder="Copie seu API Secret"
                                                    className="bg-surface-input border-border-default h-12 pr-10 focus:border-action-primary"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecret(!showSecret)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                                                >
                                                    {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-status-error text-sm p-3 bg-status-error/10 rounded-md">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" onClick={() => setStep('exchange')} className="h-12 border-border-default">
                                            Voltar
                                        </Button>
                                        <Button
                                            onClick={handleCredentialsSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 h-12 bg-action-primary hover:bg-action-primary-hover text-white font-medium shadow-glow"
                                        >
                                            {isSubmitting ? (
                                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Conectando...</>
                                            ) : (
                                                <>Conectar Exchange <ArrowRight className="w-4 h-4 ml-2" /></>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Trust Badges */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-card-alt/50">
                                            <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center shrink-0">
                                                <Lock className="w-4 h-4 text-action-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">Conexao Segura</p>
                                                <p className="text-xs text-text-secondary">Todos os dados sao trafegados por conexao criptografada. Suas chaves sao armazenadas com criptografia AES-256.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-card-alt/50">
                                            <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center shrink-0">
                                                <Eye className="w-4 h-4 text-action-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">Acesso Somente Leitura</p>
                                                <p className="text-xs text-text-secondary">A integracao possui acesso somente leitura e nao pode realizar alteracoes na sua conta ou movimentar fundos.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-card-alt/50">
                                            <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center shrink-0">
                                                <Settings2 className="w-4 h-4 text-action-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">Permissoes Controladas</p>
                                                <p className="text-xs text-text-secondary">Voce tem o controle. Pode revisar e revogar o acesso a qualquer momento nas configuracoes da sua conta.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Step-by-Step Instructions */}
                                <div className="lg:border-l lg:border-border-default lg:pl-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="w-5 h-5 text-action-primary" />
                                        <h3 className="text-base font-semibold text-text-primary">Passo a Passo</h3>
                                    </div>
                                    <ol className="space-y-3 text-sm text-text-secondary">
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">1</span>
                                            <span>Faca login na sua conta <strong className="text-text-primary">Bybit</strong></span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">2</span>
                                            <span>Abra o menu do perfil e clique em <strong className="text-text-primary">API</strong></span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">3</span>
                                            <span>Clique em <strong className="text-text-primary">Criar Nova Chave</strong></span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">4</span>
                                            <span>Selecione <strong className="text-text-primary">System-generated API Keys</strong></span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">5</span>
                                            <span>Ative a verificacao 2FA se necessario</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">6</span>
                                            <span>Nomeie a chave (ex: <strong className="text-text-primary">Visor Crypto</strong>)</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">7</span>
                                            <span>Habilite <strong className="text-text-primary">Read-Only</strong> e <strong className="text-text-primary">No IP Restriction</strong></span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">8</span>
                                            <span>Habilite <strong className="text-text-primary">Unified Trading</strong> com permissao de <strong className="text-text-primary">Assets</strong> e clique em Enviar</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">9</span>
                                            <span>Complete a verificacao de seguranca (2FA + e-mail)</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary text-xs font-semibold flex items-center justify-center shrink-0">10</span>
                                            <span>Copie a <strong className="text-text-primary">API Key</strong> e o <strong className="text-text-primary">Secret</strong> e cole nos campos ao lado</span>
                                        </li>
                                    </ol>
                                    <div className="mt-5 p-3 rounded-lg bg-status-warning/5 border border-status-warning/20">
                                        <p className="text-xs text-text-secondary">
                                            <strong className="text-status-warning">Nota:</strong> A API Key expira em 3 meses se criada sem restricao de IP. Se a senha da sua conta Bybit for alterada, o Secret sera valido por no maximo 7 dias.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Account Selection */}
                        {step === 'account' && (
                            <div className="space-y-6">
                                <p className="text-text-secondary">
                                    A Bybit possui diferentes tipos de contas. Selecione qual você utiliza para garantirmos a leitura correta dos dados.
                                </p>

                                <div className="grid grid-cols-1 gap-4">
                                    <div
                                        onClick={() => setSelectedAccountType('unified')}
                                        className={cn(
                                            "cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between",
                                            selectedAccountType === 'unified'
                                                ? "bg-action-primary/10 border-action-primary shadow-sm"
                                                : "bg-surface-card-alt border-border-default hover:border-action-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center">
                                                <LayoutTemplate className="w-5 h-5 text-action-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-text-primary">Unified Trading Account (UTA)</h4>
                                                <p className="text-xs text-text-secondary">Conta unificada (Margem única para Spot/Derivativos)</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center",
                                            selectedAccountType === 'unified' ? "border-action-primary bg-action-primary" : "border-text-muted"
                                        )}>
                                            {selectedAccountType === 'unified' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setSelectedAccountType('standard')}
                                        className={cn(
                                            "cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between",
                                            selectedAccountType === 'standard'
                                                ? "bg-action-primary/10 border-action-primary shadow-sm"
                                                : "bg-surface-card-alt border-border-default hover:border-action-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-text-muted" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-text-primary">Conta Standard</h4>
                                                <p className="text-xs text-text-secondary">Conta clássica (Carteiras separadas)</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center",
                                            selectedAccountType === 'standard' ? "border-action-primary bg-action-primary" : "border-text-muted"
                                        )}>
                                            {selectedAccountType === 'standard' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAccountSelection}
                                    className="w-full h-12 bg-action-primary hover:bg-action-primary-hover text-white font-medium shadow-glow mt-2"
                                >
                                    Finalizar Configuração
                                </Button>
                            </div>
                        )}

                        {/* Success State */}
                        {step === 'success' && (
                            <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-status-success" />
                                </div>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">Conectado com Sucesso!</h2>
                                <p className="text-text-secondary text-center max-w-sm">
                                    Sua conta foi vinculada. Estamos importando seus dados históricos, isso pode levar alguns instantes.
                                </p>
                                <div className="mt-8 flex items-center gap-2 text-action-primary animate-pulse">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span className="text-sm font-medium">Redirecionando para Dashboard...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Footer info */}
                {step !== 'success' && (
                    <p className="text-center text-xs text-text-muted mt-6">
                        Precisa de ajuda? <a href="#" className="text-text-link hover:underline">Consulte nosso guia</a> ou entre em contato com o suporte.
                    </p>
                )}
            </div>
        </div>
    );
}
