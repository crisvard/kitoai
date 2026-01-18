export interface Exchange {
  id: string;
  user_id: string;
  name: 'Binance' | 'OKEx' | 'Bitso' | 'Toro' | 'Gate.io' | 'Bybit' | 'MEXC';
  api_key?: string;
  api_secret?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeConfig {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  description: string;
  website: string;
  supported_regions: string[];
  features: string[];
}

export interface ExchangeApiClient {
  exchange: string;
  getBalance(): Promise<Record<string, number>>;
  getMarketPrice(symbol: string): Promise<number>;
  placeBuyOrder(symbol: string, quantity: number, price: number): Promise<string>;
  placeSellOrder(symbol: string, quantity: number, price: number): Promise<string>;
  getTransactionHistory(): Promise<Transaction[]>;
  getPortfolio(): Promise<Portfolio[]>;
}

export interface Portfolio {
  id: string;
  user_id: string;
  exchange_id: string;
  symbol: string;
  amount: number;
  average_price: number;
  current_price: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  exchange_id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
