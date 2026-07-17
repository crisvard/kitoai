# Guia de Implementação de APIs das Exchanges

Este documento descreve como adicionar a implementação real das APIs das exchanges ao CryptoHub.

## Estrutura de Arquivos

```
src/
├── config/
│   └── exchanges.ts           # Configurações de cada exchange
├── services/
│   └── exchange-api.ts        # Classes base e clientes específicos
├── hooks/
│   └── useExchangeApi.ts      # Hook React para usar os clientes
└── components/
    ├── Exchanges.tsx          # Interface de gerenciamento
    ├── Trading.tsx            # Interface de negociação
    └── Portfolio.tsx          # Visualização de portfólio
```

## Implementando uma Novaa Exchange

Para cada exchange, você precisa implementar os seguintes métodos na classe correspondente:

### 1. Binance (src/services/exchange-api.ts - BinanceClient)

```typescript
async getBalance(): Promise<Record<string, number>> {
  // GET /api/v3/account
  // Retorna: { BTC: 1.5, ETH: 10.2, ... }
}

async getMarketPrice(symbol: string): Promise<number> {
  // GET /api/v3/ticker/price?symbol=${symbol}USDT
  // Retorna o preço em USDT
}

async placeBuyOrder(symbol: string, quantity: number, price: number): Promise<string> {
  // POST /api/v3/order
  // Retorna: order ID
}

async placeSellOrder(symbol: string, quantity: number, price: number): Promise<string> {
  // POST /api/v3/order
  // Retorna: order ID
}

async getTransactionHistory(): Promise<Transaction[]> {
  // GET /api/v3/myTrades
  // Retorna array de transações
}

async getPortfolio(): Promise<Portfolio[]> {
  // GET /api/v3/account
  // Processa e retorna portfolio
}
```

**Documentação**: https://developers.binance.com/docs/

### 2. OKEx (src/services/exchange-api.ts - OKExClient)

```typescript
async getBalance(): Promise<Record<string, number>> {
  // GET /api/v5/account/balance
}

async getMarketPrice(symbol: string): Promise<number> {
  // GET /api/v5/market/ticker?instId=${symbol}-USDT
}

// ... outros métodos
```

**Documentação**: https://www.okx.com/docs-v5/en/

### 3. Gate.io (src/services/exchange-api.ts - GateioClient)

**Documentação**: https://www.gate.io/docs/apiv4/

### 4. Bybit (src/services/exchange-api.ts - BybitClient)

**Documentação**: https://bybit-exchange.github.io/docs/

### 5. MEXC (src/services/exchange-api.ts - MexcClient)

**Documentação**: https://mex-spot-api-docs.readthedocs.io/

### 6. Bitso (src/services/exchange-api.ts - BitsoClient)

**Documentação**: https://bitso.com/api/

### 7. Toro (src/services/exchange-api.ts - ToroClient)

**Documentação**: https://developers.toro.com/

## Usando a Hook useExchangeApi

Exemplo de uso em um componente:

```typescript
import { useExchangeApi } from '../hooks/useExchangeApi';

function MyComponent() {
  const {
    client,
    loading,
    error,
    balance,
    portfolio,
    initializeClient,
    fetchBalance,
    fetchPortfolio,
    placeBuyOrder,
  } = useExchangeApi();

  const handleConnect = (exchange: string, apiKey: string, apiSecret: string) => {
    initializeClient(exchange, apiKey, apiSecret);
  };

  const handleFetchData = async () => {
    await fetchBalance();
    await fetchPortfolio();
  };

  const handleBuyOrder = async (symbol: string, quantity: number, price: number) => {
    try {
      const orderId = await placeBuyOrder(symbol, quantity, price);
      console.log('Order placed:', orderId);
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  return (
    <div>
      {error && <p>Error: {error}</p>}
      {loading && <p>Loading...</p>}
      {balance && <p>Balance: {JSON.stringify(balance)}</p>}
    </div>
  );
}
```

## Assinatura das Requisições

Cada exchange requer uma forma específica de assinar as requisições. Use a biblioteca apropriada:

### Assinatura HMAC-SHA256 (Binance, OKEx, Bybit, MEXC, Bitso)

```typescript
import crypto from 'crypto';

function signRequest(
  method: string,
  path: string,
  query: string,
  body: string,
  secret: string
): string {
  const message = method + path + query + body;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}
```

## Requisitos de Segurança

1. **Nunca armazene API keys em tempo real sem criptografia**
2. **Use HTTPS para todas as requisições**
3. **Implemente rate limiting** de acordo com os limites de cada exchange
4. **Armazene credenciais no Supabase** com criptografia
5. **Implemente retry logic** com backoff exponencial

## Exemplo Completo: Implementar getBalance do Binance

```typescript
class BinanceClient extends BaseExchangeClient {
  constructor(apiKey: string, apiSecret: string) {
    super('Binance', apiKey, apiSecret, 'https://api.binance.com/api/v3');
  }

  async getBalance(): Promise<Record<string, number>> {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;

    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(query)
      .digest('hex');

    const data = await this.makeRequest(
      `/account?${query}&signature=${signature}`,
      'GET'
    );

    const balance: Record<string, number> = {};
    data.balances.forEach((bal: any) => {
      if (parseFloat(bal.free) > 0 || parseFloat(bal.locked) > 0) {
        balance[bal.asset] = parseFloat(bal.free) + parseFloat(bal.locked);
      }
    });

    return balance;
  }
}
```

## Testando as Implementações

Use o hook `useExchangeApi` em um componente de teste:

```typescript
const { initializeClient, fetchBalance } = useExchangeApi();

// Conectar com credenciais de teste
initializeClient('Binance', 'test-key', 'test-secret');

// Buscar saldo
await fetchBalance();
```

## Integração com Supabase

Para armazenar credenciais de forma segura:

```typescript
const { data, error } = await supabase
  .from('exchanges')
  .insert([
    {
      user_id: userId,
      name: 'Binance',
      api_key: encryptedKey,
      api_secret: encryptedSecret,
    },
  ]);
```

Use a biblioteca `crypto-js` ou similar para criptografia do lado do cliente.

## Próximos Passos

1. Escolha uma exchange para começar (recomenda-se Binance)
2. Implemente os 6 métodos principais
3. Teste usando a hook `useExchangeApi`
4. Integre com Supabase para persistência
5. Implemente as outras exchanges
6. Adicione sincronização automática e cache
