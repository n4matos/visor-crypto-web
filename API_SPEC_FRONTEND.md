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

### `GET /api/v1/users/bybit-credentials` (Legacy - Deprecated)

Retorna credenciais Bybit mascaradas. **Usar `/api/v1/credentials` no lugar.**

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

### `PUT /api/v1/users/bybit-credentials` (Legacy - Deprecated)

Cria ou atualiza credenciais Bybit. **Usar `/api/v1/credentials` no lugar.**

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

### `DELETE /api/v1/users/bybit-credentials` (Legacy - Deprecated)

Remove credenciais Bybit do usuario. **Usar `/api/v1/credentials/:id` no lugar.**

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

### `POST /api/v1/users/test-bybit-connection` (Legacy - Deprecated)

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

## 3. Credenciais (Multi-Account)

Endpoints para gerenciar multiplas contas Bybit (portfolios).

### `GET /api/v1/credentials`

Lista todas as credenciais do usuario.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e2a596ef-d0f2-480d-835f-6a0a21a5e03c",
      "user_id": "a4bbb02c-94fb-40ea-9053-fd86c445050e",
      "label": "Principal",
      "exchange": "Bybit",
      "api_key": "****SOME",
      "is_active": true,
      "last_sync_at": "2026-02-03T14:30:00Z",
      "total_equity": "12500.50",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-03T14:30:00Z"
    },
    {
      "id": "59cc57a2-e840-48bc-9e18-604ccf3eeb4c",
      "user_id": "a4bbb02c-94fb-40ea-9053-fd86c445050e",
      "label": "Bot Trading",
      "exchange": "Bybit",
      "api_key": "****KEY2",
      "is_active": true,
      "last_sync_at": null,
      "total_equity": "0",
      "created_at": "2026-02-01T11:00:00Z",
      "updated_at": "2026-02-01T11:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/credentials`

Cria uma nova credencial Bybit.

**Request Body:**
```json
{
  "label": "Minha Conta",
  "exchange": "Bybit",
  "api_key": "BYBIT_API_KEY_AQUI",
  "secret": "BYBIT_API_SECRET_AQUI"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "label": "Minha Conta",
    "exchange": "Bybit",
    "api_key": "****YHER",
    "is_active": true,
    "last_sync_at": null,
    "total_equity": "0",
    "created_at": "2026-02-03T10:00:00Z",
    "updated_at": "2026-02-03T10:00:00Z"
  }
}
```

---

### `GET /api/v1/credentials/:id`

Retorna detalhes de uma credencial especifica.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "e2a596ef-d0f2-480d-835f-6a0a21a5e03c",
    "user_id": "a4bbb02c-94fb-40ea-9053-fd86c445050e",
    "label": "Principal",
    "exchange": "Bybit",
    "api_key": "****SOME",
    "is_active": true,
    "last_sync_at": "2026-02-03T14:30:00Z",
    "total_equity": "12500.50",
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-03T14:30:00Z"
  }
}
```

---

### `PUT /api/v1/credentials/:id`

Atualiza uma credencial existente.

**Request Body:**
```json
{
  "label": "Novo Nome",
  "api_key": "NOVA_API_KEY",
  "secret": "NOVO_SECRET",
  "is_active": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "e2a596ef-d0f2-480d-835f-6a0a21a5e03c",
    "label": "Novo Nome",
    "exchange": "Bybit",
    "api_key": "****YHER",
    "is_active": true,
    "last_sync_at": "2026-02-03T14:30:00Z",
    "total_equity": "12500.50",
    "updated_at": "2026-02-03T15:00:00Z"
  }
}
```

---

### `PATCH /api/v1/credentials/:id`

Atualizacao parcial de uma credencial (mesma funcao do PUT, para compatibilidade com frontend).

**Request Body:** (mesmo do PUT)

**Response:** (mesmo do PUT)

---

### `DELETE /api/v1/credentials/:id`

Remove uma credencial. Todas as transacoes associadas serao removidas (CASCADE).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Credential deleted successfully"
  }
}
```

---

### `POST /api/v1/credentials/:id/test`

