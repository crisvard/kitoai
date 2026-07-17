import { BarChart3, TrendingUp, TrendingDown, Target, Calendar, Download, Percent, Award, Zap } from 'lucide-react';

export default function BettingStats() {
  const record = {
    biggestWin: 2500,
    biggestLoss: -800,
    longestWinStreak: 8,
    longestLoseStreak: 3,
    averageOdds: 2.15,
    averageStake: 250,
  };

  const milestones = [
    { title: 'Primeiro Profit', achieved: true, date: '15/01/2026' },
    { title: 'R$ 1.000 de Lucro', achieved: true, date: '28/01/2026' },
    { title: '10 Apostas Seguidas', achieved: true, date: '10/02/2026' },
    { title: 'R$ 5.000 de Lucro', achieved: false, date: '-' },
    { title: '100 Apostas', achieved: false, date: '-' },
    { title: 'ROI 30% Mensal', achieved: true, date: '15/03/2026' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Estatísticas</h2>
        <p className="text-gray-400">Métricas detalhadas das suas apostas</p>
      </div>

      {/* Recordes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-400" size={18} />
            <span className="text-gray-400 text-sm">Maior Vitória</span>
          </div>
          <p className="text-2xl font-bold text-green-400">+R$ {record.biggestWin}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-400" size={18} />
            <span className="text-gray-400 text-sm">Maior Perda</span>
          </div>
          <p className="text-2xl font-bold text-red-400">-R$ {Math.abs(record.biggestLoss)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-[#c4d82e]" size={18} />
            <span className="text-gray-400 text-sm">Sequência Vitória</span>
          </div>
          <p className="text-2xl font-bold text-white">{record.longestWinStreak}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="text-blue-400" size={18} />
            <span className="text-gray-400 text-sm">Odds Média</span>
          </div>
          <p className="text-2xl font-bold text-white">{record.averageOdds}x</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conquistas */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Conquistas</h3>
            <Award className="text-[#c4d82e]" size={20} />
          </div>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  milestone.achieved
                    ? 'bg-[#c4d82e]/10 border-[#c4d82e]/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.achieved ? 'bg-[#c4d82e]' : 'bg-white/10'
                    }`}>
                      {milestone.achieved ? (
                        <Award className="text-black" size={16} />
                      ) : (
                        <Zap className="text-gray-400" size={16} />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${milestone.achieved ? 'text-white' : 'text-gray-400'}`}>
                        {milestone.title}
                      </p>
                      {milestone.achieved && (
                        <p className="text-[#c4d82e] text-xs">{milestone.date}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm ${
                    milestone.achieved ? 'text-[#c4d82e]' : 'text-gray-500'
                  }`}>
                    {milestone.achieved ? 'Conquistado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Estatísticas Gerais</h3>
            <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
              <Download size={18} />
              Exportar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Apostas', value: '155' },
              { label: 'Vitórias', value: '102' },
              { label: 'Derrotas', value: '53' },
              { label: 'Taxa Acerto', value: '68%' },
              { label: 'Stake Média', value: 'R$ 274' },
              { label: 'ROI Médio', value: '16.9%' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
