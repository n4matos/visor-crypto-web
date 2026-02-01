# Visor Crypto Web - AGENTS.md

## 🎯 Visão Geral

Dashboard profissional para acompanhamento de métricas de trading de criptomoedas na exchange Bybit.

**Projeto relacionado:**
- Backend: `/Users/n4matos/projects/visor-crypto-api` (Go + Echo + PostgreSQL)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    VISOR CRYPTO PLATFORM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐   │
│  │   visor-crypto-web  │         │   visor-crypto-api  │   │
│  │   (Next.js/React)   │────────▶│   (Go/Echo)         │   │
│  │   Porta: 5173       │  HTTP   │   Porta: 8080       │   │
│  │                     │         │                     │   │
│  │   - React 19        │         │   - JWT Auth        │   │
│  │   - TypeScript      │         │   - Bybit Sync      │   │
│  │   - Vite            │         │   - PostgreSQL      │   │
│  │   - TailwindCSS     │         │   - Redis           │   │
│  └─────────────────────┘         └──────────┬──────────┘   │
│                                             │              │
│                                             ▼              │
│                                    ┌──────────────────┐   │
│                                    │   Bybit API      │   │
│                                    │   (External)     │   │
│                                    └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Stack Tecnológica

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Framework | React | 19.2.0 |
| Linguagem | TypeScript | 5.9 |
| Build Tool | Vite | 7.2 |
| Estilização | TailwindCSS | 3.4 |
| UI Components | shadcn/ui | - |
| Gráficos | Recharts | - |
| Ícones | Lucide React | - |
| HTTP Client | Fetch API | - |
| Roteamento | React Router | v7 |

---

## 📁 Estrutura de Diretórios

```
visor-crypto-web/
├── src/
│   ├── components/
│   │   ├── cards/           # Cards de métricas (MetricCard, PositionsCard, etc)
│   │   ├── charts/          # Gráficos (EquityCurveChart, etc)
│   │   └── ui/              # Componentes shadcn/ui (button, card, table, etc)
│   ├── views/               # Páginas da aplicação
│   │   ├── DashboardView.tsx       # Visão geral (principal)
│   │   ├── PosicoesView.tsx        # Posições abertas
│   │   ├── CurvasView.tsx          # Curvas de crescimento
│   │   ├── FundingView.tsx         # Funding rate
│   │   ├── TaxasView.tsx           # Taxas de trading
│   │   ├── HistoricoView.tsx       # Histórico de trades
│   │   └── ConfiguracoesView.tsx   # Configurações
│   ├── hooks/               # Custom React hooks
│   ├── types/               # Tipagens TypeScript
│   │   └── index.ts         # Tipos: User, Transaction, Position, etc
│   ├── lib/                 # Utilitários
│   │   └── utils.ts         # cn(), formatters, helpers
│   ├── App.tsx              # Componente principal com roteamento
│   └── main.tsx             # Entry point
├── public/                  # Assets estáticos
├── components.json          # Config shadcn/ui
├── tailwind.config.js       # Config Tailwind
└── vite.config.ts           # Config Vite
```

---

## 📡 Integração com API (IMPORTANTE)