Testa a conexao com a Bybit para uma credencial especifica.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Connection successful",
    "account_type": "UNIFIED",
    "total_equity": "12500.50"
  }
}
```

**Response 400 (falha na conexao):**
```json
{
  "success": true,
  "data": {
    "success": false,
    "message": "Invalid API key or secret"
  }
}
```

---

### `POST /api/v1/credentials/test`

Testa credenciais da Bybit **sem salvar** no banco.

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
    "success": true,
    "message": "Connection successful",
    "account_type": "UNIFIED",
    "total_equity": "12500.50"
  }
}
```

---

### `POST /api/v1/credentials/:id/sync`

Dispara sincronizacao manual para uma credencial especifica.

**Response 202:**
```json
{
  "success": true,
  "data": {
    "message": "Sync started for credential",
    "credential_id": "e2a596ef-d0f2-480d-835f-6a0a21a5e03c"
  }
}
```

---

## 4. Dashboard (Tela Curvas de Crescimento)

### `GET /api/v1/dashboard/summary`

Retorna resumo do dashboard para cards principais.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

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
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

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
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

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

## 5. Transacoes

### `GET /api/v1/transactions`

Lista transacoes do usuario com paginacao e filtros.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `limit` | `integer` | Nao | `20` | Itens por pagina (1-100) |
| `offset` | `integer` | Nao | `0` | Deslocamento para paginacao |
| `symbol` | `string` | Nao | - | Filtrar por par (ex: `BTCUSDT`) |
| `type` | `string` | Nao | - | Filtrar por tipo: `TRADE`, `SETTLEMENT`, `FEE`, `TRANSFER`, `REBATE`, `BONUS` |
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "credential_id": "e2a596ef-d0f2-480d-835f-6a0a21a5e03c",
      "bybit_id": "bybit-tx-id",
      "symbol": "BTCUSDT",
      "side": "Buy",
      "type": "TRADE",
      "qty": "0.001",
      "price": "42000.50",
      "fee": "0.042",
      "funding": "0",
      "cash_flow": "42.0005",
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
| `credential_id` | `string` (UUID) | ID da credencial (conta) associada |
| `bybit_id` | `string` | ID original na Bybit |
| `symbol` | `string` | Par de trading (ex: `BTCUSDT`, `ETHUSDT`) |
| `side` | `string` | `"Buy"` ou `"Sell"` |
| `type` | `string` | `"TRADE"`, `"SETTLEMENT"`, `"FEE"`, `"TRANSFER"`, `"REBATE"`, `"BONUS"` |
| `qty` | `string` | Quantidade (string para precisao decimal) |
| `price` | `string` | Preco de execucao |
| `fee` | `string` | Taxa cobrada (positivo = custo) |
| `funding` | `string` | Funding fee (positivo = recebeu, negativo = pagou) |
| `cash_flow` | `string` | Fluxo de caixa real (PnL) |
| `currency` | `string` | Moeda da transacao |
| `executed_at` | `string` (ISO 8601) | Data/hora de execucao na Bybit |

**Nota:** `qty`, `price`, `fee`, `funding`, `cash_flow` sao retornados como string para manter a precisao decimal. O frontend deve converter para numero ao exibir.

---

### `GET /api/v1/transactions/summary`

Retorna estatisticas agregadas de trades.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Valores |
|---|---|---|---|---|
| `period` | `string` | Nao | `30d` | `24h`, `7d`, `30d`, `90d`, `1y`, `all` |
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

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

## 6. Posicoes

### `GET /api/v1/positions`

Retorna posicoes abertas em tempo real (sincroniza com a Bybit ao chamar).

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "credential_id": "e2a596ef-d0f2-480d-835f-6a0a21a5e03c",
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

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `credential_id` | `string` | Nao | Filtrar por credencial especifica (UUID) |

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

## 7. Funding

### `GET /api/v1/funding/summary`

