/**
 * Configuração do Agente de Investimentos
 * Contém todos os parâmetros para o bot de trading automatizado
 */

import { CRYPTO_CATEGORIES } from './tradingPairs';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type TradingStrategy =
    | 'trend_following'     // Seguidor de tendência
    | 'mean_reversion'      // Reversão à média
    | 'grid_trading'        // Grid trading
    | 'dca'                 // Dollar Cost Averaging
    | 'momentum'            // Momentum
    | 'scalping'            // Scalping
    | 'swing_trading'       // Swing trading
    | 'custom';             // Estratégia personalizada

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

export type OrderType = 'market' | 'limit' | 'stop_loss' | 'stop_limit';

export interface TradingParams {
    // Configurações de entrada
    exchange: string;
    apiKey: string;
    apiSecret: string;
    testnet: boolean;

    // Pares de trading
    tradingPairs: string[];
    baseCurrency: string;        // Moeda base (ex: USDT, BRL, BTC)

    // Estratégia
    strategy: TradingStrategy;
    riskLevel: RiskLevel;

    // Parâmetros de risco
    maxPositionSize: number;     // Tamanho máximo da posição em %
    stopLossPercent: number;     // Stop loss em %
    takeProfitPercent: number;   // Take profit em %
    maxDailyLoss: number;        // Perda máxima diária em %
    maxOpenPositions: number;   // Máximo de posições abertas

    // Parâmetros técnicos
    rsiPeriod: number;          // Período do RSI
    rsiOverbought: number;      // RSI sobrecomprado
    rsiOversold: number;        // RSI sobrevendido
    emaShortPeriod: number;     // Período EMA curta
    emaLongPeriod: number;      // Período EMA longa
    macdFastPeriod: number;     // Período MACD rápido
    macdSlowPeriod: number;     // Período MACD lento
    macdSignalPeriod: number;   // Período do sinal MACD
    bollingerPeriod: number;    // Período Bollinger
    bollingerStdDev: number;    // Desvio padrão Bollinger

    // Configurações de ordem
    defaultOrderType: OrderType;
    orderTimeout: number;       // Timeout em segundos
    maxSlippage: number;        // Slippage máximo em %

    // Configurações de tempo
    checkInterval: number;       // Intervalo de verificação em minutos
    tradingStartHour: number;   // Hora de início de trading
    tradingEndHour: number;     // Hora de fim de trading

    // Configurações de quantidade
    minTradeAmount: number;     // Valor mínimo de trade em USDT
    maxTradeAmount: number;     // Valor máximo de trade em USDT

    // Configurações de segurança
    requireKYC: boolean;         // Requer KYC
    allowWithdrawal: boolean;   // Permite saque automático
    enableTwoFactor: boolean;   // Requer 2FA

