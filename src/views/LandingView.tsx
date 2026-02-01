
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    Shield,
    Zap,
    BarChart3,
    Globe,
    ArrowRight,
    Lock
} from 'lucide-react';

interface LandingViewProps {
    onLogin: () => void;
    onRegister: () => void;
}

export function LandingView({ onLogin, onRegister }: LandingViewProps) {
    return (
        <div className="min-h-screen bg-surface-page text-text-primary overflow-x-hidden selection:bg-[rgba(124,92,252,0.3)] selection:text-text-primary">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-page/80 backdrop-blur-md border-b border-border-default">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-action-primary flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-text-on-primary" />
                            </div>
                            <span className="font-sans font-bold text-xl tracking-tight">Visor Crypto</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={onLogin}
                                className="text-text-secondary hover:text-text-primary"
                            >
                                Entrar
                            </Button>
                            <Button onClick={onRegister}>
                                Começar Agora
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[128px] bg-[rgba(124,92,252,0.2)]" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[128px] bg-[rgba(167,139,250,0.1)]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-default mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                        <span className="text-sm font-medium text-text-secondary">Plataforma em Tempo Real</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-secondary)]">
                        Maximize seus ganhos <br />
                        com <span className="text-action-primary">Inteligência</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-text-secondary mb-10 leading-relaxed">
                        Tenha uma visão clara do mercado crypto. Acompanhe curvas de crescimento,
                        funding rates e suas posições em uma única interface profissional.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8" onClick={onRegister}>
                            Criar Conta Grátis
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto text-base h-12 px-8 border-border-strong hover:bg-surface-card-alt"
                            onClick={() => window.open('https://docs.visorcrypto.com', '_blank')}
                        >
                            Documentação
                        </Button>
                    </div>

                    {/* Stats Preview */}
                    <div className="mt-20 relative mx-auto max-w-5xl">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(124,92,252,0.5)] to-[rgba(167,139,250,0.5)] rounded-2xl blur opacity-20" />
                        <div className="relative rounded-xl bg-surface-card border border-border-default overflow-hidden shadow-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-default">
                                <div className="p-6 md:p-8">
                                    <div className="text-sm text-text-muted mb-2">Volume Monitorado</div>
                                    <div className="text-3xl font-bold text-text-primary">$2.4B+</div>
                                    <div className="text-sm text-accent-green mt-1 flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" /> +12.5% últimas 24h
                                    </div>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="text-sm text-text-muted mb-2">Exchanges Suportadas</div>
                                    <div className="text-3xl font-bold text-text-primary">Top 10</div>
                                    <div className="text-sm text-text-secondary mt-1">Incluindo Bybit e Binance</div>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="text-sm text-text-muted mb-2">Latência Média</div>
                                    <div className="text-3xl font-bold text-text-primary">ms</div>
                                    <div className="text-sm text-accent-green mt-1 flex items-center gap-1">
                                        <Zap className="w-4 h-4" /> Tempo Real
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-surface-sidebar border-t border-border-subtle">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-text-primary mb-4">
                            Tudo que você precisa para operar melhor
                        </h2>
                        <p className="text-text-secondary text-lg">
                            Ferramentas avançadas simplificadas para traders que buscam performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<TrendingUp className="w-6 h-6 text-action-primary" />}
                            title="Curvas de Crescimento"
                            description="Visualize a evolução do seu equity em comparação com BTC e ETH. Identifique se você está superando o mercado."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-accent-orange" />}
                            title="Análise de Funding"
                            description="Monitore taxas de funding em tempo real. Identifique oportunidades de arbitragem e custos de posição."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-accent-green" />}
                            title="Gestão de Risco"
                            description="Acompanhe sua alavancagem, margem e preços de liquidação de forma centralizada e segura."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-accent-yellow" />}
                            title="Dados em Tempo Real"
                            description="Conexão direta com exchanges via WebSocket para garantir que você tenha sempre a informação mais recente."
                        />
                        <FeatureCard
                            icon={<Globe className="w-6 h-6 text-action-primary" />}
                            title="Multi-Exchange"
                            description="Gerencie todas as suas contas em um só lugar. Suporte nativo para as principais corretoras globais."
                        />
                        <FeatureCard
                            icon={<Lock className="w-6 h-6 text-text-primary" />}
                            title="Segurança Máxima"
                            description="Suas chaves API são criptografadas e nunca deixam nossos servidores seguros. Acesso apenas de leitura recomendado."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[rgba(124,92,252,0.05)]" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
                        Pronto para evoluir seu trading?
                    </h2>
                    <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
                        Junte-se a traders profissionais que já utilizam o Visor Crypto para tomar decisões mais assertivas.
                    </p>
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-glow animate-pulse" onClick={onRegister}>
                        Começar Gratuitamente
                    </Button>
                    <p className="mt-6 text-sm text-text-muted">
                        Não é necessário cartão de crédito • Setup em 2 minutos
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface-page border-t border-border-default pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded bg-action-primary flex items-center justify-center">
                                    <TrendingUp className="w-3 h-3 text-text-on-primary" />
                                </div>
                                <span className="font-bold text-lg text-text-primary">Visor Crypto</span>
                            </div>
                            <p className="text-sm text-text-secondary">
                                Inteligência de mercado para traders que exigem o melhor.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary mb-4">Produto</h4>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#" className="hover:text-action-primary transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-action-primary transition-colors">Preços</a></li>
                                <li><a href="#" className="hover:text-action-primary transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary mb-4">Recursos</h4>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#" className="hover:text-action-primary transition-colors">Documentação</a></li>
                                <li><a href="#" className="hover:text-action-primary transition-colors">API</a></li>
                                <li><a href="#" className="hover:text-action-primary transition-colors">Status</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#" className="hover:text-action-primary transition-colors">Privacidade</a></li>
                                <li><a href="#" className="hover:text-action-primary transition-colors">Termos</a></li>
                                <li><a href="#" className="hover:text-action-primary transition-colors">Cookies</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-text-muted">
                            © 2024 Visor Crypto. Todos os direitos reservados.
                        </div>
                        <div className="flex gap-4">
                            {/* Social icons could go here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-surface-card border border-border-default hover:border-[rgba(124,92,252,0.5)] transition-all duration-300 hover:shadow-glow group">
            <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
            <p className="text-text-secondary leading-relaxed">
                {description}
            </p>
        </div>
    );
}
