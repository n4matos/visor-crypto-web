# Visor Crypto API - Especificacao Completa para Frontend

> **Destinatario:** LLM Frontend
> **Base URL:** `http://localhost:8080/api/v1`
> **Autenticacao:** JWT Bearer Token no header `Authorization: Bearer <token>`
> **Formato:** Todas as respostas seguem o envelope `{ "success": bool, "data": ..., "error": string }`

---

## Autenticacao

Todos os endpoints (exceto register e login) exigem o header:
```
Authorization: Bearer <jwt_token>
```

O token expira em 24 horas. Em caso de `401 Unauthorized`, o frontend deve redirecionar para login.

---

## 1. Auth

### `POST /api/v1/auth/register`

Cria um novo usuario.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "minimo8chars"
}
```

**Validacoes:** email obrigatorio e valido, password obrigatorio min 8 chars.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "is_active": true,
      "last_sync_at": null,
      "created_at": "2026-01-15T10:00:00Z",
      "has_bybit_credentials": false
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### `POST /api/v1/auth/login`

Autentica um usuario existente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "minimo8chars"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "is_active": true,
      "last_sync_at": "2026-01-31T18:00:00Z",
      "created_at": "2026-01-15T10:00:00Z",
      "has_bybit_credentials": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 2. Usuario

### `GET /api/v1/users/me`

Retorna dados do usuario autenticado.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "is_active": true,
    "last_sync_at": "2026-01-31T18:00:00Z",
    "created_at": "2026-01-15T10:00:00Z",
    "has_bybit_credentials": true
  }
}
```

---

### `GET /api/v1/users/bybit-credentials`

Retorna credenciais Bybit mascaradas.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "api_key": "****Ab1C",
    "updated_at": "2026-01-20T14:00:00Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Credentials not found"
}
```

---

### `PUT /api/v1/users/bybit-credentials`

Cria ou atualiza credenciais Bybit.

**Request Body:**
```json
{
  "api_key": "BYBIT_API_KEY_AQUI",
  "secret": "BYBIT_API_SECRET_AQUI"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Credentials updated successfully"
  }
}
```

---

### `DELETE /api/v1/users/bybit-credentials`

Remove credenciais Bybit do usuario.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Credentials removed successfully"
  }
}
```

---

### `POST /api/v1/users/test-bybit-connection`

Testa a conexao com a Bybit usando as credenciais armazenadas.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "available": "1500.50",
      "total": "2500.00"
    },
    "message": "Connection successful"
  }
}
```

**Possiveis erros:**
- `400` - Credenciais nao configuradas ou conexao falhou
- `401` - API key/secret invalidos
- `403` - IP nao whitelisted na Bybit

---

## 3. Dashboard (Tela Curvas de Crescimento)

### `GET /api/v1/dashboard/summary`

Retorna resumo do dashboard para cards principais.

**Response 200:**
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

**Descricao dos campos:**

| Campo | Tipo | Descricao |
|---|---|---|
| `currentEquityUSD` | `number` | Patrimonio total atual em USD (obtido da Bybit em tempo real) |
| `currentEquityBTC` | `number` | Patrimonio total atual convertido em BTC |
| `totalReturnUSD` | `number` | Retorno total em % desde o primeiro registro (USD) |
| `totalReturnBTC` | `number` | Retorno total em % desde o primeiro registro (BTC) |
| `todayPnL` | `number` | PnL realizado hoje em USD |
| `weekPnL` | `number` | PnL realizado nos ultimos 7 dias em USD |
| `monthPnL` | `number` | PnL realizado nos ultimos 30 dias em USD |
| `openPositions` | `integer` | Quantidade de posicoes abertas agora |
| `totalPositions` | `integer` | Total de trades historicos |

**Cache:** 5 minutos. Invalido automaticamente apos sync.

**Quando usuario nao tem credenciais Bybit:** Todos os valores retornam `0`.

---

### `GET /api/v1/dashboard/equity-curve`

Retorna dados historicos do patrimonio para plotar graficos (equity curve).

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Valores |
|---|---|---|---|---|
| `period` | `string` | Nao | `all` | `24h`, `7d`, `30d`, `90d`, `1y`, `all` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "points": [
      {
        "date": "2026-01-01T00:00:00Z",
        "equityUSD": 10000.00,
        "equityBTC": 0.25,
        "pnlCumulative": 0.00
      },
      {
        "date": "2026-01-02T00:00:00Z",
        "equityUSD": 10250.50,
        "equityBTC": 0.251,
        "pnlCumulative": 250.50
      },
      {
        "date": "2026-01-03T00:00:00Z",
        "equityUSD": 10100.00,
        "equityBTC": 0.248,
        "pnlCumulative": 100.00
      }
    ],
    "metadata": {
      "totalPoints": 3,
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-01-03T00:00:00Z"
    }
  }
}
```