### Base URL
A URL da API é configurada via variável de ambiente:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Ou no código:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
```

### Fluxo de Autenticação (2 Etapas)

**ETAPA 1 - Cadastro na Plataforma:**
```typescript
// POST /auth/register
const register = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  // Salvar token: data.data.token
  return data;
};
```

**ETAPA 2 - Login:**
```typescript
// POST /auth/login
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  // Salvar token: data.data.token
  return data;
};
```

**ETAPA 3 - Configurar Bybit (após login):**
```typescript
// PUT /users/bybit-credentials
const updateBybitCredentials = async (apiKey: string, secret: string) => {
  const response = await fetch(`${API_BASE_URL}/users/bybit-credentials`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`  // Token do login!
    },
    body: JSON.stringify({ api_key: apiKey, secret })
  });
  return response.json();
};
```

### Requisições Autenticadas

Todas as rotas protegidas precisam do header:
```typescript
headers: {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}
```

### Endpoints Principais para Integrar

| View | Método | Endpoint | Descrição |
|------|--------|----------|-----------|
| Dashboard | GET | `/dashboard/summary` | Resumo (saldo, PnL, taxas) |
| Dashboard | GET | `/positions` | Posições em tempo real |
| Dashboard | GET | `/transactions` | Últimas transações |
| Curvas | GET | `/dashboard/equity-curve?period=30d` | Dados para gráfico |
| Funding | GET | `/funding/summary` | Resumo de funding |
| Taxas | GET | `/fees/summary` | Resumo de taxas |
| Histórico | GET | `/transactions?limit=50` | Lista paginada |
| Config | PUT | `/users/bybit-credentials` | Salvar API keys |
| Config | GET | `/users/bybit-credentials` | Buscar credenciais (masked) |
| Config | DELETE | `/users/bybit-credentials` | Remover credenciais |
| Config | POST | `/users/test-bybit-connection` | Testar conexão Bybit |
| Config | GET | `/users/me` | Dados do usuário |
| Config | POST | `/sync` | Iniciar sincronização |
| Config | GET | `/sync/status` | Status da sincronização |

---

## 🧩 Componentes Principais

### Cards de Métricas (`src/components/cards/`)
- **MetricCard** - Card genérico com label, valor e ícone
- **PositionsCard** - Lista de posições abertas
- **BalanceCard** - Saldo e variação

### Views (`src/views/`)
| View | Rota | Props/Estrutura |
|------|------|-----------------|
| DashboardView | `/` | Tabs: Visão Geral, Atividade |
| PosicoesView | `/posicoes` | Tabela de posições |
| CurvasView | `/curvas` | Gráficos de equity |
| FundingView | `/funding` | Cards de funding |
| TaxasView | `/taxas` | Análise de taxas |
| HistoricoView | `/historico` | Tabela de trades |
| ConfiguracoesView | `/configuracoes` | Form de API keys |

### Tipagens Importantes (`src/types/index.ts`)
```typescript
interface User {
  id: string;
  email: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  type: 'Trade' | 'Funding' | 'Fee';
  qty: string;
  price: string;
  fee: string;
  executed_at: string;
}

interface Position {
  symbol: string;
  side: 'Long' | 'Short';
  size: string;
  entry_price: string;
  mark_price: string;
  unrealized_pnl: string;
  leverage: string;
}
```

---

## 🛠️ Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:5173

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint

# Adicionar componente shadcn/ui
npx shadcn add button
```

---

## 📝 Configuração de Estado (Auth)

### Onde armazenar o JWT?
**Opções:**
1. **localStorage** - Persiste entre sessões (escolhido para este projeto)
2. **memory** - Mais seguro, mas perde no refresh
3. **httpOnly cookie** - Mais seguro, requer config no backend

### Exemplo de hook de auth:
```typescript
// hooks/useAuth.ts
const useAuth = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('visor_jwt')
  );
  
  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, ...);
    const { token } = response.data;
    localStorage.setItem('visor_jwt', token);
    setToken(token);
  };
  
  const logout = () => {
    localStorage.removeItem('visor_jwt');
    setToken(null);
  };
  
  return { token, login, logout, isAuthenticated: !!token };
};
```

---

## 🎨 Design System

### Cores Principais (Tailwind)
```javascript
// tailwind.config.js
colors: {
  background: '#09090b',    // Fundo escuro
  foreground: '#fafafa',    // Texto claro
  card: '#18181b',          // Cards
  border: '#27272a',        // Bordas
  primary: '#22c55e',       // Verde (positivo)
  destructive: '#ef4444',   // Vermelho (negativo)
}
```

### Componentes shadcn/ui Usados
- `button` - Botões
- `card` - Cards de métricas
- `table` - Tabelas de dados
- `tabs` - Navegação em abas
- `badge` - Status labels
- `input` - Formulários
- `dialog` - Modais
- `dropdown-menu` - Menus
- `separator` - Divisores

---

## 🔍 Debugging

### React DevTools
Instalar extensão do navegador para inspecionar componentes.

### Network Tab
Verificar requisições para a API:
- Status HTTP
- Headers (Authorization presente?)
- Response body

### Console
Logs de erro da aplicação.

---

## 🐛 Problemas Comuns

### CORS Error
Se aparecer erro de CORS, verifique:
1. API está rodando?
2. `APP_ENV=development` no .env da API?
3. Porta correta (8080)?

### JWT Expirado
Se receber 401 Unauthorized:
1. Redirecionar para login
2. Ou implementar refresh token (futuro)

### Dados não aparecem
1. Verificar se usuário configurou Bybit credentials
2. Verificar se sync foi executado
3. Verificar console por erros

---

## 📋 Convenções de Código

- **Componentes:** PascalCase (`MetricCard.tsx`)
- **Hooks:** camelCase com prefixo `use` (`useAuth.ts`)
- **Tipos:** Interfaces em PascalCase, no arquivo `types/index.ts`
- **Estilos:** Tailwind classes, evitar CSS modules
- **Imports:** Usar `@/` para imports absolutos (configurado no tsconfig)

---

## 📝 Status das Integrações

### ✅ Integrações Concluídas

- [x] **DashboardView.tsx**
  - [x] Buscar `/dashboard/summary`
  - [x] Buscar `/positions` (posições abertas)
  - [x] Buscar `/transactions` (últimas 5)
  
- [x] **PosicoesView.tsx**
  - [x] Buscar `/positions` (todas)
  - [x] Buscar `/positions/summary`
  - [x] Auto-refresh a cada 30 segundos
  
- [x] **CurvasView.tsx**
  - [x] Buscar `/dashboard/equity-curve` (com filtro de período)
  - [x] Buscar `/dashboard/performance` (métricas calculadas)
  - [x] Gráfico Equity Curve (USD vs BTC)
  - [x] Gráfico PnL Acumulado
  
- [x] **FundingView.tsx**
  - [x] Buscar `/funding/summary`
  - [x] Breakdown por ativo
  
- [x] **TaxasView.tsx**
  - [x] Buscar `/fees/summary`
  - [x] Breakdown Maker vs Taker
  
- [x] **HistoricoView.tsx**
  - [x] Buscar `/transactions` (com paginação)
  - [x] Buscar `/transactions/summary`
  - [x] Filtros por tipo e lado
  
- [x] **ConfiguracoesView.tsx**
  - [x] Form para `/users/bybit-credentials`
  - [x] Mostrar `/users/me`
  - [x] Botão para `/sync`
  - [x] Mostrar `/sync/status`
  - [x] Testar conexão com Bybit
  - [x] Remover credenciais

- [x] **App.tsx**
  - [x] Verificar autenticação no startup
  - [x] Adicionar rotas de login/register (AuthView)
  - [x] Proteger rotas autenticadas

### 📁 Hooks Criados

| Hook | Descrição |
|------|-----------|
| `useAuth.ts` | Autenticação (login, register, logout) |
| `useDashboard.ts` | Dashboard (summary, equity-curve, performance) |
| `usePositions.ts` | Posições abertas |
| `useTransactions.ts` | Histórico de transações |
| `useFunding.ts` | Funding rates |
| `useFees.ts` | Taxas de trading |

---

## 🔗 Links Úteis

- **shadcn/ui:** https://ui.shadcn.com/docs
- **TailwindCSS:** https://tailwindcss.com/docs
- **React:** https://react.dev
- **Vite:** https://vitejs.dev/guide
- **API Backend:** Ver `/Users/n4matos/projects/visor-crypto-api/AGENTS.md`

---

**Última atualização:** 2026-02-01  
**Status:** Todas as integrações concluídas ✅  
**Responsável:** @n4matos
