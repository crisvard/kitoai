import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';

export default function Trading() {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const exchanges = ['Binance', 'OKEx', 'Bitso', 'Toro'];

  const popularCryptos = [
    { symbol: 'BTC', name: 'Bitcoin', price: 'R$ 146.250', change: '+2.4%', isPositive: true },
    { symbol: 'ETH', name: 'Ethereum', price: 'R$ 13.210', change: '+1.8%', isPositive: true },
    { symbol: 'BNB', name: 'Binance Coin', price: 'R$ 564', change: '-0.8%', isPositive: false },
    { symbol: 'SOL', name: 'Solana', price: 'R$ 61', change: '+5.2%', isPositive: true },
    { symbol: 'ADA', name: 'Cardano', price: 'R$ 2.52', change: '+3.1%', isPositive: true },
    { symbol: 'DOT', name: 'Polkadot', price: 'R$ 28.40', change: '-1.2%', isPositive: false },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ orderType, selectedExchange, amount, price });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Negociar</h2>
        <p className="text-gray-400">Compre e venda criptomoedas nas suas exchanges</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setOrderType('buy')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  orderType === 'buy'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <ArrowUpCircle className="inline mr-2" size={20} />
                Comprar
              </button>
              <button
                onClick={() => setOrderType('sell')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  orderType === 'sell'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <ArrowDownCircle className="inline mr-2" size={20} />
                Vender
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Exchange</label>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4d82e] transition-colors"
                >
                  {exchanges.map((exchange) => (
                    <option key={exchange} value={exchange.toLowerCase()}>
                      {exchange}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">Criptomoeda</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: BTC, ETH, SOL..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4d82e] transition-colors"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">Quantidade</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4d82e] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2 text-sm">Preço (R$)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4d82e] transition-colors"
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Total Estimado</span>
                  <span className="text-white font-semibold">
                    R$ {(parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxa</span>
                  <span className="text-white">0.1%</span>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                  orderType === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/50'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/50'
                }`}
              >
                {orderType === 'buy' ? 'Comprar' : 'Vender'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Criptomoedas Populares</h3>
            <div className="space-y-3">
              {popularCryptos.map((crypto, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between p-3 bg-white/[0.02] rounded-xl hover:bg-white/5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#c4d82e] to-[#b5c928] rounded-lg flex items-center justify-center text-black font-bold text-sm">
                      {crypto.symbol.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">{crypto.symbol}</p>
                      <p className="text-gray-400 text-xs">{crypto.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">{crypto.price}</p>
                    <p className={`text-xs ${crypto.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {crypto.change}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
