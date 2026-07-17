import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

export default function Portfolio() {
  const holdings = [
    { symbol: 'BTC', name: 'Bitcoin', exchange: 'Binance', amount: '0.5842', avgPrice: 'R$ 142.000', currentPrice: 'R$ 146.250', value: 'R$ 85.420', profit: '+R$ 2.483', profitPercent: '+2.9%', isPositive: true },
    { symbol: 'ETH', name: 'Ethereum', exchange: 'OKEx', amount: '2.145', avgPrice: 'R$ 12.800', currentPrice: 'R$ 13.210', value: 'R$ 28.340', profit: '+R$ 880', profitPercent: '+3.2%', isPositive: true },
    { symbol: 'BNB', name: 'Binance Coin', exchange: 'Binance', amount: '15.82', avgPrice: 'R$ 580', currentPrice: 'R$ 564', value: 'R$ 8.920', profit: '-R$ 253', profitPercent: '-2.8%', isPositive: false },
    { symbol: 'SOL', name: 'Solana', exchange: 'Bitso', amount: '45.2', avgPrice: 'R$ 58', currentPrice: 'R$ 61', value: 'R$ 2.750', profit: '+R$ 136', profitPercent: '+5.2%', isPositive: true },
    { symbol: 'ADA', name: 'Cardano', exchange: 'Toro', amount: '850', avgPrice: 'R$ 2.45', currentPrice: 'R$ 2.52', value: 'R$ 2.142', profit: '+R$ 60', profitPercent: '+2.9%', isPositive: true },
  ];

  const totalValue = 127572;
  const totalProfit = 3306;
  const profitPercent = 2.6;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Portfólio</h2>
        <p className="text-slate-400">Visão detalhada dos seus ativos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <PieChart className="text-white" size={24} />
            </div>
            <span className="text-blue-100 font-medium">Valor Total</span>
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-300" size={16} />
            <span className="text-green-300 font-medium">
              +R$ {totalProfit.toLocaleString('pt-BR')} ({profitPercent}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <p className="text-slate-400 mb-2">Melhor Performance</p>
          <p className="text-2xl font-bold text-white mb-1">Solana</p>
          <span className="text-green-400 font-medium">+5.2%</span>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <p className="text-slate-400 mb-2">Ativos no Portfólio</p>
          <p className="text-2xl font-bold text-white mb-1">{holdings.length}</p>
          <span className="text-slate-400 text-sm">em 4 exchanges</span>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-6">Meus Ativos</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-slate-400 font-medium pb-4">Ativo</th>
                <th className="text-left text-slate-400 font-medium pb-4">Exchange</th>
                <th className="text-right text-slate-400 font-medium pb-4">Quantidade</th>
                <th className="text-right text-slate-400 font-medium pb-4">Preço Médio</th>
                <th className="text-right text-slate-400 font-medium pb-4">Preço Atual</th>
                <th className="text-right text-slate-400 font-medium pb-4">Valor</th>
                <th className="text-right text-slate-400 font-medium pb-4">Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-700/30 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {holding.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{holding.symbol}</p>
                        <p className="text-slate-400 text-sm">{holding.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-slate-700/50 rounded-full text-slate-300 text-sm">
                      {holding.exchange}
                    </span>
                  </td>
                  <td className="py-4 text-right text-white">{holding.amount}</td>
                  <td className="py-4 text-right text-slate-300">{holding.avgPrice}</td>
                  <td className="py-4 text-right text-white font-semibold">{holding.currentPrice}</td>
                  <td className="py-4 text-right text-white font-semibold">{holding.value}</td>
                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={holding.isPositive ? 'text-green-400' : 'text-red-400'}>
                        {holding.profit}
                      </span>
                      <span className={`text-sm ${holding.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {holding.profitPercent}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
