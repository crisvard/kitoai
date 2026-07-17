import { TrendingUp, TrendingDown, Wallet, Activity, BarChart3, Globe } from 'lucide-react';

export default function BrokerDashboard() {
  const stats = [
    {
      label: 'Patrimônio Total',
      value: 'R$ 52.100,00',
      change: '+8.3%',
      isPositive: true,
      icon: Wallet,
    },
    {
      label: 'Retorno no Mês',
      value: 'R$ 4.250,00',
      change: '+8.9%',
      isPositive: true,
      icon: TrendingUp,
    },
    {
      label: 'Posições Abertas',
      value: '12',
      change: '+3',
      isPositive: true,
      icon: Activity,
    },
    {
      label: 'Corretoras Conectadas',
      value: '2',
      change: '',
      isPositive: true,
      icon: Globe,
    },
  ];

  const topHoldings = [
    { symbol: 'PETR4', name: 'Petrobras', quantity: 200, currentPrice: 'R$ 38,50', value: 'R$ 7.700,00', change: '+2.4%', isPositive: true },
    { symbol: 'VALE3', name: 'Vale', quantity: 100, currentPrice: 'R$ 68,20', value: 'R$ 6.820,00', change: '+1.8%', isPositive: true },
    { symbol: 'WEGE3', name: 'WEG', quantity: 150, currentPrice: 'R$ 35,40', value: 'R$ 5.310,00', change: '-0.5%', isPositive: false },
    { symbol: 'MGLU3', name: 'Magazine Luiza', quantity: 500, currentPrice: 'R$ 8,20', value: 'R$ 4.100,00', change: '+5.2%', isPositive: true },
    { symbol: 'BOVA11', name: 'ETF Ibovespa', quantity: 50, currentPrice: 'R$ 135,00', value: 'R$ 6.750,00', change: '+1.2%', isPositive: true },
  ];

  const marketIndices = [
    { name: 'Ibovespa', value: '128.450', change: '+0.85%', isPositive: true },
    { name: 'Dólar', value: 'R$ 5,05', change: '-0.20%', isPositive: false },
    { name: 'IFIX', value: '3.240', change: '+0.45%', isPositive: true },
    { name: 'S&P 500', value: '4.780', change: '+0.32%', isPositive: true },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Broker</h2>
        <p className="text-gray-400">Visão geral dos seus investimentos em ações</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#c4d82e]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/10 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#c4d82e]/10 rounded-xl">
                  <Icon className="text-[#c4d82e]" size={24} />
                </div>
                {stat.change && (
                  <span className={`text-sm font-medium ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Principais Ações */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Principais Posições</h3>
            <button className="text-[#c4d82e] hover:text-[#c4d82e]/80 text-sm font-medium transition-colors">
              Ver todas
            </button>
          </div>

          <div className="space-y-4">
            {topHoldings.map((holding, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-xl flex items-center justify-center text-black font-bold">
                    {holding.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{holding.symbol}</p>
                    <p className="text-gray-400 text-sm">{holding.quantity} cotas</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-semibold">{holding.value}</p>
                  <p className={`text-sm font-medium ${holding.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {holding.isPositive ? <TrendingUp className="inline w-4 h-4 mr-1" /> : <TrendingDown className="inline w-4 h-4 mr-1" />}
                    {holding.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Índices do Mercado */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Índices</h3>
            <BarChart3 className="text-[#c4d82e]" size={20} />
          </div>

          <div className="space-y-4">
            {marketIndices.map((index, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{index.name}</p>
                  <p className="text-gray-400 text-sm">{index.value}</p>
                </div>
                <span className={`text-sm font-medium ${index.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {index.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
