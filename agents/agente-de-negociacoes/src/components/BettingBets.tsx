import { useState, useEffect } from 'react';
import { Filter, Download, Target, AlertCircle } from 'lucide-react';

interface SavedBet {
  id: string;
  oddsId: string;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  placedAt: number;
  status: 'pending' | 'won' | 'lost';
  sport: string;
}

export default function BettingBets() {
  const [filter, setFilter] = useState('all');
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

  const filteredBets = filter === 'all' 
    ? bets 
    : filter === 'open' 
      ? bets.filter(b => b.status === 'pending')
      : bets.filter(b => b.status === 'won' || b.status === 'lost');

  const summary = {
    totalBets: bets.length,
    wins: bets.filter(b => b.status === 'won').length,
    losses: bets.filter(b => b.status === 'lost').length,
    openBets: bets.filter(b => b.status === 'pending').length,
    totalStaked: bets.reduce((acc, b) => acc + b.stake, 0),
    totalProfit: bets.filter(b => b.status === 'won').reduce((acc, b) => acc + (b.stake * b.odds - b.stake), 0) - bets.filter(b => b.status === 'lost').reduce((acc, b) => acc + b.stake, 0),
    roi: 0,
  };

  summary.roi = summary.totalStaked > 0 ? (summary.totalProfit / summary.totalStaked) * 100 : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Minhas Apostas</h2>
        <p className="text-slate-400">Histórico completo de todas as suas apostas</p>
      </div>

      {/* Sem Apostas */}
      {bets.length === 0 ? (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto text-blue-400 mb-4" size={48} />
          <h3 className="text-white font-bold text-xl mb-2">Nenhuma Aposta Registrada</h3>
          <p className="text-slate-400">
            Vá até "Odds em Tempo Real" ou "Gerar Múltiplas" para fazer suas apostas.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-1">Total Apostas</p>
              <p className="text-2xl font-bold text-white">{summary.totalBets}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-1">Vitórias</p>
              <p className="text-2xl font-bold text-green-400">{summary.wins}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-1">Derrotas</p>
              <p className="text-2xl font-bold text-red-400">{summary.losses}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-1">Abertas</p>
              <p className="text-2xl font-bold text-yellow-400">{summary.openBets}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-1">Total Apostado</p>
              <p className="text-xl font-bold text-white">R$ {summary.totalStaked.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-1">Lucro Total</p>
              <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.totalProfit >= 0 ? '+' : ''}R$ {summary.totalProfit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Filter className="text-slate-400" size={20} />
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'all' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilter('open')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'open' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Abertas
                  </button>
                  <button
                    onClick={() => setFilter('settled')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'settled' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Encerradas
                  </button>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
                <Download size={18} />
                Exportar
              </button>
            </div>

            {/* Lista de Apostas */}
            <div className="space-y-3">
              {filteredBets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">Nenhuma aposta encontrada</p>
                </div>
              ) : (
                filteredBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-yellow-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">{bet.sport}</span>
                        <span className="text-slate-400 text-sm">
                          {new Date(bet.placedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bet.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : bet.status === 'won'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}>
                        {bet.status === 'pending' ? 'Pendente' : bet.status === 'won' ? 'Ganhou' : 'Perdeu'}
                      </span>
                    </div>
                    
                    <p className="text-white font-medium mb-1">{bet.match}</p>
                    <p className="text-slate-400 text-sm mb-3">{bet.selection} @ {bet.odds}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-sm">Stake: </span>
                        <span className="text-white font-medium">R$ {bet.stake.toFixed(2)}</span>
                      </div>
                      {(bet.status === 'won' || bet.status === 'lost') && (
                        <span className={`font-medium ${bet.status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                          {bet.status === 'won' ? '+' : '-'}R$ {Math.abs(bet.stake * (bet.odds - 1)).toFixed(2)}
                        </span>
                      )}
                      {bet.status === 'pending' && (
                        <span className="text-yellow-400 font-medium">Potencial: R$ {(bet.stake * bet.odds).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