**Descricao dos campos em `points[]`:**

| Campo | Tipo | Descricao |
|---|---|---|
| `date` | `string` (ISO 8601) | Data do snapshot (um ponto por dia, em UTC) |
| `equityUSD` | `number` | Patrimonio total em USD naquele dia |
| `equityBTC` | `number` | Patrimonio convertido em BTC pelo preco do dia |
| `pnlCumulative` | `number` | PnL acumulado em USD desde o inicio |

**Descricao dos campos em `metadata`:**

| Campo | Tipo | Descricao |
|---|---|---|
| `totalPoints` | `integer` | Quantidade de pontos retornados |
| `startDate` | `string` (ISO 8601) | Data do primeiro ponto |
| `endDate` | `string` (ISO 8601) | Data do ultimo ponto |

**Comportamentos importantes:**
- Retorna um ponto por dia
- Dias sem trades repetem o valor do dia anterior (forward fill)
- `pnlCumulative` e a soma de todos os PnLs realizados ate aquele dia
- Se o usuario nao tem dados, retorna `points: []` com `totalPoints: 0`
- **Cache:** 10 minutos

**Response 400 (periodo invalido):**
```json
{
  "success": false,
  "error": "Invalid period. Use: 24h, 7d, 30d, 90d, 1y, all"
}
```

---

### `GET /api/v1/dashboard/performance`

Retorna metricas de performance calculadas a partir do historico de trades.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Valores |
|---|---|---|---|---|
| `period` | `string` | Nao | `all` | `24h`, `7d`, `30d`, `90d`, `1y`, `all` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalReturn": 25.5,
    "maxDrawdown": -12.3,
    "volatility": 15.8,
    "sharpeRatio": 1.62,
    "winRate": 58.5,
    "profitFactor": 1.85,
    "averageTrade": 125.50,
    "bestTrade": 2500.00,
    "worstTrade": -800.00,
    "totalTrades": 150,
    "winningTrades": 88,
    "losingTrades": 62
  }
}
```

**Descricao dos campos:**

| Campo | Tipo | Unidade | Descricao |
|---|---|---|---|
| `totalReturn` | `number` | `%` | Retorno total do patrimonio no periodo |
| `maxDrawdown` | `number` | `%` | Maior queda do pico ao vale (valor negativo) |
| `volatility` | `number` | `%` | Volatilidade anualizada dos retornos diarios |
| `sharpeRatio` | `number` | ratio | Retorno em excesso / volatilidade (risk-free = 0) |
| `winRate` | `number` | `%` | Percentual de trades vencedores |
| `profitFactor` | `number` | ratio | Lucro bruto / perda bruta |
| `averageTrade` | `number` | `USD` | Media de lucro/prejuizo por trade |
| `bestTrade` | `number` | `USD` | Melhor trade no periodo |
| `worstTrade` | `number` | `USD` | Pior trade no periodo (valor negativo) |
| `totalTrades` | `integer` | count | Total de trades no periodo |
| `winningTrades` | `integer` | count | Trades vencedores |
| `losingTrades` | `integer` | count | Trades perdedores |

**Quando nao ha dados:** Todos os valores retornam `0`.

---

## 4. Transacoes

### `GET /api/v1/transactions`

Lista transacoes do usuario com paginacao e filtros.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `limit` | `integer` | Nao | `20` | Itens por pagina (1-100) |
| `offset` | `integer` | Nao | `0` | Deslocamento para paginacao |
| `symbol` | `string` | Nao | - | Filtrar por par (ex: `BTCUSDT`) |
| `type` | `string` | Nao | - | Filtrar por tipo: `TRADE`, `SETTLEMENT`, `FEE`, `TRANSFER`, `REBATE`, `BONUS` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "bybit_id": "bybit-tx-id",
      "symbol": "BTCUSDT",
      "side": "Buy",
      "type": "TRADE",
      "qty": "0.001",
      "price": "42000.50",
      "fee": "0.042",
      "funding": "0",
      "currency": "USDT",
      "executed_at": "2026-01-31T14:30:00Z",
      "created_at": "2026-01-31T14:31:00Z"
    }
  ]
}
```

