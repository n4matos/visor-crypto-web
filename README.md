# Visor Crypto Web

Dashboard profissional para acompanhamento de métricas de trading de criptomoedas.

![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-purple?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal?logo=tailwindcss)

## 📋 Funcionalidades

- **Dashboard** - Visão geral do portfolio com saldo, PnL, taxas e funding
- **Curvas de Crescimento** - Acompanhamento da evolução do capital em USD e BTC
- **Posições Abertas** - Monitoramento de posições em tempo real
- **Funding Rate** - Análise de funding pago/recebido
- **Taxas de Trading** - Controle de taxas maker/taker
- **Histórico de Trades** - Visualização completa do histórico

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos e visualizações
- **Lucide React** - Ícones

## 📦 Instalação

```bash
# Clone o repositório
git clone git@github.com:n4matos/visor-crypto-web.git
cd visor-crypto-web

# Instale as dependências
npm install
```

## 💻 Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no navegador.

## 🔨 Build

```bash
# Criar build de produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── cards/          # Cards de métricas e posições
│   └── ui/             # Componentes shadcn/ui
├── views/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── types/              # Tipagens TypeScript
├── lib/                # Utilitários
└── App.tsx             # Componente principal
```

## 🔌 Integração com API

> ⚠️ **Atenção:** Os dados mockados foram removidos. O projeto está pronto para integração com a API.

Os seguintes arquivos precisam ser atualizados para conectar à API:

- `src/views/DashboardView.tsx` - Dados da conta, equity, trades e posições
- `src/views/PosicoesView.tsx` - Posições abertas
- `src/views/CurvasView.tsx` - Dados de equity e métricas
- `src/views/FundingView.tsx` - Funding rate
- `src/views/TaxasView.tsx` - Taxas de trading
- `src/views/HistoricoView.tsx` - Histórico de trades
- `src/views/ConfiguracoesView.tsx` - Status de conexão
- `src/App.tsx` - Status de conexão no header

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa ESLint |

## 📝 Licença

Este projeto é privado e de uso exclusivo.

---

Desenvolvido com ❤️ usando React + TypeScript + Vite
