// API Binance para Criptomoedas
// Implementação real com autenticação HMAC

// Tipos
export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface Order {
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: number;
  origQty: number;
  executedQty: number;
  status: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED' | 'REJECTED';
  time: number;
  updateTime: number;
}

export interface Trade {
  id: number;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  commission: number;
  time: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

// Classe base para autenticação HMAC
class HMACAuthenticator {
  protected apiKey: string;
  protected apiSecret: string;
  protected baseUrl: string;

  constructor(apiKey: string, apiSecret: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  protected generateSignature(queryString: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  protected async makeAuthenticatedRequest(
    endpoint: string,
    method: string = 'GET',
    params: Record<string, any> = {}
  ): Promise<any> {
    const timestamp = Date.now();
    const recvWindow = 5000;
    
    // Ordenar parâmetros
    const sortedParams = Object.keys(params).sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const queryString = sortedParams 
      ? `${sortedParams}&timestamp=${timestamp}&recvWindow=${recvWindow}`
      : `timestamp=${timestamp}&recvWindow=${recvWindow}`;
    
    const signature = this.generateSignature(queryString);
    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || `API Error: ${response.status}`);
    }

    return response.json();
  }

  protected async makePublicRequest(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

// Cliente Binance
export class BinanceClient extends HMACAuthenticator {
  constructor(apiKey: string = '', apiSecret: string = '') {
    super(apiKey, apiSecret, 'https://api.binance.com');
  }

  // Obter saldo da conta
  async getBalance(): Promise<Balance[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key e secret são necessários');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/api/v3/account');
      
      return response.balances
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b: any) => ({
          asset: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
          total: parseFloat(b.free) + parseFloat(b.locked),
        }));
    } catch (error) {
      console.error('Erro ao obter saldo Binance:', error);
      throw error;
    }
  }

  // Obter preço de mercado de um símbolo
  async getTicker(symbol: string): Promise<Ticker> {
    const upperSymbol = symbol.toUpperCase();
    
    try {
      const response = await this.makePublicRequest('/api/v3/ticker/24hr', { symbol: upperSymbol });
      
      return {
        symbol: response.symbol,
        price: parseFloat(response.lastPrice),
        change24h: parseFloat(response.priceChange),
        changePercent24h: parseFloat(response.priceChangePercent),
        high24h: parseFloat(response.highPrice),
        low24h: parseFloat(response.lowPrice),
        volume24h: parseFloat(response.volume),
      };
    } catch (error) {
      console.error('Erro ao obter ticker:', error);
      throw error;
    }
  }

  // Obter preços de mercado de todos os símbolos
  async getAllTickers(): Promise<Ticker[]> {
    try {
      const response = await this.makePublicRequest('/api/v3/ticker/price');
      
      // Buscar dados adicionais para cada símbolo
      const tickers24h = await this.makePublicRequest('/api/v3/ticker/24hr');
      const tickerMap = new Map<string, any>(tickers24h.map((t: any) => [t.symbol, t]));

      return response
        .filter((t: any) => t.symbol.endsWith('USDT'))
        .map((t: any) => {
          const data = tickerMap.get(t.symbol);
          return {
            symbol: t.symbol,
            price: parseFloat(t.price),
            change24h: data ? parseFloat(data.priceChange) : 0,
            changePercent24h: data ? parseFloat(data.priceChangePercent) : 0,
            high24h: data ? parseFloat(data.highPrice) : 0,
            low24h: data ? parseFloat(data.lowPrice) : 0,
            volume24h: data ? parseFloat(data.volume) : 0,
          };
        });
    } catch (error) {
      console.error('Erro ao obter tickers:', error);
      throw error;
    }
  }

  // Criar ordem de compra
  async placeBuyOrder(symbol: string, quantity: number, price?: number): Promise<Order> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key e secret são necessários');
    }

    const params: Record<string, any> = {
      symbol: symbol.toUpperCase(),
      side: 'BUY',
      quantity: quantity,
      type: price ? 'LIMIT' : 'MARKET',
    };

    if (price) {
      params.price = price;
      params.timeInForce = 'GTC';
    }

    try {
      const response = await this.makeAuthenticatedRequest('/api/v3/order', 'POST', params);
      
      return {
        orderId: response.orderId,
        symbol: response.symbol,
        side: response.side,
        type: response.type,
        price: parseFloat(response.price),
        origQty: parseFloat(response.origQty),
        executedQty: parseFloat(response.executedQty),
        status: response.status,
        time: response.transactTime,
        updateTime: response.transactTime,
      };
    } catch (error) {
      console.error('Erro ao criar ordem de compra:', error);
      throw error;
    }
  }

  // Criar ordem de venda
  async placeSellOrder(symbol: string, quantity: number, price?: number): Promise<Order> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key e secret são necessários');
    }

    const params: Record<string, any> = {
      symbol: symbol.toUpperCase(),
      side: 'SELL',
      quantity: quantity,
      type: price ? 'LIMIT' : 'MARKET',
    };

    if (price) {
      params.price = price;
      params.timeInForce = 'GTC';
    }

    try {
      const response = await this.makeAuthenticatedRequest('/api/v3/order', 'POST', params);
      
      return {
        orderId: response.orderId,
        symbol: response.symbol,
        side: response.side,
        type: response.type,
        price: parseFloat(response.price),
        origQty: parseFloat(response.origQty),
        executedQty: parseFloat(response.executedQty),
        status: response.status,
        time: response.transactTime,
        updateTime: response.transactTime,
      };
    } catch (error) {
      console.error('Erro ao criar ordem de venda:', error);
      throw error;
    }
  }

  // Obter histórico de ordens
  async getOrders(symbol?: string): Promise<Order[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key e secret são necessários');
    }

    const params: Record<string, string> = {};
    if (symbol) {
      params.symbol = symbol.toUpperCase();
    }

    try {
      const response = await this.makeAuthenticatedRequest('/api/v3/allOrders', 'GET', params);
      
      return response.map((o: any) => ({
        orderId: o.orderId,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        price: parseFloat(o.price),
        origQty: parseFloat(o.origQty),
        executedQty: parseFloat(o.executedQty),
        status: o.status,
        time: o.time,
        updateTime: o.updateTime,
      }));
    } catch (error) {
      console.error('Erro ao obter ordens:', error);
      throw error;
    }
  }

  // Obter histórico de trades
  async getTrades(symbol: string): Promise<Trade[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key e secret são necessários');
    }

    const params = { symbol: symbol.toUpperCase() };

    try {
      const response = await this.makeAuthenticatedRequest('/api/v3/myTrades', 'GET', params);
      
      return response.map((t: any) => ({
        id: t.id,
        orderId: t.orderId,
        symbol: t.symbol,
        side: t.isBuyer ? 'BUY' : 'SELL',
        price: parseFloat(t.price),
        qty: parseFloat(t.qty),
        commission: parseFloat(t.commission),
        time: t.time,
      }));
    } catch (error) {
      console.error('Erro ao obter trades:', error);
      throw error;
    }
  }

  // Obter candles/klines
  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<Kline[]> {
    try {
      const response = await this.makePublicRequest('/api/v3/klines', {
        symbol: symbol.toUpperCase(),
        interval: interval,
        limit: limit,
      });
      
      return response.map((k: any) => ({
        openTime: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        closeTime: k[6],
      }));
    } catch (error) {
      console.error('Erro ao obter klines:', error);
      throw error;
    }
  }

  // Cancelar ordem
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key e secret são necessários');
    }

    try {
      return await this.makeAuthenticatedRequest('/api/v3/order', 'DELETE', {
        symbol: symbol.toUpperCase(),
        orderId: orderId,
      });
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
      throw error;
    }
  }

  // Testar conexão
  async ping(): Promise<boolean> {
    try {
      await this.makePublicRequest('/api/v3/ping');
      return true;
    } catch {
      return false;
    }
  }

  // Obter tempo do servidor
  async getServerTime(): Promise<number> {
    const response = await this.makePublicRequest('/api/v3/time');
    return response.serverTime;
  }
}

// Criar cliente baseado na exchange
export function createCryptoClient(
  exchange: string,
  apiKey: string = '',
  apiSecret: string = ''
) {
  switch (exchange.toLowerCase()) {
    case 'binance':
      return new BinanceClient(apiKey, apiSecret);
    // Outras exchanges podem ser adicionadas aqui
    default:
      throw new Error(`Exchange ${exchange} não suportada ainda`);
  }
}

// Funções utilitárias
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  return volume.toFixed(2);
}
