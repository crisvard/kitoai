/**
 * Configuração Completa das Exchanges
 * Contém todas as informações necessárias para integração com cada casa de câmbio
 */

import { ExchangeConfig } from '../types';

export interface ExchangeFullConfig extends ExchangeConfig {
  // Endereços de API
  apiBaseUrl: string;
  wsUrl: string;
  testnetUrl: string;
  testnetWsUrl: string;

  // Documentação
  docsUrl: string;
  apiKeysDocs: string;

  // Limites
  rateLimit: number;
  maxRequestsPerMinute: number;

  // Recursos suportados
  supportedFeatures: string[];
  supportedOrderTypes: string[];
  supportedMargins: string[];

  // Informações adicionais
  founded: number;
  headquarters: string;
  volume24h: string;
  tradingFee: string;

  // Requisitos
  requiresKYC: boolean;
  minDeposit: Record<string, number>;
  withdrawalFee: Record<string, number>;
}

export const EXCHANGE_CONFIGS: Record<string, ExchangeFullConfig> = {
  binance: {
    id: 'binance',
    name: 'binance',
    displayName: 'Binance',
    logo: '🟡',
    description: 'Maior exchange global com melhor liquidez',
    website: 'https://www.binance.com',
    supported_regions: ['Global', 'Brasil'],
    features: ['Spot Trading', 'Futures', 'Staking', 'Margin', 'NFT'],

    // Endereços de API
    apiBaseUrl: 'https://api.binance.com',
    wsUrl: 'wss://stream.binance.com:9443/ws',
    testnetUrl: 'https://testnet.binance.vision/api',
    testnetWsUrl: 'wss://testnet.binance.vision/ws',

    // Documentação
    docsUrl: 'https://www.binance.com/en/support/articles/360009488872',
    apiKeysDocs: 'https://www.binance.com/en/support/articles/360002223808',

    // Limites
    rateLimit: 1200,
    maxRequestsPerMinute: 1200,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Margin', 'Staking', 'Savings', 'NFT', 'Card'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_loss_limit', 'take_profit', 'take_profit_limit', 'oco'],
    supportedMargins: ['cross', 'isolated'],

    // Informações adicionais
    founded: 2017,
    headquarters: 'Cayman Islands',
    volume24h: '$76B+',
    tradingFee: '0.1%',

    // Requisitos
    requiresKYC: false,
    minDeposit: { 'USDT': 1, 'BRL': 10, 'BTC': 0.0001 },
    withdrawalFee: { 'USDT': 1, 'BTC': 0.0005, 'ETH': 0.005 },
  },

  okex: {
    id: 'okex',
    name: 'okex',
    displayName: 'OKEx',
    logo: '⚪',
    description: 'Exchange líder com alto volume e derivativos',
    website: 'https://www.okx.com',
    supported_regions: ['Global', 'Brasil'],
    features: ['Spot Trading', 'Futures', 'Perpetual', 'Staking', 'Options'],

    // Endereços de API
    apiBaseUrl: 'https://www.okx.com/api/v5',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    testnetUrl: 'https://www.okx.com/api/v5',
    testnetWsUrl: 'wss://ws.okx.com:8443/ws/v5/public',

    // Documentação
    docsUrl: 'https://www.okx.com/docs-v5/',
    apiKeysDocs: 'https://www.okx.com/docs-v5/pro/rest-api-authentication',

    // Limites
    rateLimit: 600,
    maxRequestsPerMinute: 600,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Perpetual', 'Options', 'Staking', 'Earn'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_limit', 'take_profit', 'take_profit_limit'],
    supportedMargins: ['cross', 'isolated'],

    // Informações adicionais
    founded: 2017,
    headquarters: 'Seychelles',
    volume24h: '$2.5B+',
    tradingFee: '0.1%',

    // Requisitos
    requiresKYC: true,
    minDeposit: { 'USDT': 10, 'BTC': 0.001 },
    withdrawalFee: { 'USDT': 1, 'BTC': 0.0006, 'ETH': 0.01 },
  },

  bitso: {
    id: 'bitso',
    name: 'bitso',
    displayName: 'Bitso',
    logo: '🔵',
    description: 'Exchange latino-americana com foco em pagamentos',
    website: 'https://bitso.com',
    supported_regions: ['Latinoamérica', 'Brasil', 'México'],
    features: ['Spot Trading', 'Conversão', 'P2P', 'Payments'],

    // Endereços de API
    apiBaseUrl: 'https://api.bitso.com/v3',
    wsUrl: 'wss://ws.bitso.com/',
    testnetUrl: 'https://api.bitso.com/v3',
    testnetWsUrl: 'wss://ws.bitso.com/',

    // Documentação
    docsUrl: 'https://bitsoinfo.docs.apiary.io/',
    apiKeysDocs: 'https://bitsoinfo.docs.apiary.io/#reference/authentication',

    // Limites
    rateLimit: 300,
    maxRequestsPerMinute: 300,

    // Recursos
    supportedFeatures: ['Spot', 'Conversion', 'P2P', 'Payments', 'Wire Transfers'],
    supportedOrderTypes: ['limit', 'market'],
    supportedMargins: [],

    // Informações adicionais
    founded: 2014,
    headquarters: 'México',
    volume24h: '$150M+',
    tradingFee: '0.5%',

    // Requisitos
    requiresKYC: true,
    minDeposit: { 'MXN': 100, 'USD': 10 },
    withdrawalFee: { 'MXN': 10, 'USD': 3, 'BTC': 0.0001 },
  },

  toro: {
    id: 'toro',
    name: 'toro',
    displayName: 'Toro Investimentos',
    logo: '🟢',
    description: 'Plataforma brasileira com múltiplos ativos',
    website: 'https://www.toro.com',
    supported_regions: ['Brasil'],
    features: ['Ações', 'Forex', 'Cripto', 'Renda Fixa', 'ETF'],

    // Endereços de API
    apiBaseUrl: 'https://api.toro.com.br',
    wsUrl: 'wss://stream.toro.com',
    testnetUrl: 'https://api-sandbox.toro.com.br',
    testnetWsUrl: 'wss://stream-sandbox.toro.com',

    // Documentação
    docsUrl: 'https://developers.toroinvestimentos.com.br',
    apiKeysDocs: 'https://developers.toroinvestimentos.com.br/docs/autenticacao',

    // Limites
    rateLimit: 60,
    maxRequestsPerMinute: 60,

    // Recursos
    supportedFeatures: ['Ações', 'Forex', 'Cripto', 'Renda Fixa', 'ETF', 'FIIs'],
    supportedOrderTypes: ['market', 'limit'],
    supportedMargins: [],

    // Informações adicionais
    founded: 2010,
    headquarters: 'Brasil',
    volume24h: '$500M+',
    tradingFee: '0.1%',

    // Requisitos
    requiresKYC: true,
    minDeposit: { 'BRL': 20 },
    withdrawalFee: { 'BRL': 10 },
  },

  gateio: {
    id: 'gateio',
    name: 'gateio',
    displayName: 'Gate.io',
    logo: '🟦',
    description: 'Exchange descentralizada com altcoins diversos',
    website: 'https://www.gate.io',
    supported_regions: ['Global', 'Brasil'],
    features: ['Spot Trading', 'Futures', 'Lending', 'Hedged', 'NFT'],

    // Endereços de API
    apiBaseUrl: 'https://api.gateio.ws/api/v4',
    wsUrl: 'wss://api.gateio.ws/ws/v4/',
    testnetUrl: 'https://api.gateio.ws/api/v4',
    testnetWsUrl: 'wss://api.gateio.ws/ws/v4/',

    // Documentação
    docsUrl: 'https://www.gate.io/docs',
    apiKeysDocs: 'https://www.gate.io/docs/apiv4',

    // Limites
    rateLimit: 900,
    maxRequestsPerMinute: 900,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Perpetual', 'Delivery', 'Options', 'Lending', 'NFT'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_limit', 'take_profit', 'take_profit_limit', 'gateio_new_order'],
    supportedMargins: ['cross', 'isolated'],

    // Informações adicionais
    founded: 2013,
    headquarters: 'Cayman Islands',
    volume24h: '$2B+',
    tradingFee: '0.2%',

    // Requisitos
    requiresKYC: false,
    minDeposit: { 'USDT': 10, 'BTC': 0.001 },
    withdrawalFee: { 'USDT': 5, 'BTC': 0.0005, 'ETH': 0.005 },
  },

  bybit: {
    id: 'bybit',
    name: 'bybit',
    displayName: 'Bybit',
    logo: '🟨',
    description: 'Exchange especializada em derivativos e futures',
    website: 'https://www.bybit.com',
    supported_regions: ['Global', 'Brasil'],
    features: ['Futures', 'Spot Trading', 'Perpetual', 'Options', 'Earn'],

    // Endereços de API
    apiBaseUrl: 'https://api.bybit.com/v5',
    wsUrl: 'wss://stream.bybit.com/v5/public/spot',
    testnetUrl: 'https://api-testnet.bybit.com/v5',
    testnetWsUrl: 'wss://stream-testnet.bybit.com/v5/public/spot',

    // Documentação
    docsUrl: 'https://bybitunion.github.io/docs/spot/v3/',
    apiKeysDocs: 'https://bybitunion.github.io/docs/spot/v3/authentication',

    // Limites
    rateLimit: 600,
    maxRequestsPerMinute: 600,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Perpetual', 'Options', 'Leveraged Tokens', 'Earn'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_limit', 'take_profit', 'take_profit_limit'],
    supportedMargins: ['cross', 'isolated'],

    // Informações adicionais
    founded: 2018,
    headquarters: 'Singapore',
    volume24h: '$10B+',
    tradingFee: '0.1%',

    // Requisitos
    requiresKYC: false,
    minDeposit: { 'USDT': 10, 'BTC': 0.001 },
    withdrawalFee: { 'USDT': 1, 'BTC': 0.0005, 'ETH': 0.003 },
  },

  mexc: {
    id: 'mexc',
    name: 'mexc',
    displayName: 'MEXC',
    logo: '🔶',
    description: 'Exchange com foco em novos projetos e altcoins',
    website: 'https://www.mexc.com',
    supported_regions: ['Global', 'Brasil'],
    features: ['Spot Trading', 'Futures', 'Launchpad', 'Staking', 'ETF'],

    // Endereços de API
    apiBaseUrl: 'https://api.mexc.com/api/v3',
    wsUrl: 'wss://contract.mexc.com/ws',
    testnetUrl: 'https://api.mexc.com/api/v3',
    testnetWsUrl: 'wss://contract.mexc.com/ws',

    // Documentação
    docsUrl: 'https://mexcdevelop.github.io/apidocs/',
    apiKeysDocs: 'https://mexcdevelop.github.io/apidocs/spot_v3_en/#authentication',

    // Limites
    rateLimit: 300,
    maxRequestsPerMinute: 300,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Perpetual', 'ETF', 'Launchpad', 'Staking', 'MX-DeFi'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_limit', 'take_profit', 'take_profit_limit'],
    supportedMargins: ['cross', 'isolated'],

    // Informações adicionais
    founded: 2018,
    headquarters: 'Singapore',
    volume24h: '$1B+',
    tradingFee: '0.2%',

    // Requisitos
    requiresKYC: false,
    minDeposit: { 'USDT': 10, 'BTC': 0.001 },
    withdrawalFee: { 'USDT': 1, 'BTC': 0.0005, 'ETH': 0.005 },
  },

  coinbase: {
    id: 'coinbase',
    name: 'coinbase',
    displayName: 'Coinbase',
    logo: '💰',
    description: 'Exchange americana mais populares e segura',
    website: 'https://www.coinbase.com',
    supported_regions: ['EUA', 'Europa', 'Brasil'],
    features: ['Spot Trading', 'Pro', 'Wallet', 'Earn'],

    // Endereços de API
    apiBaseUrl: 'https://api.coinbase.com',
    wsUrl: 'wss://ws-feed.exchange.coinbase.com',
    testnetUrl: 'https://api-sandbox.exchange.coinbase.com',
    testnetWsUrl: 'wss://ws-feed.exchange.coinbase.com',

    // Documentação
    docsUrl: 'https://docs.cloud.coinbase.com',
    apiKeysDocs: 'https://docs.cloud.coinbase.com/sign-in-with-api-key',

    // Limites
    rateLimit: 600,
    maxRequestsPerMinute: 600,

    // Recursos
    supportedFeatures: ['Spot', 'Pro', 'Wallet', 'Earn', 'Card'],
    supportedOrderTypes: ['limit', 'market', 'stop_limit'],
    supportedMargins: [],

    // Informações adicionais
    founded: 2012,
    headquarters: 'EUA',
    volume24h: '$3B+',
    tradingFee: '0.5%',

    // Requisitos
    requiresKYC: true,
    minDeposit: { 'USD': 2, 'EUR': 2, 'GBP': 2 },
    withdrawalFee: { 'USD': 25, 'EUR': 0.15, 'BTC': 0.0001 },
  },

  kraken: {
    id: 'kraken',
    name: 'kraken',
    displayName: 'Kraken',
    logo: '🦑',
    description: 'Exchange estabelecida com alta segurança',
    website: 'https://www.kraken.com',
    supported_regions: ['EUA', 'Europa', 'Brasil'],
    features: ['Spot Trading', 'Futures', 'Staking', 'OTC'],

    // Endereços de API
    apiBaseUrl: 'https://api.kraken.com',
    wsUrl: 'wss://ws.kraken.com',
    testnetUrl: 'https://api.kraken.com',
    testnetWsUrl: 'wss://ws.kraken.com',

    // Documentação
    docsUrl: 'https://www.kraken.com/en-us/features/api',
    apiKeysDocs: 'https://www.kraken.com/en-us/features/api#api-key-management',

    // Limites
    rateLimit: 300,
    maxRequestsPerMinute: 300,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Staking', 'OTC', 'Margin'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_limit', 'take_profit', 'take_profit_limit'],
    supportedMargins: ['cross'],

    // Informações adicionais
    founded: 2011,
    headquarters: 'EUA',
    volume24h: '$500M+',
    tradingFee: '0.26%',

    // Requisitos
    requiresKYC: true,
    minDeposit: { 'USD': 10, 'EUR': 10 },
    withdrawalFee: { 'USD': 5, 'EUR': 0.90, 'BTC': 0.0005 },
  },

  kucoin: {
    id: 'kucoin',
    name: 'kucoin',
    displayName: 'KuCoin',
    logo: '🟣',
    description: 'Exchange com grande variedade de altcoins',
    website: 'https://www.kucoin.com',
    supported_regions: ['Global', 'Brasil'],
    features: ['Spot Trading', 'Futures', 'Margin', 'Staking', 'Pool'],

    // Endereços de API
    apiBaseUrl: 'https://api.kucoin.com',
    wsUrl: 'wss://ws-api.kucoin.com',
    testnetUrl: 'https://api-sandbox.kucoin.com',
    testnetWsUrl: 'wss://ws-api-sandbox.kucoin.com',

    // Documentação
    docsUrl: 'https://docs.kucoin.com/',
    apiKeysDocs: 'https://docs.kucoin.com/#authentication',

    // Limites
    rateLimit: 1800,
    maxRequestsPerMinute: 1800,

    // Recursos
    supportedFeatures: ['Spot', 'Futures', 'Margin', 'Staking', 'Pool-X', 'Swap'],
    supportedOrderTypes: ['limit', 'market', 'stop_loss', 'stop_limit', 'take_profit', 'take_profit_limit'],
    supportedMargins: ['cross', 'isolated'],

    // Informações adicionais
    founded: 2017,
    headquarters: 'Seychelles',
    volume24h: '$1B+',
    tradingFee: '0.1%',

    // Requisitos
    requiresKYC: false,
    minDeposit: { 'USDT': 10, 'BTC': 0.001 },
    withdrawalFee: { 'USDT': 2, 'BTC': 0.0005, 'ETH': 0.005 },
  },
};

