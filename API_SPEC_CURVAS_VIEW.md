# Especificação Técnica - API para Tela de Curvas de Crescimento

> **Destinatário:** LLM Backend (Go/Echo/PostgreSQL)  
> **Contexto:** Dashboard de Trading Crypto - Integração Bybit  
> **Prioridade:** ALTA - Tela mais importante do sistema

---

## 📊 Visão Geral da Tela

A tela **Curvas de Crescimento** exibe a evolução do patrimônio do trader ao longo do tempo, com foco em:
1. **Equity Curve** - Patrimônio em USD vs BTC ao longo do tempo
2. **PnL Acumulado** - Lucro/prejuízo cumulativo
3. **Métricas de Performance** - Estatísticas calculadas a partir dos trades

---

## 🔌 Endpoints Necessários

### 1. `GET /api/v1/dashboard/equity-curve`

**Objetivo:** Retornar dados históricos do patrimônio para plotar os gráficos.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `period` | string | Não | Período de filtro: `24h`, `7d`, `30d`, `90d`, `1y`, `all` (padrão: `all`) |

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "points": [
      {
        "date": "2026-01-01T00:00:00Z",     // ISO 8601
        "equityUSD": 10000.00,              // Patrimônio em USD no dia
        "equityBTC": 0.25,                  // Patrimônio em BTC no dia
        "pnlCumulative": 0.00               // PnL acumulado até o dia
      },
      {
        "date": "2026-01-02T00:00:00Z",
        "equityUSD": 10250.50,
        "equityBTC": 0.251,
        "pnlCumulative": 250.50
      }
      // ... mais pontos
    ],
    "metadata": {
      "totalPoints": 365,
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-01-31T00:00:00Z"
    }
  }
}
```

**Notas de Implementação:**
- Deve retornar dados diários (um ponto por dia)
- Se não houver transações em um dia, interpolar ou repetir o valor anterior
- O campo `pnlCumulative` é calculado: soma de todos os PnLs realizados até aquele dia
- `equityBTC` deve ser calculado convertendo o equity USD para BTC pelo preço do BTC no dia

---

### 2. `GET /api/v1/dashboard/performance-metrics`

**Objetivo:** Retornar métricas de performance calculadas a partir do histórico de trades.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `period` | string | Não | Período: `24h`, `7d`, `30d`, `90d`, `1y`, `all` (padrão: `all`) |

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "totalReturn": 25.5,           // Retorno total em %
    "maxDrawdown": -12.3,          // Drawdown máximo em % (negativo)
    "volatility": 15.8,            // Volatilidade anualizada em %
    "sharpeRatio": 1.62,           // Ratio de Sharpe
    "winRate": 58.5,               // Taxa de acerto em %
    "profitFactor": 1.85,          // Fator de lucro (lucro bruto / perda bruta)
    "averageTrade": 125.50,        // Média de lucro/prejuízo por trade
    "bestTrade": 2500.00,          // Melhor trade em USD
    "worstTrade": -800.00,         // Pior trade em USD
    "totalTrades": 150,            // Total de trades no período
    "winningTrades": 88,           // Trades vencedores
    "losingTrades": 62             // Trades perdedores
  }
}
```

**Fórmulas de Cálculo:**

```go
// Total Return (%)
totalReturn = ((equityFinal - equityInicial) / equityInicial) * 100

// Max Drawdown (%)
// Maior queda desde o pico até o vale
maxDrawdown = min((equity - peakEquity) / peakEquity * 100)

// Volatilidade (%)
// Desvio padrão dos retornos diários, anualizado
volatility = stdDev(dailyReturns) * sqrt(365)

// Sharpe Ratio
// Retorno em excesso / volatilidade (assumir risk-free rate = 0 para simplificar)
sharpeRatio = (totalReturn / 100) / (volatility / 100)

// Win Rate (%)
winRate = (winningTrades / totalTrades) * 100

// Profit Factor
profitFactor = grossProfit / abs(grossLoss)

// Average Trade
averageTrade = totalPnL / totalTrades
```

---

### 3. `GET /api/v1/dashboard/summary` (ATUALIZAR se existir)

**Objetivo:** Retornar resumo rápido para cards do dashboard.

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "currentEquityUSD": 12500.00,
    "currentEquityBTC": 0.312,
    "totalReturnUSD": 25.0,
    "totalReturnBTC": 24.8,
    "todayPnL": 150.50,
    "weekPnL": 850.00,
    "monthPnL": 2500.00,
    "openPositions": 3,
    "totalPositions": 15
  }
}
```

---

## 🗄️ Schema de Dados (Banco)

### Tabela: `daily_equity_snapshots`
Armazena snapshot diário do patrimônio para performance.

```sql
CREATE TABLE daily_equity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    equity_usd DECIMAL(18, 8) NOT NULL,
    equity_btc DECIMAL(18, 8) NOT NULL,
    pnl_cumulative DECIMAL(18, 8) NOT NULL DEFAULT 0,
    btc_price DECIMAL(18, 8),         -- Preço do BTC no dia (para conversão)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_equity_user_date ON daily_equity_snapshots(user_id, date);
