import { Activity, TrendingUp, TrendingDown, Target, PieChart, BarChart3, Zap } from 'lucide-react';

export default function BettingAnalysis() {
  const sports = [
    { name: 'Futebol', bets: 45, winRate: 72, profit: 2800, roi: 24 },
    { name: 'Tênis', bets: 15, winRate: 60, profit: 450, roi: 12 },
    { name: 'Basquete', bets: 12, winRate: 58, profit: -200, roi: -5 },
    { name: 'F1', bets: 8, winRate: 75, profit: 600, roi: 30 },
  ];

  const markets = [
    { name: 'Resultado Final', bets: 35, winRate: 65, profit: 1200, roi: 18 },
    { name: 'Handicap', bets: 20, winRate: 55, profit: -150, roi: -3 },
    { name: 'Over/Under', bets: 18, winRate: 62, profit: 850, roi: 22 },
    { name: 'Ambas Marcam', bets: 15, winRate: 70, profit: 1100, roi: 35 },
    { name: 'Escanteios', bets: 12, winRate: 58, profit: 300, roi: 10 },
  ];

  const trends = [
    { date: 'Seg', value: 120 },
    { date: 'Ter', value: 85 },
    { date: 'Qua', value: 150 },
    { date: 'Qui', value: 95 },
    { date: 'Sex', value: 180 },
    { date: 'Sáb', value: 220 },
    { date: 'Dom', value: 165 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Análise</h2>
        <p className="text-slate-400">Estatísticas e análises detalhadas</p>
      </div>

      {/* Por Esporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Por Esporte</h3>
            <Activity className="text-yellow-400" size={20} />
          </div>

          <div className="space-y-4">
            {sports.map((sport, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{sport.name}</span>
                  <span className={`font-medium ${sport.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sport.profit > 0 ? '+' : ''}R$ {sport.profit}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">{sport.bets} Apostas</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-400">Taxa: {sport.winRate}%</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-yellow-400">ROI: {sport.roi}%</span>
                </div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${sport.profit > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.abs(sport.roi)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por Mercado */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Por Mercado</h3>
            <PieChart className="text-yellow-400" size={20} />
          </div>

          <div className="space-y-4">
            {markets.map((market, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{market.name}</span>
                  <span className={`font-medium ${market.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {market.profit > 0 ? '+' : ''}R$ {market.profit}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">{market.bets} Apostas</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-400">Taxa: {market.winRate}%</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-yellow-400">ROI: {market.roi}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendência Semanal */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Lucro nos Últimos 7 Dias</h3>
          <BarChart3 className="text-yellow-400" size={20} />
        </div>

        <div className="flex items-end justify-between gap-2 h-48">
          {trends.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-yellow-500/50 rounded-t-lg transition-all hover:bg-yellow-500"
                style={{ height: `${(day.value / 250) * 100}%` }}
              ></div>
              <span className="text-slate-400 text-xs mt-2">{day.date}</span>
              <span className="text-white text-xs font-medium">R$ {day.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dicas */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Zap className="text-yellow-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-green-400 font-medium mb-2">✅ Melhor Esporte</p>
            <p className="text-white">Futebol com 72% de taxa de acerto e ROI de 24%</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-yellow-400 font-medium mb-2">⚠️ Cuidado</p>
            <p className="text-white">Basquete está com ROI negativo. Considere reduzir apostas.</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-blue-400 font-medium mb-2">💡 Oportunidade</p>
            <p className="text-white">Mercado "Ambas Marcam" tem o melhor ROI: 35%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
