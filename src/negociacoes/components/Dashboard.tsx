import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      label: 'Valor Total',
      value: 'R$ 125.430,00',
      change: '+12.5%',
      isPositive: true,
      icon: Wallet,
    },
    {
      label: 'Retorno 24h',
      value: 'R$ 3.240,00',
      change: '+2.6%',
      isPositive: true,
      icon: TrendingUp,
    },
    {
      label: 'Operações Ativas',
      value: '8',
      change: '+2',
      isPositive: true,
      icon: Activity,
    },
    {
      label: 'Exchanges Conectadas',
      value: '3',
      change: '',
      isPositive: true,
      icon: Activity,
    },
  ];

  const topAssets = [
    { symbol: 'BTC', name: 'Bitcoin', amount: '0.5842', value: 'R$ 85.420,00', change: '+5.2%', isPositive: true },
    { symbol: 'ETH', name: 'Ethereum', amount: '2.145', value: 'R$ 28.340,00', change: '+3.8%', isPositive: true },
    { symbol: 'BNB', name: 'Binance Coin', amount: '15.82', value: 'R$ 8.920,00', change: '-1.2%', isPositive: false },
    { symbol: 'SOL', name: 'Solana', amount: '45.2', value: 'R$ 2.750,00', change: '+8.4%', isPositive: true },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-slate-400">Visão geral dos seus investimentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Icon className="text-blue-400" size={24} />
                </div>
                {stat.change && (
                  <span className={`text-sm font-medium ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Principais Ativos</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            Ver todos
          </button>
        </div>

        <div className="space-y-4">
          {topAssets.map((asset, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-semibold">{asset.name}</p>
                  <p className="text-slate-400 text-sm">{asset.amount} {asset.symbol}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-white font-semibold">{asset.value}</p>
                <p className={`text-sm font-medium ${asset.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.isPositive ? <TrendingUp className="inline w-4 h-4 mr-1" /> : <TrendingDown className="inline w-4 h-4 mr-1" />}
                  {asset.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
