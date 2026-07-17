/**
 * Configuração de Pares de Trading para todas as Exchanges
 * Contém todos os pares possíveis suportados pelas exchanges pré-configuradas
 */

export interface TradingPair {
    base: string;       // Moeda base (ex: BTC)
    quote: string;       // Moeda quoted (ex: USDT)
    symbol: string;      // Símbolo completo (ex: BTCUSDT)
    name: string;        // Nome do par (ex: Bitcoin/USDT)
    minQty: number;      // Quantidade mínima
    minNotional: number; // Valor mínimo em USDT
    precision: number;   // Precisão de preço
    quantityPrecision: number; // Precisão de quantidade
    stepSize: number;    // Step de quantidade
    tickSize: number;    // Step de preço
    status: 'TRADING' | 'BREAK' | 'HALT'; // Status do par
    category: 'spot' | 'futures'; // Categoria do par
}

// Pares principais com USDT (Spot)
export const USDT_PAIRS: TradingPair[] = [
    // Majors
    { base: 'BTC', quote: 'USDT', symbol: 'BTCUSDT', name: 'Bitcoin/USDT', minQty: 0.00001, minNotional: 5, precision: 2, quantityPrecision: 5, stepSize: 0.00001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'ETH', quote: 'USDT', symbol: 'ETHUSDT', name: 'Ethereum/USDT', minQty: 0.0001, minNotional: 5, precision: 2, quantityPrecision: 4, stepSize: 0.0001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'BNB', quote: 'USDT', symbol: 'BNBUSDT', name: 'BNB/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'SOL', quote: 'USDT', symbol: 'SOLUSDT', name: 'Solana/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'XRP', quote: 'USDT', symbol: 'XRPUSDT', name: 'Ripple/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ADA', quote: 'USDT', symbol: 'ADAUSDT', name: 'Cardano/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'DOGE', quote: 'USDT', symbol: 'DOGEUSDT', name: 'Dogecoin/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'DOT', quote: 'USDT', symbol: 'DOTUSDT', name: 'Polkadot/USDT', minQty: 0.1, minNotional: 5, precision: 3, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'MATIC', quote: 'USDT', symbol: 'MATICUSDT', name: 'Polygon/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'LTC', quote: 'USDT', symbol: 'LTCUSDT', name: 'Litecoin/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },

    // Altcoins importantes
    { base: 'AVAX', quote: 'USDT', symbol: 'AVAXUSDT', name: 'Avalanche/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'LINK', quote: 'USDT', symbol: 'LINKUSDT', name: 'Chainlink/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'UNI', quote: 'USDT', symbol: 'UNIUSDT', name: 'Uniswap/USDT', minQty: 0.01, minNotional: 5, precision: 4, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ATOM', quote: 'USDT', symbol: 'ATOMUSDT', name: 'Cosmos/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'XLM', quote: 'USDT', symbol: 'XLMUSDT', name: 'Stellar/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'VET', quote: 'USDT', symbol: 'VETUSDT', name: 'VeChain/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'FIL', quote: 'USDT', symbol: 'FILUSDT', name: 'Filecoin/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'THETA', quote: 'USDT', symbol: 'THETAUSDT', name: 'Theta/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'XMR', quote: 'USDT', symbol: 'XMRUSDT', name: 'Monero/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'ALGO', quote: 'USDT', symbol: 'ALGOUSDT', name: 'Algorand/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },

    // DeFi Tokens
    { base: 'AAVE', quote: 'USDT', symbol: 'AAVEUSDT', name: 'Aave/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'MKR', quote: 'USDT', symbol: 'MKRUSDT', name: 'Maker/USDT', minQty: 0.001, minNotional: 5, precision: 1, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.1, status: 'TRADING', category: 'spot' },
    { base: 'SNX', quote: 'USDT', symbol: 'SNXUSDT', name: 'Synthetix/USDT', minQty: 0.01, minNotional: 5, precision: 4, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'CRV', quote: 'USDT', symbol: 'CRVUSDT', name: 'Curve DAO/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'COMP', quote: 'USDT', symbol: 'COMPUSDT', name: 'Compound/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },

    // Memecoins e novos projetos
    { base: 'PEPE', quote: 'USDT', symbol: 'PEPEUSDT', name: 'Pepe/USDT', minQty: 1000000, minNotional: 5, precision: 10, quantityPrecision: 0, stepSize: 1000000, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'SHIB', quote: 'USDT', symbol: 'SHIBUSDT', name: 'Shiba Inu/USDT', minQty: 1000, minNotional: 5, precision: 8, quantityPrecision: 0, stepSize: 1000, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'BONK', quote: 'USDT', symbol: 'BONKUSDT', name: 'Bonk/USDT', minQty: 100, minNotional: 5, precision: 7, quantityPrecision: 0, stepSize: 100, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'WIF', quote: 'USDT', symbol: 'WIFUSDT', name: 'dogwifhat/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SUI', quote: 'USDT', symbol: 'SUIUSDT', name: 'Sui/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'APT', quote: 'USDT', symbol: 'APTUSDT', name: 'Aptos/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'ARB', quote: 'USDT', symbol: 'ARBUSDT', name: 'Arbitrum/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'OP', quote: 'USDT', symbol: 'OPUSDT', name: 'Optimism/USDT', minQty: 0.01, minNotional: 5, precision: 4, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'INJ', quote: 'USDT', symbol: 'INJUSDT', name: 'Injective/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'TIA', quote: 'USDT', symbol: 'TIAUSDT', name: 'Celestia/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'NEAR', quote: 'USDT', symbol: 'NEARUSDT', name: 'NEAR Protocol/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'FTM', quote: 'USDT', symbol: 'FTMUSDT', name: 'Fantom/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'IMX', quote: 'USDT', symbol: 'IMXUSDT', name: 'Immutable/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'RENDER', quote: 'USDT', symbol: 'RENDERUSDT', name: 'Render/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'GRT', quote: 'USDT', symbol: 'GRTUSDT', name: 'The Graph/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'STX', quote: 'USDT', symbol: 'STXUSDT', name: 'Stacks/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'RUNE', quote: 'USDT', symbol: 'RUNEUSDT', name: 'THORChain/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'ENS', quote: 'USDT', symbol: 'ENSUSDT', name: 'Ethereum Name Service/USDT', minQty: 0.001, minNotional: 5, precision: 3, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'LDO', quote: 'USDT', symbol: 'LDOUSDT', name: 'Lido DAO/USDT', minQty: 0.01, minNotional: 5, precision: 4, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'QNT', quote: 'USDT', symbol: 'QNTUSDT', name: 'Quant/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'MNT', quote: 'USDT', symbol: 'MNTUSDT', name: 'Mantle/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SEI', quote: 'USDT', symbol: 'SEIUSDT', name: 'Sei/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SAND', quote: 'USDT', symbol: 'SANDUSDT', name: 'The Sandbox/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'MANA', quote: 'USDT', symbol: 'MANAUSDT', name: 'Decentraland/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'AXS', quote: 'USDT', symbol: 'AXSUSDT', name: 'Axie Infinity/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'CHZ', quote: 'USDT', symbol: 'CHZUSDT', name: 'Chiliz/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'BAT', quote: 'USDT', symbol: 'BATUSDT', name: 'Basic Attention Token/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ENJ', quote: 'USDT', symbol: 'ENJUSDT', name: 'Enjin Coin/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ZEC', quote: 'USDT', symbol: 'ZECUSDT', name: 'Zcash/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'DASH', quote: 'USDT', symbol: 'DASHUSDT', name: 'Dash/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'NEO', quote: 'USDT', symbol: 'NEOUSDT', name: 'Neo/USDT', minQty: 0.001, minNotional: 5, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'EOS', quote: 'USDT', symbol: 'EOSUSDT', name: 'EOS/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'XTZ', quote: 'USDT', symbol: 'XTZUSDT', name: 'Tezos/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'FLOW', quote: 'USDT', symbol: 'FLOWUSDT', name: 'Flow/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'HBAR', quote: 'USDT', symbol: 'HBARUSDT', name: 'Hedera/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'KAS', quote: 'USDT', symbol: 'KASUSDT', name: 'Kaspa/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'MINA', quote: 'USDT', symbol: 'MINAUSDT', name: 'Mina/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'IOTA', quote: 'USDT', symbol: 'IOTAUSDT', name: 'IOTA/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'NKN', quote: 'USDT', symbol: 'NKNUSDT', name: 'NKN/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ANKR', quote: 'USDT', symbol: 'ANKRUSDT', name: 'Ankr/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'ZIL', quote: 'USDT', symbol: 'ZILUSDT', name: 'Zilliqa/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: '1INCH', quote: 'USDT', symbol: '1INCHUSDT', name: '1inch/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'MAGIC', quote: 'USDT', symbol: 'MAGICUSDT', name: 'Magic/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'GMT', quote: 'USDT', symbol: 'GMTUSDT', name: 'GMT/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'BLUR', quote: 'USDT', symbol: 'BLURUSDT', name: 'Blur/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'DYDX', quote: 'USDT', symbol: 'DYDXUSDT', name: 'dYdX/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'GALA', quote: 'USDT', symbol: 'GALAUSDT', name: 'Gala/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'ROSE', quote: 'USDT', symbol: 'ROSEUSDT', name: ' Oasis Network/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'KAVA', quote: 'USDT', symbol: 'KAVAUSDT', name: 'Kava/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ZRX', quote: 'USDT', symbol: 'ZRXUSDT', name: '0x/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SKL', quote: 'USDT', symbol: 'SKLUSDT', name: 'Skale/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ICX', quote: 'USDT', symbol: 'ICXUSDT', name: 'ICON/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'STORJ', quote: 'USDT', symbol: 'STORJUSDT', name: 'Storj/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'REN', quote: 'USDT', symbol: 'RENUSDT', name: 'Ren/USDT', minQty: 1, minNotional: 5, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'OCEAN', quote: 'USDT', symbol: 'OCEANUSDT', name: 'Ocean Protocol/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'BAND', quote: 'USDT', symbol: 'BANDUSDT', name: 'Band Protocol/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'CTSI', quote: 'USDT', symbol: 'CTSUSDT', name: 'Cartesi/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'LRC', quote: 'USDT', symbol: 'LRCUSDT', name: 'Loopring/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'OGN', quote: 'USDT', symbol: 'OGNUSDT', name: 'Origin Protocol/USDT', minQty: 0.1, minNotional: 5, precision: 5, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'CELR', quote: 'USDT', symbol: 'CELRUSDT', name: 'Celer Network/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'RSR', quote: 'USDT', symbol: 'RSRUSDT', name: 'Reserve Rights/USDT', minQty: 10, minNotional: 5, precision: 7, quantityPrecision: 0, stepSize: 10, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'ANT', quote: 'USDT', symbol: 'ANTUSDT', name: 'Aragon/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'JASMY', quote: 'USDT', symbol: 'JASMYUSDT', name: 'JasmyCoin/USDT', minQty: 1, minNotional: 5, precision: 6, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'HIGH', quote: 'USDT', symbol: 'HIGHUSDT', name: 'Highstreet/USDT', minQty: 0.01, minNotional: 5, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'HOOK', quote: 'USDT', symbol: 'HOOKUSDT', name: 'Hooked Protocol/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SSV', quote: 'USDT', symbol: 'SSVUSDT', name: 'SSV Network/USDT', minQty: 0.001, minNotional: 5, precision: 3, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'LQTY', quote: 'USDT', symbol: 'LQTYUSDT', name: 'Liquity/USDT', minQty: 0.01, minNotional: 5, precision: 4, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ARB', quote: 'USDT', symbol: 'ARBUSDT', name: 'Arbitrum/USDT', minQty: 0.1, minNotional: 5, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
];

// Pares com BRL (para exchanges brasileiras)
export const BRL_PAIRS: TradingPair[] = [
    { base: 'BTC', quote: 'BRL', symbol: 'BTCBRL', name: 'Bitcoin/BRL', minQty: 0.00001, minNotional: 10, precision: 2, quantityPrecision: 5, stepSize: 0.00001, tickSize: 1, status: 'TRADING', category: 'spot' },
    { base: 'ETH', quote: 'BRL', symbol: 'ETHBRL', name: 'Ethereum/BRL', minQty: 0.0001, minNotional: 10, precision: 2, quantityPrecision: 4, stepSize: 0.0001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'USDT', quote: 'BRL', symbol: 'USDTBRL', name: 'Tether/BRL', minQty: 0.01, minNotional: 10, precision: 2, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'BNB', quote: 'BRL', symbol: 'BNBBRL', name: 'BNB/BRL', minQty: 0.001, minNotional: 10, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'SOL', quote: 'BRL', symbol: 'SOLBRL', name: 'Solana/BRL', minQty: 0.01, minNotional: 10, precision: 2, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'XRP', quote: 'BRL', symbol: 'XRPBRL', name: 'Ripple/BRL', minQty: 1, minNotional: 10, precision: 4, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'ADA', quote: 'BRL', symbol: 'ADABRL', name: 'Cardano/BRL', minQty: 1, minNotional: 10, precision: 4, quantityPrecision: 0, stepSize: 1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'DOGE', quote: 'BRL', symbol: 'DOGEBRL', name: 'Dogecoin/BRL', minQty: 1, minNotional: 10, precision: 5, quantityPrecision: 0, stepSize: 1, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'DOT', quote: 'BRL', symbol: 'DOTBRL', name: 'Polkadot/BRL', minQty: 0.1, minNotional: 10, precision: 2, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'MATIC', quote: 'BRL', symbol: 'MATICBRL', name: 'Polygon/BRL', minQty: 0.1, minNotional: 10, precision: 4, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'LTC', quote: 'BRL', symbol: 'LTCBRL', name: 'Litecoin/BRL', minQty: 0.001, minNotional: 10, precision: 2, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'AVAX', quote: 'BRL', symbol: 'AVAXBRL', name: 'Avalanche/BRL', minQty: 0.01, minNotional: 10, precision: 2, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'LINK', quote: 'BRL', symbol: 'LINKBRL', name: 'Chainlink/BRL', minQty: 0.01, minNotional: 10, precision: 2, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.01, status: 'TRADING', category: 'spot' },
    { base: 'UNI', quote: 'BRL', symbol: 'UNIBRL', name: 'Uniswap/BRL', minQty: 0.01, minNotional: 10, precision: 3, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.001, status: 'TRADING', category: 'spot' },
    { base: 'ATOM', quote: 'BRL', symbol: 'ATOMBRL', name: 'Cosmos/BRL', minQty: 0.01, minNotional: 10, precision: 2, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.01, status: 'TRADING', category: 'spot' },
];

// Pares com BTC (Altcoin/BTC)
export const BTC_PAIRS: TradingPair[] = [
    { base: 'ETH', quote: 'BTC', symbol: 'ETHBTC', name: 'Ethereum/BTC', minQty: 0.0001, minNotional: 0.0001, precision: 5, quantityPrecision: 4, stepSize: 0.0001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'BNB', quote: 'BTC', symbol: 'BNBBTC', name: 'BNB/BTC', minQty: 0.001, minNotional: 0.0001, precision: 4, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SOL', quote: 'BTC', symbol: 'SOLBTC', name: 'Solana/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'XRP', quote: 'BTC', symbol: 'XRPBTC', name: 'Ripple/BTC', minQty: 1, minNotional: 0.0001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ADA', quote: 'BTC', symbol: 'ADABTC', name: 'Cardano/BTC', minQty: 1, minNotional: 0.0001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'DOGE', quote: 'BTC', symbol: 'DOGEBTC', name: 'Dogecoin/BTC', minQty: 10, minNotional: 0.0001, precision: 10, quantityPrecision: 0, stepSize: 10, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'DOT', quote: 'BTC', symbol: 'DOTBTC', name: 'Polkadot/BTC', minQty: 0.1, minNotional: 0.0001, precision: 6, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'MATIC', quote: 'BTC', symbol: 'MATICBTC', name: 'Polygon/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'LTC', quote: 'BTC', symbol: 'LTCBTC', name: 'Litecoin/BTC', minQty: 0.001, minNotional: 0.0001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'AVAX', quote: 'BTC', symbol: 'AVAXBTC', name: 'Avalanche/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'LINK', quote: 'BTC', symbol: 'LINKBTC', name: 'Chainlink/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'UNI', quote: 'BTC', symbol: 'UNIBTC', name: 'Uniswap/BTC', minQty: 0.01, minNotional: 0.0001, precision: 7, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'ATOM', quote: 'BTC', symbol: 'ATOMBTC', name: 'Cosmos/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'XLM', quote: 'BTC', symbol: 'XLMBTC', name: 'Stellar/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'VET', quote: 'BTC', symbol: 'VETBTC', name: 'VeChain/BTC', minQty: 10, minNotional: 0.0001, precision: 10, quantityPrecision: 0, stepSize: 10, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'FIL', quote: 'BTC', symbol: 'FILBTC', name: 'Filecoin/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'THETA', quote: 'BTC', symbol: 'THETABTC', name: 'Theta/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'ALGO', quote: 'BTC', symbol: 'ALGOBTC', name: 'Algorand/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'XMR', quote: 'BTC', symbol: 'XMRBTC', name: 'Monero/BTC', minQty: 0.001, minNotional: 0.0001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'AAVE', quote: 'BTC', symbol: 'AAVEBTC', name: 'Aave/BTC', minQty: 0.001, minNotional: 0.0001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'MKR', quote: 'BTC', symbol: 'MKRBTC', name: 'Maker/BTC', minQty: 0.0001, minNotional: 0.0001, precision: 4, quantityPrecision: 4, stepSize: 0.0001, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SNX', quote: 'BTC', symbol: 'SNXBTC', name: 'Synthetix/BTC', minQty: 0.01, minNotional: 0.0001, precision: 7, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'NEAR', quote: 'BTC', symbol: 'NEARBTC', name: 'NEAR Protocol/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'APT', quote: 'BTC', symbol: 'APTBTC', name: 'Aptos/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'ARB', quote: 'BTC', symbol: 'ARBBTC', name: 'Arbitrum/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'OP', quote: 'BTC', symbol: 'OPBTC', name: 'Optimism/BTC', minQty: 0.01, minNotional: 0.0001, precision: 7, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'INJ', quote: 'BTC', symbol: 'INJBTC', name: 'Injective/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'SUI', quote: 'BTC', symbol: 'SUIBTC', name: 'Sui/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'TIA', quote: 'BTC', symbol: 'TIABTC', name: 'Celestia/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'RENDER', quote: 'BTC', symbol: 'RENDERBTC', name: 'Render/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'GRT', quote: 'BTC', symbol: 'GRTBTC', name: 'The Graph/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'STX', quote: 'BTC', symbol: 'STXBTC', name: 'Stacks/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'IMX', quote: 'BTC', symbol: 'IMXBTC', name: 'Immutable/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'SEI', quote: 'BTC', symbol: 'SEIBTC', name: 'Sei/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'FTM', quote: 'BTC', symbol: 'FTMBTC', name: 'Fantom/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'SAND', quote: 'BTC', symbol: 'SANDBTC', name: 'The Sandbox/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'MANA', quote: 'BTC', symbol: 'MANABTC', name: 'Decentraland/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'AXS', quote: 'BTC', symbol: 'AXSBTC', name: 'Axie Infinity/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'GALA', quote: 'BTC', symbol: 'GALABTC', name: 'Gala/BTC', minQty: 10, minNotional: 0.0001, precision: 10, quantityPrecision: 0, stepSize: 10, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ENJ', quote: 'BTC', symbol: 'ENJBTC', name: 'Enjin Coin/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'CHZ', quote: 'BTC', symbol: 'CHZBTC', name: 'Chiliz/BTC', minQty: 1, minNotional: 0.0001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'HBAR', quote: 'BTC', symbol: 'HBARBTC', name: 'Hedera/BTC', minQty: 1, minNotional: 0.0001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'NEO', quote: 'BTC', symbol: 'NEOBTC', name: 'Neo/BTC', minQty: 0.001, minNotional: 0.0001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'EOS', quote: 'BTC', symbol: 'EOSBTC', name: 'EOS/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'XTZ', quote: 'BTC', symbol: 'XTZBTC', name: 'Tezos/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'ZEC', quote: 'BTC', symbol: 'ZECBTC', name: 'Zcash/BTC', minQty: 0.001, minNotional: 0.0001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'DASH', quote: 'BTC', symbol: 'DASHBTC', name: 'Dash/BTC', minQty: 0.001, minNotional: 0.0001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'KAS', quote: 'BTC', symbol: 'KASBTC', name: 'Kaspa/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'MINA', quote: 'BTC', symbol: 'MINABTC', name: 'Mina/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'IOTA', quote: 'BTC', symbol: 'IOTABTC', name: 'IOTA/BTC', minQty: 0.1, minNotional: 0.0001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ZIL', quote: 'BTC', symbol: 'ZILBTC', name: 'Zilliqa/BTC', minQty: 1, minNotional: 0.0001, precision: 10, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'SHIB', quote: 'BTC', symbol: 'SHIBBTC', name: 'Shiba Inu/BTC', minQty: 10000, minNotional: 0.0001, precision: 12, quantityPrecision: 0, stepSize: 10000, tickSize: 0.0000000001, status: 'TRADING', category: 'spot' },
    { base: 'PEPE', quote: 'BTC', symbol: 'PEPEBTC', name: 'Pepe/BTC', minQty: 1000000, minNotional: 0.0001, precision: 14, quantityPrecision: 0, stepSize: 1000000, tickSize: 0.000000000001, status: 'TRADING', category: 'spot' },
    { base: 'WIF', quote: 'BTC', symbol: 'WIFBTC', name: 'dogwifhat/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'BONK', quote: 'BTC', symbol: 'BONKBTC', name: 'Bonk/BTC', minQty: 100, minNotional: 0.0001, precision: 11, quantityPrecision: 0, stepSize: 100, tickSize: 0.00000000001, status: 'TRADING', category: 'spot' },
    { base: 'JASMY', quote: 'BTC', symbol: 'JASMYBTC', name: 'JasmyCoin/BTC', minQty: 1, minNotional: 0.0001, precision: 10, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'LDO', quote: 'BTC', symbol: 'LDOBTC', name: 'Lido DAO/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'QNT', quote: 'BTC', symbol: 'QNTBTC', name: 'Quant/BTC', minQty: 0.001, minNotional: 0.0001, precision: 4, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'MNT', quote: 'BTC', symbol: 'MNTBTC', name: 'Mantle/BTC', minQty: 0.1, minNotional: 0.0001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'RUNE', quote: 'BTC', symbol: 'RUNEBTC', name: 'THORChain/BTC', minQty: 0.01, minNotional: 0.0001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'ENS', quote: 'BTC', symbol: 'ENSBTC', name: 'Ethereum Name Service/BTC', minQty: 0.001, minNotional: 0.0001, precision: 6, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
];

// Pares com ETH (Altcoin/ETH)
export const ETH_PAIRS: TradingPair[] = [
    { base: 'BNB', quote: 'ETH', symbol: 'BNBETH', name: 'BNB/ETH', minQty: 0.001, minNotional: 0.001, precision: 4, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SOL', quote: 'ETH', symbol: 'SOLETH', name: 'Solana/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'XRP', quote: 'ETH', symbol: 'XRPETH', name: 'Ripple/ETH', minQty: 1, minNotional: 0.001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ADA', quote: 'ETH', symbol: 'ADAETH', name: 'Cardano/ETH', minQty: 1, minNotional: 0.001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'DOGE', quote: 'ETH', symbol: 'DOGEETH', name: 'Dogecoin/ETH', minQty: 10, minNotional: 0.001, precision: 10, quantityPrecision: 0, stepSize: 10, tickSize: 0.0000000001, status: 'TRADING', category: 'spot' },
    { base: 'DOT', quote: 'ETH', symbol: 'DOTETH', name: 'Polkadot/ETH', minQty: 0.1, minNotional: 0.001, precision: 6, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'MATIC', quote: 'ETH', symbol: 'MATICETH', name: 'Polygon/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'LTC', quote: 'ETH', symbol: 'LTCETH', name: 'Litecoin/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'AVAX', quote: 'ETH', symbol: 'AVAXETH', name: 'Avalanche/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'LINK', quote: 'ETH', symbol: 'LINKETH', name: 'Chainlink/ETH', minQty: 0.01, minNotional: 0.001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'UNI', quote: 'ETH', symbol: 'UNIETH', name: 'Uniswap/ETH', minQty: 0.01, minNotional: 0.001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'ATOM', quote: 'ETH', symbol: 'ATOMETH', name: 'Cosmos/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'XLM', quote: 'ETH', symbol: 'XLMETH', name: 'Stellar/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'AAVE', quote: 'ETH', symbol: 'AAVEETH', name: 'Aave/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'MKR', quote: 'ETH', symbol: 'MKRETH', name: 'Maker/ETH', minQty: 0.0001, minNotional: 0.001, precision: 4, quantityPrecision: 4, stepSize: 0.0001, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SNX', quote: 'ETH', symbol: 'SNXETH', name: 'Synthetix/ETH', minQty: 0.01, minNotional: 0.001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'CRV', quote: 'ETH', symbol: 'CRVETH', name: 'Curve DAO/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'COMP', quote: 'ETH', symbol: 'COMPETH', name: 'Compound/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'NEAR', quote: 'ETH', symbol: 'NEARETH', name: 'NEAR Protocol/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'APT', quote: 'ETH', symbol: 'APTETH', name: 'Aptos/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'ARB', quote: 'ETH', symbol: 'ARBETH', name: 'Arbitrum/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'OP', quote: 'ETH', symbol: 'OPETH', name: 'Optimism/ETH', minQty: 0.01, minNotional: 0.001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'INJ', quote: 'ETH', symbol: 'INJETH', name: 'Injective/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'SUI', quote: 'ETH', symbol: 'SUIDTH', name: 'Sui/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'FTM', quote: 'ETH', symbol: 'FTMETH', name: 'Fantom/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'IMX', quote: 'ETH', symbol: 'IMXETH', name: 'Immutable/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'RENDER', quote: 'ETH', symbol: 'RENDERETH', name: 'Render/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'GRT', quote: 'ETH', symbol: 'GRTETH', name: 'The Graph/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'STX', quote: 'ETH', symbol: 'STXETH', name: 'Stacks/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'ENS', quote: 'ETH', symbol: 'ENSETH', name: 'Ethereum Name Service/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'LDO', quote: 'ETH', symbol: 'LDOETH', name: 'Lido DAO/ETH', minQty: 0.01, minNotional: 0.001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'SHIB', quote: 'ETH', symbol: 'SHIBETH', name: 'Shiba Inu/ETH', minQty: 10000, minNotional: 0.001, precision: 14, quantityPrecision: 0, stepSize: 10000, tickSize: 0.000000000001, status: 'TRADING', category: 'spot' },
    { base: 'PEPE', quote: 'ETH', symbol: 'PEPEETH', name: 'Pepe/ETH', minQty: 1000000, minNotional: 0.001, precision: 16, quantityPrecision: 0, stepSize: 1000000, tickSize: 0.00000000000001, status: 'TRADING', category: 'spot' },
    { base: 'WIF', quote: 'ETH', symbol: 'WIFETH', name: 'dogwifhat/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'BONK', quote: 'ETH', symbol: 'BONKETH', name: 'Bonk/ETH', minQty: 100, minNotional: 0.001, precision: 13, quantityPrecision: 0, stepSize: 100, tickSize: 0.000000000001, status: 'TRADING', category: 'spot' },
    { base: 'SEI', quote: 'ETH', symbol: 'SEIETH', name: 'Sei/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'TIA', quote: 'ETH', symbol: 'TIAETH', name: 'Celestia/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'KAS', quote: 'ETH', symbol: 'KASETH', name: 'Kaspa/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'RUNE', quote: 'ETH', symbol: 'RUNEETH', name: 'THORChain/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'GALA', quote: 'ETH', symbol: 'GALAETH', name: 'Gala/ETH', minQty: 10, minNotional: 0.001, precision: 12, quantityPrecision: 0, stepSize: 10, tickSize: 0.000000000001, status: 'TRADING', category: 'spot' },
    { base: 'MANA', quote: 'ETH', symbol: 'MANAETH', name: 'Decentraland/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'SAND', quote: 'ETH', symbol: 'SANDETH', name: 'The Sandbox/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'AXS', quote: 'ETH', symbol: 'AXSETH', name: 'Axie Infinity/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'CHZ', quote: 'ETH', symbol: 'CHZETH', name: 'Chiliz/ETH', minQty: 1, minNotional: 0.001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ENJ', quote: 'ETH', symbol: 'ENJETH', name: 'Enjin Coin/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'HBAR', quote: 'ETH', symbol: 'HBARETH', name: 'Hedera/ETH', minQty: 1, minNotional: 0.001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'NEO', quote: 'ETH', symbol: 'NEOETH', name: 'Neo/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'EOS', quote: 'ETH', symbol: 'EOSETH', name: 'EOS/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'XTZ', quote: 'ETH', symbol: 'XTZETH', name: 'Tezos/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'FLOW', quote: 'ETH', symbol: 'FLOWETH', name: 'Flow/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'ZEC', quote: 'ETH', symbol: 'ZECETH', name: 'Zcash/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'DASH', quote: 'ETH', symbol: 'DASHETH', name: 'Dash/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'XMR', quote: 'ETH', symbol: 'XMRETH', name: 'Monero/ETH', minQty: 0.001, minNotional: 0.001, precision: 5, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: '1INCH', quote: 'ETH', symbol: '1INCHETH', name: '1inch/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'YFI', quote: 'ETH', symbol: 'YFIETH', name: 'Yearn.finance/ETH', minQty: 0.0001, minNotional: 0.001, precision: 3, quantityPrecision: 4, stepSize: 0.0001, tickSize: 0.0001, status: 'TRADING', category: 'spot' },
    { base: 'SUSHI', quote: 'ETH', symbol: 'SUSHIETH', name: 'SushiSwap/ETH', minQty: 0.01, minNotional: 0.001, precision: 6, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'DYDX', quote: 'ETH', symbol: 'DYDXETH', name: 'dYdX/ETH', minQty: 0.1, minNotional: 0.001, precision: 6, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.000001, status: 'TRADING', category: 'spot' },
    { base: 'ZIL', quote: 'ETH', symbol: 'ZILETH', name: 'Zilliqa/ETH', minQty: 1, minNotional: 0.001, precision: 10, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ANKR', quote: 'ETH', symbol: 'ANKRETH', name: 'Ankr/ETH', minQty: 1, minNotional: 0.001, precision: 10, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'IOTA', quote: 'ETH', symbol: 'IOTAETH', name: 'IOTA/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'LRC', quote: 'ETH', symbol: 'LRCETH', name: 'Loopring/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'KAVA', quote: 'ETH', symbol: 'KAVAETH', name: 'Kava/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'ROSE', quote: 'ETH', symbol: 'ROSEETH', name: 'Oasis Network/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'OCEAN', quote: 'ETH', symbol: 'OCEANETH', name: 'Ocean Protocol/ETH', minQty: 0.1, minNotional: 0.001, precision: 8, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'BAND', quote: 'ETH', symbol: 'BANDETH', name: 'Band Protocol/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'CELR', quote: 'ETH', symbol: 'CELRETH', name: 'Celer Network/ETH', minQty: 1, minNotional: 0.001, precision: 10, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'ANT', quote: 'ETH', symbol: 'ANTETH', name: 'Aragon/ETH', minQty: 0.01, minNotional: 0.001, precision: 5, quantityPrecision: 2, stepSize: 0.01, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'JASMY', quote: 'ETH', symbol: 'JASMYETH', name: 'JasmyCoin/ETH', minQty: 1, minNotional: 0.001, precision: 12, quantityPrecision: 0, stepSize: 1, tickSize: 0.000000000001, status: 'TRADING', category: 'spot' },
    { base: 'GMT', quote: 'ETH', symbol: 'GMTETH', name: 'GMT/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'BLUR', quote: 'ETH', symbol: 'BLURETH', name: 'Blur/ETH', minQty: 1, minNotional: 0.001, precision: 8, quantityPrecision: 0, stepSize: 1, tickSize: 0.00000001, status: 'TRADING', category: 'spot' },
    { base: 'MAGIC', quote: 'ETH', symbol: 'MAGICETH', name: 'Magic/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
    { base: 'QNT', quote: 'ETH', symbol: 'QNTETH', name: 'Quant/ETH', minQty: 0.001, minNotional: 0.001, precision: 4, quantityPrecision: 3, stepSize: 0.001, tickSize: 0.00001, status: 'TRADING', category: 'spot' },
    { base: 'MNT', quote: 'ETH', symbol: 'MNTEH', name: 'Mantle/ETH', minQty: 0.1, minNotional: 0.001, precision: 7, quantityPrecision: 1, stepSize: 0.1, tickSize: 0.0000001, status: 'TRADING', category: 'spot' },
];

// Combinar todos os pares
export const ALL_TRADING_PAIRS: TradingPair[] = [
    ...USDT_PAIRS,
    ...BRL_PAIRS,
    ...BTC_PAIRS,
    ...ETH_PAIRS
];

// Categorias de ativos para filtragem
export const CRYPTO_CATEGORIES: Record<string, readonly string[]> = {
    majors: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LTC'],
    defi: ['UNI', 'AAVE', 'MKR', 'SNX', 'CRV', 'COMP', 'LDO', 'YFI', 'SUSHI', '1INCH'],
    layer1: ['AVAX', 'ATOM', 'NEAR', 'SOL', 'MATIC', 'FTM', 'INJ', 'APT', 'TIA', 'KAS', 'MINA', 'SEI', 'SUI', 'ALGO'],
    layer2: ['ARB', 'OP', 'IMX', 'BASE'],
    memecoins: ['PEPE', 'SHIB', 'BONK', 'WIF', 'DOGE'],
    nft: ['ENJ', 'MANA', 'SAND', 'AXS', 'GALA', 'BLUR'],
    stablecoins: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP'],
    exchange: ['BNB', 'OKB', 'HT', 'FTT', 'KCS'],
    privacy: ['XMR', 'ZEC', 'DASH', 'ZEN'],
};

// Função para buscar pares por categoria
export function getPairsByCategory(category: string): TradingPair[] {
    const symbols = CRYPTO_CATEGORIES[category] || [];
    return ALL_TRADING_PAIRS.filter(pair => symbols.includes(pair.base));
}

// Função para buscar pares por quote
export function getPairsByQuote(quote: string): TradingPair[] {
    return ALL_TRADING_PAIRS.filter(pair => pair.quote === quote);
}

// Função para buscar pares por base
export function getPairsByBase(base: string): TradingPair[] {
    return ALL_TRADING_PAIRS.filter(pair => pair.base === base);
}

// Função para buscar par específico
export function getPairBySymbol(symbol: string): TradingPair | undefined {
    return ALL_TRADING_PAIRS.find(pair => pair.symbol === symbol);
}

// Função para buscar pares disponíveis em uma exchange específica
export function getPairsForExchange(exchange: string): TradingPair[] {
    // Por enquanto, todas as exchanges suportam os mesmos pares spot
    // Futuras expansões podem adicionar lógica específica por exchange
    switch (exchange.toLowerCase()) {
        case 'binance':
            return ALL_TRADING_PAIRS;
        case 'okex':
            return ALL_TRADING_PAIRS.filter(p => p.category === 'spot');
        case 'bybit':
            return ALL_TRADING_PAIRS.filter(p => p.category === 'spot');
        case 'gateio':
            return ALL_TRADING_PAIRS.filter(p => p.category === 'spot');
        case 'mexc':
            return ALL_TRADING_PAIRS.filter(p => p.category === 'spot');
        case 'bitso':
            // Bitso foca em pares com BRL e MXN
            return [...BRL_PAIRS, ...USDT_PAIRS.filter(p => p.base === 'BTC' || p.base === 'ETH')];
        case 'toro':
            // Toro é focado no mercado brasileiro
            return BRL_PAIRS;
        default:
            return USDT_PAIRS; // Default para USDT
    }
}