// Lista de exchanges disponíveis
export const EXCHANGE_LIST = Object.values(EXCHANGE_CONFIGS);

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Retorna a configuração de uma exchange específica
 */
export function getExchangeConfig(exchangeId: string): ExchangeFullConfig | undefined {
  return EXCHANGE_CONFIGS[exchangeId.toLowerCase()];
}

/**
 * Retorna todas as exchanges que suportam um recurso específico
 */
export function getExchangesByFeature(feature: string): ExchangeFullConfig[] {
  return EXCHANGE_LIST.filter(exchange =>
    exchange.supportedFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  );
}

/**
 * Retorna todas as exchanges que suportam um tipo de ordem
 */
export function getExchangesByOrderType(orderType: string): ExchangeFullConfig[] {
  return EXCHANGE_LIST.filter(exchange =>
    exchange.supportedOrderTypes.includes(orderType)
  );
}

/**
 * Retorna todas as exchanges disponíveis no Brasil
 */
export function getBrazilExchanges(): ExchangeFullConfig[] {
  return EXCHANGE_LIST.filter(exchange =>
    exchange.supported_regions.some(r => r.toLowerCase().includes('brasil'))
  );
}

/**
 * Retorna todas as exchanges que suportam um par específico
 */
export function getExchangesForPair(pair: string): ExchangeFullConfig[] {
  // Verifica se a exchange suporta o par com base na moeda
  const baseCurrency = pair.replace(/[^a-zA-Z]/g, '');
  const quoteCurrency = pair.replace(/[a-zA-Z]/g, '').toUpperCase();

  return EXCHANGE_LIST.filter(exchange => {
    // Exchanges com suporte a USDT
    if (quoteCurrency === 'USDT') {
      return exchange.supportedFeatures.includes('Spot');
    }
    // Exchanges com suporte a BRL
    if (quoteCurrency === 'BRL') {
      return exchange.id === 'bitso' || exchange.id === 'toro';
    }
    return true;
  });
}

/**
 * Retorna a taxa de câmbio atualizada
 */
export function getTradingFee(exchangeId: string): string {
  const exchange = getExchangeConfig(exchangeId);
  return exchange?.tradingFee || '0.1%';
}

/**
 * Retorna o depósito mínimo para uma exchange
 */
export function getMinDeposit(exchangeId: string, currency: string): number {
  const exchange = getExchangeConfig(exchangeId);
  return exchange?.minDeposit[currency.toUpperCase()] || 0;
}

/**
 * Retorna a taxa de saque para uma exchange
 */
export function getWithdrawalFee(exchangeId: string, currency: string): number {
  const exchange = getExchangeConfig(exchangeId);
  return exchange?.withdrawalFee[currency.toUpperCase()] || 0;
}

/**
 * Verifica se uma exchange suporta KYC
 */
export function requiresKYC(exchangeId: string): boolean {
  const exchange = getExchangeConfig(exchangeId);
  return exchange?.requiresKYC || false;
}