    // Adicionais
    notifications: boolean;     // Ativar notificações
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface AgentStatus {
    id: string;
    userId: string;
    name: string;
    exchange: string;
    isActive: boolean;
    isTrading: boolean;
    balance: number;
    totalProfit: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    lastTrade: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TradeSignal {
    id: string;
    pair: string;
    action: 'buy' | 'sell' | 'hold';
    strength: number;           // 0-100
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    strategy: TradingStrategy;
    confidence: number;          // 0-100
    indicators: {
        rsi?: number;
        ema?: string;
        macd?: string;
        bollinger?: string;
    };
    timestamp: string;
}

// ============================================
// CONFIGURAÇÕES PRÉ-DEFINIDAS POR ESTRATÉGIA
// ============================================

export const STRATEGY_CONFIGS: Record<TradingStrategy, Partial<TradingParams>> = {
    trend_following: {
        emaShortPeriod: 9,
        emaLongPeriod: 21,
        macdFastPeriod: 12,
        macdSlowPeriod: 26,
        macdSignalPeriod: 9,
        checkInterval: 15,
        riskLevel: 'moderate',
        maxPositionSize: 10,
        stopLossPercent: 3,
        takeProfitPercent: 6,
    },
    mean_reversion: {
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        bollingerPeriod: 20,
        bollingerStdDev: 2,
        checkInterval: 30,
        riskLevel: 'moderate',
        maxPositionSize: 8,
        stopLossPercent: 4,
        takeProfitPercent: 3,
    },
    grid_trading: {
        checkInterval: 5,
        riskLevel: 'conservative',
        maxPositionSize: 20,
        stopLossPercent: 2,
        takeProfitPercent: 1,
        maxOpenPositions: 1,
    },
    dca: {
        checkInterval: 60,
        riskLevel: 'conservative',
        maxPositionSize: 5,
        stopLossPercent: 15,
        takeProfitPercent: 10,
        maxOpenPositions: 3,
    },
    momentum: {
        emaShortPeriod: 5,
        emaLongPeriod: 20,
        checkInterval: 10,
        riskLevel: 'aggressive',
        maxPositionSize: 15,
        stopLossPercent: 5,
        takeProfitPercent: 10,
    },
    scalping: {
        emaShortPeriod: 3,
        emaLongPeriod: 10,
        checkInterval: 1,
        riskLevel: 'aggressive',
        maxPositionSize: 5,
        stopLossPercent: 1,
        takeProfitPercent: 2,
        orderTimeout: 30,
        maxSlippage: 0.5,
    },
    swing_trading: {
        emaShortPeriod: 12,
        emaLongPeriod: 26,
        macdFastPeriod: 12,
        macdSlowPeriod: 26,
        macdSignalPeriod: 9,
        checkInterval: 240,
        riskLevel: 'moderate',
        maxPositionSize: 20,
        stopLossPercent: 8,
        takeProfitPercent: 15,
        tradingStartHour: 9,
        tradingEndHour: 18,
    },
    custom: {
        checkInterval: 15,
        riskLevel: 'moderate',
        maxPositionSize: 10,
        stopLossPercent: 5,
        takeProfitPercent: 10,
    },
};

// ============================================
// CONFIGURAÇÕES PRÉ-DEFINIDAS POR NÍVEL DE RISCO
// ============================================

export const RISK_CONFIGS: Record<RiskLevel, Partial<TradingParams>> = {
    conservative: {
        maxPositionSize: 5,
        stopLossPercent: 3,
        takeProfitPercent: 5,
        maxDailyLoss: 2,
        maxOpenPositions: 2,
        minTradeAmount: 10,
        maxTradeAmount: 100,
        maxSlippage: 0.5,
        allowWithdrawal: false,
    },
    moderate: {
        maxPositionSize: 10,
        stopLossPercent: 5,
        takeProfitPercent: 10,
        maxDailyLoss: 5,
        maxOpenPositions: 4,
        minTradeAmount: 10,
        maxTradeAmount: 500,
        maxSlippage: 1,
        allowWithdrawal: false,
    },
    aggressive: {
        maxPositionSize: 20,
        stopLossPercent: 10,
        takeProfitPercent: 20,
        maxDailyLoss: 10,
        maxOpenPositions: 6,
        minTradeAmount: 10,
        maxTradeAmount: 1000,
        maxSlippage: 2,
        allowWithdrawal: false,
    },
};

// ============================================
// CONFIGURAÇÃO PADRÃO DO AGENTE
// ============================================

export const DEFAULT_AGENT_PARAMS: TradingParams = {
    exchange: 'binance',
    apiKey: '',
    apiSecret: '',
    testnet: true,
    tradingPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    baseCurrency: 'USDT',
    strategy: 'trend_following',
    riskLevel: 'moderate',
    maxPositionSize: 10,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    maxDailyLoss: 5,
    maxOpenPositions: 4,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    emaShortPeriod: 9,
    emaLongPeriod: 21,
    macdFastPeriod: 12,
    macdSlowPeriod: 26,
    macdSignalPeriod: 9,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    defaultOrderType: 'limit',
    orderTimeout: 60,
    maxSlippage: 1,
    checkInterval: 15,
    tradingStartHour: 0,
    tradingEndHour: 23,
    minTradeAmount: 10,
    maxTradeAmount: 500,
    requireKYC: true,
    allowWithdrawal: false,
    enableTwoFactor: true,
    notifications: true,
    logLevel: 'info',
};

// ============================================
// PARÂMETROS POR EXCHANGE
// ============================================

export const EXCHANGE_TRADING_PARAMS: Record<string, Partial<TradingParams>> = {
    binance: {
        exchange: 'binance',
        baseCurrency: 'USDT',
        defaultOrderType: 'limit',
        orderTimeout: 60,
        maxSlippage: 1,
        tradingPairs: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT'],
    },
    okex: {
        exchange: 'okex',
        baseCurrency: 'USDT',
        defaultOrderType: 'limit',
        orderTimeout: 60,
        maxSlippage: 1,
        tradingPairs: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'OKB-USDT'],
    },
    bybit: {
        exchange: 'bybit',
        baseCurrency: 'USDT',
        defaultOrderType: 'limit',
        orderTimeout: 60,
        maxSlippage: 1,
        tradingPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    },
    gateio: {
        exchange: 'gateio',
        baseCurrency: 'USDT',
        defaultOrderType: 'limit',
        orderTimeout: 60,
        maxSlippage: 1,
        tradingPairs: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'],
    },
    mexc: {
        exchange: 'mexc',
        baseCurrency: 'USDT',
        defaultOrderType: 'limit',
        orderTimeout: 60,
        maxSlippage: 1,
        tradingPairs: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'],
    },
    bitso: {
        exchange: 'bitso',
        baseCurrency: 'BRL',
        defaultOrderType: 'market',
        orderTimeout: 120,
        maxSlippage: 2,
        tradingPairs: ['BTC_BRL', 'ETH_BRL', 'USDT_BRL'],
    },
    toro: {
        exchange: 'toro',
        baseCurrency: 'BRL',
        defaultOrderType: 'market',
        orderTimeout: 120,
        maxSlippage: 2,
        tradingPairs: ['BTCBRL', 'ETHBRL', 'PETR4'],
    },
};

// ============================================
// CATEGORIAS DE ATIVOS PARA STRATÉGIAS
// ============================================

export const STRATEGY_ASSET_CATEGORIES: Record<TradingStrategy, readonly string[]> = {
    trend_following: CRYPTO_CATEGORIES.majors,
    mean_reversion: CRYPTO_CATEGORIES.defi,
    grid_trading: CRYPTO_CATEGORIES.stablecoins,
    dca: CRYPTO_CATEGORIES.majors,
    momentum: CRYPTO_CATEGORIES.majors,
    scalping: ['BTC', 'ETH', 'SOL'],
    swing_trading: CRYPTO_CATEGORIES.layer1,
    custom: CRYPTO_CATEGORIES.majors,
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Cria configuração baseada na estratégia
 */
export function createStrategyConfig(strategy: TradingStrategy, overrides?: Partial<TradingParams>): TradingParams {
    const strategyConfig = STRATEGY_CONFIGS[strategy];
    const riskConfig = RISK_CONFIGS[strategyConfig?.riskLevel || 'moderate'];

    return {
        ...DEFAULT_AGENT_PARAMS,
        ...riskConfig,
        ...strategyConfig,
        ...overrides,
        strategy,
    };
}

/**
 * Cria configuração baseada no nível de risco
 */
export function createRiskConfig(riskLevel: RiskLevel, strategy: TradingStrategy = 'trend_following'): TradingParams {
    const riskConfig = RISK_CONFIGS[riskLevel];
    const strategyConfig = STRATEGY_CONFIGS[strategy];

    return {
        ...DEFAULT_AGENT_PARAMS,
        ...strategyConfig,
        ...riskConfig,
        riskLevel,
        strategy,
    };
}

/**
 * Cria configuração para uma exchange específica
 */
export function createExchangeConfig(exchange: string, strategy: TradingStrategy = 'trend_following', riskLevel: RiskLevel = 'moderate'): TradingParams {
    const exchangeConfig = EXCHANGE_TRADING_PARAMS[exchange.toLowerCase()] || {};
    const strategyConfig = STRATEGY_CONFIGS[strategy];
    const riskConfig = RISK_CONFIGS[riskLevel];

    return {
        ...DEFAULT_AGENT_PARAMS,
        ...riskConfig,
        ...strategyConfig,
        ...exchangeConfig,
        strategy,
        riskLevel,
    };
}

/**
 * Valida os parâmetros do agente
 */
export function validateAgentParams(params: Partial<TradingParams>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.exchange) {
        errors.push('Exchange é obrigatória');
    }

    if (!params.apiKey && !params.testnet) {
        errors.push('API Key é obrigatória para modo real');
    }

    if (params.maxPositionSize && (params.maxPositionSize < 1 || params.maxPositionSize > 100)) {
        errors.push('Tamanho máximo da posição deve estar entre 1% e 100%');
    }

    if (params.stopLossPercent && params.stopLossPercent < 0) {
        errors.push('Stop loss não pode ser negativo');
    }

    if (params.takeProfitPercent && params.takeProfitPercent < 0) {
        errors.push('Take profit não pode ser negativo');
    }

    if (params.checkInterval && params.checkInterval < 1) {
        errors.push('Intervalo de verificação deve ser pelo menos 1 minuto');
    }

    if (params.minTradeAmount && params.maxTradeAmount && params.minTradeAmount > params.maxTradeAmount) {
        errors.push('Valor mínimo não pode ser maior que o máximo');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Retorna os pares recomendados para uma estratégia
 */
export function getRecommendedPairs(strategy: TradingStrategy): string[] {
    const pairs = STRATEGY_ASSET_CATEGORIES[strategy];
    const baseCurrency = strategy === 'grid_trading' ? 'USDT' : 'USDT';

    return pairs.map(symbol => `${symbol}${baseCurrency}`);
}

/**
 * Calcula o tamanho da posição baseado no risco
 */
export function calculatePositionSize(
    balance: number,
    riskPercent: number,
    entryPrice: number,
    stopLoss: number
): number {
    const riskAmount = balance * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);

    if (riskPerShare === 0) return 0;

    const positionSize = riskAmount / riskPerShare;
    return Number(positionSize.toFixed(8));
}

/**
 * Calcula stop loss e take profit
 */
export function calculateStopLossTakeProfit(
    entryPrice: number,
    direction: 'long' | 'short',
    stopLossPercent: number,
    takeProfitPercent: number
): { stopLoss: number; takeProfit: number } {
    const stopLoss = direction === 'long'
        ? entryPrice * (1 - stopLossPercent / 100)
        : entryPrice * (1 + stopLossPercent / 100);

    const takeProfit = direction === 'long'
        ? entryPrice * (1 + takeProfitPercent / 100)
        : entryPrice * (1 - takeProfitPercent / 100);

    return {
        stopLoss: Number(stopLoss.toFixed(8)),
        takeProfit: Number(takeProfit.toFixed(8)),
    };
}
