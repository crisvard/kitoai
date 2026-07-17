import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity, RefreshCw, AlertCircle } from 'lucide-react';

interface CryptoAsset {
  symbol: string;
  name: string;
  priceUSD: number;
  priceBRL: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
const ASSET_NAMES: Record<string, string> = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'BNBUSDT': 'Binance Coin',
  'SOLUSDT': 'Solana',
};
const SHORT_SYMBOL: Record<string, string> = {
  'BTCUSDT': 'BTC',
  'ETHUSDT': 'ETH',
  'BNBUSDT': 'BNB',
  'SOLUSDT': 'SOL',
};

async function fetchUSDToBRL(): Promise<number> {
  try {
    // Taxa de câmbio via API pública Coinbase / ExchangeRate
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    return data.rates?.BRL ?? 5.7;
  } catch {
    return 5.7; // fallback conservador
  }
}

async function fetchBinanceTickers(): Promise<any[]> {
  const symbolsParam = JSON.stringify(SYMBOLS);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Binance API error');
  return res.json();
}

export default function Dashboard() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [usdToBrl, setUsdToBrl] = useState<number>(5.7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [tickers, brlRate] = await Promise.all([fetchBinanceTickers(), fetchUSDToBRL()]);
      setUsdToBrl(brlRate);

      const mapped: CryptoAsset[] = tickers.map((t: any) => ({
        symbol: SHORT_SYMBOL[t.symbol],
        name: ASSET_NAMES[t.symbol],
        priceUSD: parseFloat(t.lastPrice),
        priceBRL: parseFloat(t.lastPrice) * brlRate,
        changePercent24h: parseFloat(t.priceChangePercent),
        high24h: parseFloat(t.highPrice) * brlRate,
        low24h: parseFloat(t.lowPrice) * brlRate,
        volume24h: parseFloat(t.volume),
      }));

      setAssets(mapped);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Não foi possível carregar os preços em tempo real da Binance.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // atualiza a cada 30 segundos
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalBRL = assets.reduce((sum, a) => sum + a.priceBRL, 0); // soma dos preços (não de portfólio)
  const avgChange = assets.length > 0
    ? assets.reduce((s, a) => s + a.changePercent24h, 0) / assets.length
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-gray-400">
            Preços ao vivo via Binance · USD → BRL: R$ {usdToBrl.toFixed(2)}
            {lastUpdated && (
              <span className="ml-2 text-gray-500 text-xs">
                · Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all duration-200 text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-4 w-2/3"></div>
              <div className="h-8 bg-white/10 rounded w-full"></div>
            </div>
          ))
        ) : (
          [
            {
              label: 'BTC - Bitcoin',
              value: assets.find(a => a.symbol === 'BTC')
                ? `R$ ${assets.find(a => a.symbol === 'BTC')!.priceBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : '--',
              change: assets.find(a => a.symbol === 'BTC')
                ? `${assets.find(a => a.symbol === 'BTC')!.changePercent24h.toFixed(2)}%`
                : '',
              isPositive: (assets.find(a => a.symbol === 'BTC')?.changePercent24h ?? 0) >= 0,
              icon: Wallet,
            },
            {
              label: 'ETH - Ethereum',
              value: assets.find(a => a.symbol === 'ETH')
                ? `R$ ${assets.find(a => a.symbol === 'ETH')!.priceBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : '--',
              change: assets.find(a => a.symbol === 'ETH')
                ? `${assets.find(a => a.symbol === 'ETH')!.changePercent24h.toFixed(2)}%`
                : '',
              isPositive: (assets.find(a => a.symbol === 'ETH')?.changePercent24h ?? 0) >= 0,
              icon: TrendingUp,
            },
            {
              label: 'BNB - Binance Coin',
              value: assets.find(a => a.symbol === 'BNB')
                ? `R$ ${assets.find(a => a.symbol === 'BNB')!.priceBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : '--',
              change: assets.find(a => a.symbol === 'BNB')
                ? `${assets.find(a => a.symbol === 'BNB')!.changePercent24h.toFixed(2)}%`
                : '',
              isPositive: (assets.find(a => a.symbol === 'BNB')?.changePercent24h ?? 0) >= 0,
              icon: Activity,
            },
            {
              label: 'SOL - Solana',
              value: assets.find(a => a.symbol === 'SOL')
                ? `R$ ${assets.find(a => a.symbol === 'SOL')!.priceBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : '--',
              change: assets.find(a => a.symbol === 'SOL')
                ? `${assets.find(a => a.symbol === 'SOL')!.changePercent24h.toFixed(2)}%`
                : '',
              isPositive: (assets.find(a => a.symbol === 'SOL')?.changePercent24h ?? 0) >= 0,
              icon: Activity,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#c4d82e]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/20 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#c4d82e]/10 rounded-xl">
                    <Icon className="text-[#c4d82e]" size={24} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-medium flex items-center gap-1 ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Tabela de Ativos */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Preços ao Vivo</h3>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
            Dados em tempo real · Binance
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 bg-white/10 rounded w-28"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl hover:bg-white/5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e] to-[#b5c928] rounded-xl flex items-center justify-center text-black font-bold text-sm">
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{asset.name}</p>
                    <p className="text-gray-400 text-sm">
                      US$ {asset.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="text-center hidden md:block">
                  <p className="text-gray-400 text-xs mb-1">Máx/Mín 24h</p>
                  <p className="text-white text-sm">
                    R$ {asset.high24h.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / R$ {asset.low24h.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-white font-semibold">
                    R$ {asset.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm font-medium flex items-center justify-end gap-1 ${asset.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.changePercent24h >= 0
                      ? <TrendingUp className="inline w-4 h-4" />
                      : <TrendingDown className="inline w-4 h-4" />}
                    {asset.changePercent24h >= 0 ? '+' : ''}{asset.changePercent24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