**Descricao dos campos:**

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `string` (UUID) | ID interno |
| `bybit_id` | `string` | ID original na Bybit |
| `symbol` | `string` | Par de trading (ex: `BTCUSDT`, `ETHUSDT`) |
| `side` | `string` | `"Buy"` ou `"Sell"` |
| `type` | `string` | `"TRADE"`, `"SETTLEMENT"`, `"FEE"`, `"TRANSFER"`, `"REBATE"`, `"BONUS"` |
| `qty` | `string` | Quantidade (string para precisao decimal) |
| `price` | `string` | Preco de execucao |
| `fee` | `string` | Taxa cobrada (positivo = custo) |
| `funding` | `string` | Funding fee (positivo = recebeu, negativo = pagou) |
| `currency` | `string` | Moeda da transacao |
| `executed_at` | `string` (ISO 8601) | Data/hora de execucao na Bybit |

**Nota:** `qty`, `price`, `fee`, `funding` sao retornados como string para manter a precisao decimal. O frontend deve converter para numero ao exibir.

---

### `GET /api/v1/transactions/summary`

Retorna estatisticas agregadas de trades.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Valores |
|---|---|---|---|---|
| `period` | `string` | Nao | `30d` | `24h`, `7d`, `30d`, `90d`, `1y`, `all` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_trades": 150,
    "win_count": 88,
    "loss_count": 62,
    "win_rate": 58.67,
    "total_pnl": "18750.50",
    "total_fees": "425.30",
    "total_funding": "-120.00",
    "avg_win": "325.00",
    "avg_loss": "-180.50",
    "profit_factor": 1.85,
    "best_trade": "2500.00",
    "worst_trade": "-800.00"
  }
}
```

---

## 5. Posicoes

### `GET /api/v1/positions`

Retorna posicoes abertas em tempo real (sincroniza com a Bybit ao chamar).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "symbol": "BTCUSDT",
      "side": "LONG",
      "leverage": "10",
      "size": "0.5",
      "entry_price": "42000.00",
      "mark_price": "42500.00",
      "unrealized_pnl": "250.00",
      "unrealized_pnl_pct": "1.19",
      "margin": "2100.00",
      "liquidation_price": "38000.00",
      "funding_rate": "0",
      "funding_interval": "",
      "updated_at": "2026-01-31T18:00:00Z"
    }
  ]
}
```

**Descricao dos campos:**

| Campo | Tipo | Descricao |
|---|---|---|
| `symbol` | `string` | Par de trading |
| `side` | `string` | `"LONG"` ou `"SHORT"` |
| `leverage` | `string` | Alavancagem da posicao |
| `size` | `string` | Tamanho da posicao |
| `entry_price` | `string` | Preco medio de entrada |
| `mark_price` | `string` | Preco de mercado atual |
| `unrealized_pnl` | `string` | PnL nao realizado em USD |
| `unrealized_pnl_pct` | `string` | PnL nao realizado em % |
| `margin` | `string` | Margem alocada |
| `liquidation_price` | `string` | Preco estimado de liquidacao |

**Cache:** 1 minuto.

**Se nao tem posicoes abertas:** Retorna `data: []`.

---

### `GET /api/v1/positions/summary`

Retorna resumo agregado das posicoes abertas.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_pnl": 0,
    "total_margin": 0,
    "long_count": 0,
    "short_count": 0
  }
}
```

---

## 6. Funding

### `GET /api/v1/funding/summary`

Retorna resumo de funding rates por symbol.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "today": "-5.20",
      "week": "-32.50",
      "month": "-120.00",
      "total": "-450.80"
    },
    {
      "symbol": "ETHUSDT",
      "today": "2.10",
      "week": "15.30",
      "month": "48.00",
      "total": "180.50"
    }
  ]
}
```

