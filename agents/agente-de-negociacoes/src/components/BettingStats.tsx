import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, Calendar, Download, Percent, Award, Zap, AlertCircle } from 'lucide-react';

interface SavedBet {
  id: string;
  oddsId: string;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  placedAt: number;
  status: 'pending' | 'won' | 'lost';
}

export default function BettingStats() {
  const [bets, setBets] = useState<SavedBet[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('user_bets');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBets(parsed);
      } catch (e) {
        console.error('Erro ao carregar apostas:', e);
      }
    }
  }, []);

  // Calcular estatísticas
  const settledBets = bets.filter(b => b.status === 'won' || b.status === 'lost');
  const wonBets = bets.filter(b => b.status === 'won');
  const lostBets = bets.filter(b => b.status === 'lost');
  const pendingBets = bets.filter(b => b.status === 'pending');
  
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalWon = wonBets.reduce((sum, b) => sum + (b.stake * b.odds), 0);
  const totalLost = lostBets.reduce((sum, b) => sum + b.stake, 0);
  const profit = totalWon - totalLost;
  const winRate = settledBets.length > 0 ? Math.round((wonBets.length / settledBets.length) * 100) : 0;
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;

  // Maiores vitórias e perdas
  const biggestWin = wonBets.length > 0 
    ? Math.max(...wonBets.map(b => b.stake * b.odds - b.stake)) 
    : 0;
  const biggestLoss = lostBets.length > 0 
    ? Math.min(...lostBets.map(b => -b.stake)) 
    : 0;

  // Calcular sequências
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  const sortedBets = [...bets].sort((a, b) => b.placedAt - a.placedAt);
  
  for (const bet of sortedBets) {
    if (bet.status === 'won') {
      currentWinStreak++;
      currentLoseStreak = 0;
    } else if (bet.status === 'lost') {
      currentLoseStreak++;
      currentWinStreak = 0;
    } else {
      break;
    }
  }

  const longestWinStreak = currentWinStreak; // Simplified
  const longestLoseStreak = currentLoseStreak;

  const averageOdds = settledBets.length > 0 
    ? (settledBets.reduce((sum, b) => sum + b.odds, 0) / settledBets.length) 
    : 0;
  const averageStake = bets.length > 0 ? totalStaked / bets.length : 0;

  // Conquistas
  const milestones = [
    { title: 'Primeira Aposta', achieved: bets.length > 0, date: bets.length > 0 ? new Date(bets[0].placedAt).toLocaleDateString('pt-BR') : '-' },
    { title: '10 Apostas', achieved: bets.length >= 10, date: '-' },
    { title: '50 Apostas', achieved: bets.length >= 50, date: '-' },
    { title: 'R$ 1.000 de Lucro', achieved: profit >= 1000, date: '-' },
    { title: 'R$ 5.000 de Lucro', achieved: profit >= 5000, date: '-' },
    { title: 'Taxa 70%', achieved: winRate >= 70, date: '-' },
  ];

  if (bets.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Estatísticas</h2>
          <p className="text-slate-400">Métricas detalhadas das suas apostas</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto text-blue-400 mb-4" size={48} />
          <h3 className="text-white font-bold text-xl mb-2">Nenhuma Aposta Registrada</h3>
          <p className="text-slate-400">
            Suas estatísticas aparecerão aqui quando você começar a fazer apostas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Estatísticas</h2>
        <p className="text-slate-400">Métricas detalhadas das suas apostas</p>
      </div>

      {/* Recordes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-400" size={18} />
            <span className="text-slate-400 text-sm">Maior Vitória</span>
          </div>
          <p className="text-2xl font-bold text-green-400">R$ {biggestWin.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-400" size={18} />
            <span className="text-slate-400 text-sm">Maior Perda</span>
          </div>
          <p className="text-2xl font-bold text-red-400">R$ {Math.abs(biggestLoss).toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-yellow-400" size={18} />
            <span className="text-slate-400 text-sm">Sequência Vitória</span>
          </div>
          <p className="text-2xl font-bold text-white">{longestWinStreak}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="text-blue-400" size={18} />
            <span className="text-slate-400 text-sm">Odds Média</span>
          </div>
          <p className="text-2xl font-bold text-white">{averageOdds.toFixed(2)}x</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas Gerais */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Resumo Geral</h3>
            <BarChart3 className="text-yellow-400" size={20} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Total Apostado</span>
              <span className="text-white font-bold">R$ {totalStaked.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Total Retorno</span>
              <span className="text-green-400 font-bold">R$ {totalWon.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Lucro Total</span>
              <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                R$ {profit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">ROI Total</span>
              <span className={`font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Conquistas */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Conquistas</h3>
            <Award className="text-yellow-400" size={20} />
          </div>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  milestone.achieved
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-900/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.achieved ? 'bg-green-500' : 'bg-slate-700'
                    }`}>
                      {milestone.achieved ? (
                        <Award className="text-white" size={16} />
                      ) : (
                        <Zap className="text-slate-400" size={16} />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${milestone.achieved ? 'text-white' : 'text-slate-400'}`}>
                        {milestone.title}
                      </p>
                      {milestone.achieved && milestone.date !== '-' && (
                        <p className="text-green-400 text-xs">{milestone.date}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm ${
                    milestone.achieved ? 'text-green-400' : 'text-slate-500'
                  }`}>
                    {milestone.achieved ? 'Conquistado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Estatísticas Gerais</h3>
          <button className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
            <Download size={18} />
            Exportar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Total Apostas</p>
            <p className="text-2xl font-bold text-white">{bets.length}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Vitórias</p>
            <p className="text-2xl font-bold text-green-400">{wonBets.length}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Derrotas</p>
            <p className="text-2xl font-bold text-red-400">{lostBets.length}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Taxa Acerto</p>
            <p className="text-2xl font-bold text-white">{winRate}%</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Stake Média</p>
            <p className="text-2xl font-bold text-white">R$ {averageStake.toFixed(0)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">ROI Médio</p>
            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
