import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function BrokerTrading() {
  const [selectedAsset, setSelectedAsset] = useState('PETR4');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [orderMode, setOrderMode] = useState<'market' | 'limit'>('market');

  const popularStocks = [
    { symbol: 'PETR4', name: 'Petrobras', price: '38,50', change: '+2.4%', isPositive: true },
    { symbol: 'VALE3', name: 'Vale', price: '68,20', change: '+1.8%', isPositive: true },
    { symbol: 'WEGE3', name: 'WEG', price: '35,40', change: '-0.5%', isPositive: false },
    { symbol: 'MGLU3', name: 'Magazine Luiza', price: '8,20', change: '+5.2%', isPositive: true },
    { symbol: 'BOVA11', name: 'ETF Ibovespa', price: '135,00', change: '+1.2%', isPositive: true },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Operar</h2>
        <p className="text-gray-400">Comprar e vender ações na bolsa brasileira</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Ativos */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Ativos Disponíveis</h3>
          <div className="space-y-2">
            {popularStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => setSelectedAsset(stock.symbol)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  selectedAsset === stock.symbol
                    ? 'bg-[#c4d82e]/20 border border-[#c4d82e]/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-lg flex items-center justify-center text-black font-bold text-sm">
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{stock.symbol}</p>
                    <p className="text-gray-400 text-xs">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">R$ {stock.price}</p>
                  <p className={`text-xs ${stock.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.change}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formulário de Ordem */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Nova Ordem</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrderType('buy')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  orderType === 'buy'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Compra
              </button>
              <button
                onClick={() => setOrderType('sell')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  orderType === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Venda
              </button>
            </div>
          </div>

          {/* Tipo de Ordem */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Tipo de Ordem</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderMode('market')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  orderMode === 'market'
                    ? 'bg-[#c4d82e] text-black'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Mercado
              </button>
              <button
                onClick={() => setOrderMode('limit')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  orderMode === 'limit'
                    ? 'bg-[#c4d82e] text-black'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Limitada
              </button>
            </div>
          </div>

          {/* Detalhes do Ativo */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-xl">{selectedAsset}</p>
                <p className="text-gray-400 text-sm">Petrobras PN</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl">R$ 38,50</p>
                <p className="text-green-400 text-sm">+2.4% hoje</p>
              </div>
            </div>
          </div>

          {/* Quantidade */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Quantidade</label>
            <input
              type="number"
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-xl focus:outline-none focus:border-[#c4d82e]"
            />
            <p className="text-gray-400 text-xs mt-2">Mín: 1 ação | Máx: 10.000 ações</p>
          </div>

          {/* Preço Limitado */}
          {orderMode === 'limit' && (
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Preço Limite (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-xl focus:outline-none focus:border-[#c4d82e]"
              />
            </div>
          )}

          {/* Total */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white font-medium">R$ 0,00</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Taxa de Corretagem</span>
              <span className="text-white font-medium">R$ 4,90</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white font-bold">Total</span>
              <span className="text-[#c4d82e] font-bold text-xl">R$ 4,90</span>
            </div>
          </div>

          {/* Botão de Executar */}
          <button
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              orderType === 'buy'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {orderType === 'buy' ? 'Comprar' : 'Vender'} {selectedAsset}
          </button>
        </div>
      </div>
    </div>
  );
}