**Nota:** Valores positivos = recebeu funding, negativos = pagou.

---

## 7. Fees

### `GET /api/v1/fees/summary`

Retorna resumo de fees pagas.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "maker_total": "127.59",
    "taker_total": "297.71",
    "maker_percent": 30.0,
    "taker_percent": 70.0
  }
}
```

---

## 8. Sincronizacao

### `POST /api/v1/sync`

Dispara sincronizacao manual com a Bybit. A sincronizacao roda em background.

**Response 202:**
```json
{
  "success": true,
  "data": {
    "message": "Sync started",
    "status": "pending",
    "task_id": "asynq-task-id"
  }
}
```

**Nota:** O sync roda de forma assincrona. Use o endpoint de status para acompanhar.

---

### `GET /api/v1/sync/status`

Retorna status da ultima sincronizacao.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "last_sync_at": "2026-01-31T18:00:00Z",
    "last_transaction_at": "2026-01-31T17:45:00Z",
    "message": "Last sync completed",
    "is_syncing": false
  }
}
```

**Valores de `status`:** `"idle"` (nunca sincronizou) | `"completed"` (ultima sync concluida)

---

## Referencia de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "success": false,
  "error": "Mensagem descritiva do erro"
}
```

| HTTP Status | Significado | Acao no Frontend |
|---|---|---|
| `400` | Request invalida (parametros errados) | Mostrar mensagem de erro |
| `401` | Token expirado ou ausente | Redirecionar para login |
| `403` | Sem permissao | Mostrar mensagem |
| `404` | Recurso nao encontrado | Mostrar estado vazio |
| `500` | Erro interno do servidor | Mostrar mensagem generica |

---

## Tipos Numericos

| Tipo no JSON | Quando | Como tratar |
|---|---|---|
| `number` (float) | Metricas calculadas, percentuais | Usar diretamente |
| `string` (decimal) | Valores financeiros (`qty`, `price`, `fee`, etc.) | Converter com parseFloat ou lib decimal |

Todos os valores monetarios strings usam `.` como separador decimal, sem separador de milhar.

---

## Periodos Disponiveis

Usado nos query params `?period=`:

| Valor | Descricao |
|---|---|
| `24h` | Ultimas 24 horas |
| `7d` | Ultimos 7 dias |
| `30d` | Ultimos 30 dias |
| `90d` | Ultimos 90 dias |
| `1y` | Ultimo ano |
| `all` | Todo o historico |

---

## Fluxo de Onboarding (ordem recomendada)

1. `POST /auth/register` - Criar conta
2. `PUT /users/bybit-credentials` - Configurar API keys da Bybit
3. `POST /users/test-bybit-connection` - Validar conexao
4. `POST /sync` - Disparar primeira sincronizacao
5. `GET /sync/status` - Aguardar conclusao (polling)
6. `GET /dashboard/summary` - Exibir dados

---

## Fluxo da Tela Curvas de Crescimento

Ao montar a tela, fazer as 3 chamadas em paralelo:

```typescript
const [summary, equityCurve, performance] = await Promise.all([
  fetch('/api/v1/dashboard/summary', { headers }),
  fetch('/api/v1/dashboard/equity-curve?period=90d', { headers }),
  fetch('/api/v1/dashboard/performance?period=90d', { headers }),
]);
```

- **Cards superiores:** Usar dados do `summary`
- **Grafico equity curve:** Usar `equityCurve.data.points` (eixo X = `date`, eixo Y = `equityUSD` ou `equityBTC`)
- **Grafico PnL acumulado:** Usar `equityCurve.data.points` (eixo Y = `pnlCumulative`)
- **Metricas de performance:** Usar dados do `performance`

Ao trocar o filtro de periodo, refazer as chamadas de `equity-curve` e `performance` com o novo `?period=`.

O `summary` nao depende do periodo (sempre retorna valores atuais e fixos: today, week, month).