```

### Tabela: `trades` ou `transactions` (deve existir)
```sql
-- Já deve existir para sincronização da Bybit
-- Campos necessários para métricas:
-- - symbol (BTCUSDT, ETHUSDT, etc)
-- - side (Buy/Sell)
-- - qty (quantidade)
-- - price (preço de execução)
-- - fee (taxa)
-- - realized_pnl (PnL realizado no trade)
-- - executed_at (data/hora)
```

---

## 🔄 Lógica de Cálculo

### Como calcular o Equity Curve

1. **Agrupar trades por dia** a partir da tabela `transactions`
2. **Calcular PnL diário:**
   ```
   dailyPnL = SUM(realized_pnl) - SUM(fee) WHERE DATE(executed_at) = date
   ```
3. **Calcular PnL cumulativo:**
   ```
   pnlCumulative[day] = pnlCumulative[day-1] + dailyPnL[day]
   ```
4. **Calcular Equity USD:**
   ```
   equityUSD[day] = initialEquity + pnlCumulative[day]
   ```
5. **Calcular Equity BTC:**
   ```
   equityBTC[day] = equityUSD[day] / btcPrice[day]
   ```

### Como calcular Métricas de Performance

```go
// Buscar todos os trades do período
trades := getTrades(userID, startDate, endDate)

// Agrupar em winning/losing
totalTrades = len(trades)
winningTrades = count(trades WHERE realized_pnl > 0)
losingTrades = count(trades WHERE realized_pnl < 0)

// Cálculos
grossProfit = sum(realized_pnl WHERE realized_pnl > 0)
grossLoss = sum(realized_pnl WHERE realized_pnl < 0)
totalPnL = sum(realized_pnl) - sum(fee)

profitFactor = grossProfit / abs(grossLoss)
winRate = float64(winningTrades) / float64(totalTrades) * 100
averageTrade = totalPnL / float64(totalTrades)

// Melhor/Pior trade
bestTrade = max(realized_pnl)
worstTrade = min(realized_pnl)
```

---

## ⏱️ Otimização de Performance

### Problema
Calcular equity curve em tempo real pode ser lento com muitos trades.

### Solução: Materialização

1. **Criar snapshots diários** durante a sincronização (`/sync`)
2. **Atualizar apenas o dia atual** em tempo real
3. **Endpoints lerem da tabela `daily_equity_snapshots`** (muito rápido)

### Fluxo de Atualização

```
1. Sincronização Bybit (/sync)
   ↓
2. Para cada trade novo:
   - Atualizar equity do dia
   - Recalcular métricas
   ↓
3. Salvar na tabela daily_equity_snapshots
```

---

## 🔒 Segurança

- Todos os endpoints devem exigir autenticação JWT
- Filtrar SEMPRE por `user_id` (nunca retornar dados de outros usuários)
- Validar período máximo (evitar consultas muito pesadas)

---

## ✅ Critérios de Aceitação

1. [ ] Endpoint `/dashboard/equity-curve` retorna dados diários corretos
2. [ ] Endpoint `/dashboard/performance-metrics` calcula todas as métricas
3. [ ] Filtro por período funciona (`24h`, `7d`, `30d`, `90d`, `1y`, `all`)
4. [ ] Dados estão corretos após sincronização da Bybit
5. [ ] Performance aceitável (< 500ms para 1 ano de dados)

---

## 📝 Exemplo de Uso (Frontend)

```typescript
// Buscar equity curve
const response = await fetch(
  '/api/v1/dashboard/equity-curve?period=90d',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const data = await response.json();

// data.data.points = [
//   { date: "2026-01-01", equityUSD: 10000, equityBTC: 0.25, pnlCumulative: 0 },
//   ...
// ]
```

---

## ❓ Dúvidas Frequentes

**Q: E se o usuário não tiver trades ainda?**  
A: Retornar array vazio `[]` ou dados zerados.

**Q: Como calcular equityBTC?**  
A: `equityUSD / precoBTCdoDia`. Usar preço de fechamento diário da Bybit.

**Q: E se tiver gaps (dias sem trades)?**  
A: Preencher com o último equity conhecido (forward fill).

**Q: Qual timezone usar?**  
A: UTC para armazenar, frontend converte para local.

---

**Última atualização:** 2026-02-01  
**Responsável:** Frontend Team
