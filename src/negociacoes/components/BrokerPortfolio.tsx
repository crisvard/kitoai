import { TrendingUp, TrendingDown, PieChart, Globe } from 'lucide-react';

export default function BrokerPortfolio() {
  const holdings = [
    { symbol: 'PETR4', name: 'Petrobras', broker: 'Rico', quantity: 200, avgPrice: 'R$ 35,80', currentPrice: 'R$ 38,50', value: 'R$ 7.700,00', profit: '+R$ 540', profitPercent: '+7.5%', isPositive: true },
    { symbol: 'VALE3', name: 'Vale', broker: 'Rico', quantity: 100, avgPrice: 'R$ 65,00', currentPrice: 'R$ 68,20', value: 'R$ 6.820,00', profit: '+R$ 320', profitPercent: '+4.9%', isPositive: true },
    { symbol: 'WEGE3', name: 'WEG', broker: 'XP Investimentos', quantity: 150, avgPrice: 'R$ 36,20', currentPrice: 'R$ 35,40', value: 'R$ 5.310,00', profit: '-R$ 120', profitPercent: '-2.2%', isPositive: false },
    { symbol: 'MGLU3', name: 'Magazine Luiza', broker: 'Rico', quantity: 500, avgPrice: 'R$ 7,50', currentPrice: 'R$ 8,20', value: 'R$ 4.100,00', profit: '+R$ 350', profitPercent: '+9.3%', isPositive: true },
    { symbol: 'BOVA11', name: 'ETF Ibovespa', broker: 'Rico', quantity: 50, avgPrice: 'R$ 128,00', currentPrice: 'R$ 135,00', value: 'R$ 6.750,00', profit: '+R$ 350', profitPercent: '+5.5%', isPositive: true },
    { symbol: 'ITUB4', name: 'Itaú Unibanco', broker: 'XP Investimentos', quantity: 300, avgPrice: 'R$ 28,50', currentPrice: 'R$ 29,80', value: 'R$ 8.940,00', profit: '+R$ 390', profitPercent: '+4.6%', isPositive: true },
  ];

  const totalValue = 39620;
  const totalProfit = 1830;
  const profitPercent = 4.8;

  const allocation = [
    { type: 'Ações Brasil', percentage: 65, color: 'bg-[#c4d82e]' },
    { type: 'ETF', percentage: 20, color: 'bg-blue-500' },
    { type: 'FIIs', percentage: 10, color: 'bg-purple-500' },
    { type: 'Caixa', percentage: 5, color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Portfólio Broker</h2>
        <p className="text-gray-400">Visão detalhada dos seus ativos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Valor Total */}
        <div className="bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-2xl p-6 shadow-lg shadow-[#c4d82e]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <PieChart className="text-black" size={24} />
            </div>
            <span className="text-black/80 font-medium">Patrimônio Total</span>
          </div>
          <p className="text-3xl font-bold text-black mb-2">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-black/70" size={16} />
            <span className="text-black/80 font-medium">
              +R$ {totalProfit.toLocaleString('pt-BR')} ({profitPercent}%)
            </span>
          </div>
        </div>

        {/* Alocação */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Alocação</h3>
          <div className="space-y-3">
            {allocation.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{item.type}</span>
                  <span className="text-white font-medium">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Melhor Performance */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <p className="text-gray-400 mb-2">Melhor Performance</p>
          <p className="text-2xl font-bold text-white mb-1">MGLU3</p>
          <span className="text-green-400 font-medium">+9.3%</span>
          <p className="text-gray-400 text-sm mt-4">Pior Performance</p>
          <p className="text-2xl font-bold text-white mb-1">WEGE3</p>
          <span className="text-red-400 font-medium">-2.2%</span>
        </div>
      </div>

      {/* Tabela de Ativos */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6">Meus Ativos</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 font-medium pb-4">Ativo</th>
                <th className="text-left text-gray-400 font-medium pb-4">Corretora</th>
                <th className="text-right text-gray-400 font-medium pb-4">Quantidade</th>
                <th className="text-right text-gray-400 font-medium pb-4">Preço Médio</th>
                <th className="text-right text-gray-400 font-medium pb-4">Preço Atual</th>
                <th className="text-right text-gray-400 font-medium pb-4">Valor</th>
                <th className="text-right text-gray-400 font-medium pb-4">Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-lg flex items-center justify-center text-black font-bold text-sm">
                        {holding.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{holding.symbol}</p>
                        <p className="text-gray-400 text-sm">{holding.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-gray-300 text-sm">
                      {holding.broker}
                    </span>
                  </td>
                  <td className="py-4 text-right text-white">{holding.quantity}</td>
                  <td className="py-4 text-right text-gray-300">{holding.avgPrice}</td>
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