Retorna resumo de funding rates por symbol.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `credential_id` | `string` | Nao | Filtrar por credencial especifica (UUID) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "currency": "USDT",
      "today": "-5.20",
      "week": "-32.50",
      "month": "-120.00",
      "total": "-450.80",
      "today_usdt": "0",
      "week_usdt": "0",
      "month_usdt": "0",
      "total_usdt": "0"
    },
    {
      "symbol": "ETHUSDT",
      "currency": "USDT",
      "today": "2.10",
      "week": "15.30",
      "month": "48.00",
      "total": "180.50",
      "today_usdt": "0",
      "week_usdt": "0",
      "month_usdt": "0",
      "total_usdt": "0"
    },
    {
      "symbol": "BTCUSD",
      "currency": "BTC",
      "today": "-0.00000123",
      "week": "0.00004567",
      "month": "0.00017890",
      "total": "0.00052341",
      "today_usdt": "0",
      "week_usdt": "0",
      "month_usdt": "0",
      "total_usdt": "0"
    }
  ]
}
```

**Notas:**
- Valores positivos = recebeu funding, negativos = pagou
- **`currency`**: Indica a moeda em que os valores de funding estão denominados:
  - Pares terminados em `USDT` (contratos lineares) → `currency: "USDT"`
  - Pares terminados em `USD` (contratos inversos) → `currency: "BTC"`, `"ETH"`, etc.
- Os campos `*_usdt` estao reservados para futura conversao automatica

---

### `GET /api/v1/funding/currencies`

Retorna todas as moedas que tem atividade de funding.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "currency": "USDT",
      "total_records": 107,
      "net_total": "-3.70978198"
    },
    {
      "currency": "BTC",
      "total_records": 186,
      "net_total": "0.00070199"
    },
    {
      "currency": "ETH",
      "total_records": 45,
      "net_total": "-0.00123456"
    }
  ]
}
```

**Descricao dos campos:**

| Campo | Tipo | Descricao |
|---|---|---|
| `currency` | `string` | Codigo da moeda (USDT, BTC, ETH, etc.) |
| `total_records` | `integer` | Quantidade de registros de funding |
| `net_total` | `string` | Total liquido de funding (recebido - pago) |

---

### `GET /api/v1/funding/timeseries`

Retorna time series de funding fee para uma moeda especifica. Ideal para graficos de linha.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `currency` | `string` | **Sim** | - | Moeda do funding (ex: `USDT`, `BTC`, `ETH`) |
| `group_by` | `string` | Nao | `day` | Agrupamento: `day`, `week`, `month` |
| `start_date` | `string` | Nao | - | Data inicial (formato: `YYYY-MM-DD`) |
| `end_date` | `string` | Nao | - | Data final (formato: `YYYY-MM-DD`) |
| `credential_id` | `string` | Nao | - | Filtrar por credencial especifica (UUID) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "currency": "USDT",
    "group_by": "day",
    "data": [
      {
        "date": "2026-02-01T00:00:00Z",
        "total_funding": "0.01114257",
        "funding_paid": "-0.46517272",
        "funding_received": "0.47631529",
        "transaction_count": 6,
        "symbols": ["BTCUSDT"]
      },
      {
        "date": "2026-02-02T00:00:00Z",
        "total_funding": "0.03605848",
        "funding_paid": "-0.77396376",
        "funding_received": "0.81002224",
        "transaction_count": 6,
        "symbols": ["BTCUSDT"]
      },
      {
        "date": "2026-02-03T00:00:00Z",
        "total_funding": "0.0036256",
        "funding_paid": "-0.59022977",
        "funding_received": "0.59385537",
        "transaction_count": 4,
        "symbols": ["BTCUSDT"]
      }
    ],
    "summary": {
      "total_net": "0.05082665",
      "total_paid": "-1.82936625",
      "total_received": "1.8801929",
      "period_start": "2026-02-01T00:00:00Z",
      "period_end": "2026-02-03T00:00:00Z"
    }
  }
}
```

**Descricao dos campos em `data[]`:**

| Campo | Tipo | Descricao |
|---|---|---|
| `date` | `string` (ISO 8601) | Data do ponto (dia/semana/mes) |
| `total_funding` | `string` | Valor liquido (recebido + pago) |
| `funding_paid` | `string` | Total pago em funding (negativo) |
| `funding_received` | `string` | Total recebido em funding (positivo) |
| `transaction_count` | `integer` | Quantidade de transacoes de funding |
| `symbols` | `string[]` | Lista de pares que tiveram funding |

**Descricao dos campos em `summary`:**

| Campo | Tipo | Descricao |
|---|---|---|
| `total_net` | `string` | Total liquido no periodo |
| `total_paid` | `string` | Total pago no periodo |
| `total_received` | `string` | Total recebido no periodo |
| `period_start` | `string` (ISO 8601) | Inicio do periodo |
| `period_end` | `string` (ISO 8601) | Fim do periodo |

**Dica para grafico:**
- Use `total_funding` para a linha principal
- Valores positivos (recebendo) = cor verde
- Valores negativos (pagando) = cor vermelha

**Response 400 (parametros invalidos):**
```json
{
  "success": false,
  "error": "Key: 'GetFundingTimeSeriesRequest.Currency' Error:Field validation for 'Currency' failed on the 'required' tag"
}
```

---

## 8. Fees

### `GET /api/v1/fees/summary`

Retorna resumo de fees pagas.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `credential_id` | `string` | Nao | Filtrar por credencial especifica (UUID) |

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

## 9. Wallet

### `GET /api/v1/wallet/balances`

Retorna saldos da carteira Bybit.

**Query Parameters:**

| Parametro | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `credential_id` | `string` | Nao | Filtrar por credencial especifica (UUID) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalEquity": "12500.50",
    "totalWalletBalance": "12000.00",
    "totalMarginBalance": "11800.00",
    "totalAvailableBalance": "8000.00",
    "assets": [
      {
        "coin": "USDT",
        "equity": "5000.50",
        "walletBalance": "4800.00",
        "availableBalance": "3000.00",
        "usdValue": "5000.50",
        "btcValue": "0.125",
        "unrealisedPnl": "200.50"
      },
      {
        "coin": "BTC",
        "equity": "0.15",
        "walletBalance": "0.15",
        "availableBalance": "0.05",
        "usdValue": "7500.00",
        "btcValue": "0.15",
        "unrealisedPnl": "100.00"
      }
    ]
  }
}
```

**Descricao dos campos:**

| Campo | Tipo | Descricao |
|---|---|---|
| `totalEquity` | `string` | Patrimonio total em USD |
| `totalWalletBalance` | `string` | Saldo total da wallet |
| `totalMarginBalance` | `string` | Saldo disponivel para margem |
| `totalAvailableBalance` | `string` | Saldo disponivel para trading |
| `assets` | `array` | Lista de ativos |
| `assets[].coin` | `string` | Codigo do ativo (USDT, BTC, ETH) |
| `assets[].equity` | `string` | Equity do ativo |
| `assets[].walletBalance` | `string` | Saldo na wallet |
| `assets[].availableBalance` | `string` | Saldo disponivel |
| `assets[].usdValue` | `string` | Valor em USD |
| `assets[].btcValue` | `string` | Valor em BTC |
| `assets[].unrealisedPnl` | `string` | PnL nao realizado |

---

## 10. Sincronizacao

### `POST /api/v1/sync`

Dispara sincronizacao manual com a Bybit para **todas** as credenciais ativas. A sincronizacao roda em background.

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
2. `POST /credentials` - Configurar API keys da Bybit (multi-account)
3. `POST /credentials/:id/test` - Validar conexao
4. `POST /credentials/:id/sync` - Disparar primeira sincronizacao
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

---

## Multi-Account (Multiplas Contas)

O sistema suporta multiplas credenciais Bybit por usuario (multi-account). Todos os endpoints de dados aceitam o parametro opcional `credential_id`.

### Fluxo recomendado:

1. Buscar credenciais disponiveis:
```typescript
const credentials = await fetch('/api/v1/credentials', { headers });
```

2. Usar o `id` da credencial selecionada em todas as chamadas:
```typescript
const summary = await fetch(
  `/api/v1/dashboard/summary?credential_id=${selectedCredentialId}`, 
  { headers }
);
```

3. Se nao informar `credential_id`, o endpoint retorna dados agregados de **todas** as credenciais ativas.
