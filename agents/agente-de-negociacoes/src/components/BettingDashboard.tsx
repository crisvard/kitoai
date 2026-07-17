import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Wallet, 
  Trophy, 
  Target, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Zap
} from 'lucide-react';
import { oddsAPI } from '../services/odds-api';

interface Bet {
  id: string;
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potential: number;
  status: 'pending' | 'won' | 'lost';
  sport: string;
}

interface SavedBet {
  id: string;
  oddsId: string;
  selection: string;
  odds: number;
  stake: number;
  placedAt: number;
  status: 'pending' | 'won' | 'lost';
}

export default function BettingDashboard() {
  const [odds, setOdds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedBets, setSavedBets] = useState<SavedBet[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Carregar apostas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user_bets');
    if (stored) {
      try {
        const bets = JSON.parse(stored);
        setSavedBets(bets);
      } catch (e) {
        console.error('Erro ao carregar apostas:', e);
      }
    }
  }, []);

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await oddsAPI.getOdds('soccer');
      setOdds(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar odds:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  // Calcular estatísticas baseadas nas apostas salvas
  const totalStaked = savedBets.reduce((sum, b) => sum + b.stake, 0);
  const wonBets = savedBets.filter(b => b.status === 'won');
  const pendingBets = savedBets.filter(b => b.status === 'pending');
  
  const totalWon = wonBets.reduce((sum, b) => sum + (b.stake * b.odds), 0);
  const profit = totalWon - totalStaked;
  const winRate = savedBets.length > 0 
    ? Math.round((wonBets.length / savedBets.length) * 100) 
    : 0;

  // Próximos jogos do Brasileirão
  const upcomingGames = odds.slice(0, 5);

  const stats = [
    {
      label: 'Total Apostado',
      value: totalStaked > 0 ? `R$ ${totalStaked.toFixed(2)}` : 'R$ 0,00',
      change: '',
      isPositive: true,
      icon: Wallet,
    },
    {
      label: 'Lucro Total',
      value: profit >= 0 ? `R$ ${profit.toFixed(2)}` : `R$ ${profit.toFixed(2)}`,
      change: profit >= 0 ? '+' : '',
      isPositive: profit >= 0,
      icon: TrendingUp,
    },
    {
      label: 'Apostas Abertas',
      value: pendingBets.length.toString(),
      change: '',
      isPositive: true,
      icon: Target,
    },
    {
      label: 'Taxa de Acerto',
      value: savedBets.length > 0 ? `${winRate}%` : '0%',
      change: '',
      isPositive: winRate >= 50,
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Apostas</h2>
        <p className="text-slate-400">
          {savedBets.length > 0 
            ? `Você tem ${savedBets.length} aposta(s) registrada(s)` 
            : 'Nenhuma aposta registrada ainda'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-yellow-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <Icon className="text-yellow-400" size={24} />
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

      {/* Sem dados cadastrados */}
      {savedBets.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-400 mt-1" size={24} />
            <div>
              <h3 className="text-white font-bold mb-2">Bem-vindo ao Gerenciador de Apostas!</h3>
              <p className="text-slate-400 text-sm mb-4">
                Você ainda não tem apostas cadastradas. Use a aba <strong>"Odds em Tempo Real"</strong> para ver jogos reais e fazer suas apostas, ou <strong>"Gerar Múltiplas"</strong> para criar combinações.
              </p>
              <p className="text-slate-500 text-xs">
                As estatísticas acima serão preenchidas automaticamente quando você salvar suas apostas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apostas Abertas */}
      {pendingBets.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Suas Apostas Abertas</h3>
            <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors">
              Ver todas
            </button>
          </div>

          <div className="space-y-4">
            {pendingBets.map((bet) => (
              <div
                key={bet.id}
                className="p-4 bg-slate-900/50 rounded-xl border border-yellow-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Pendente</span>
                  <span className="text-yellow-400 text-sm font-medium">{bet.odds}x</span>
                </div>
                <p className="text-white font-medium mb-2">{bet.selection}</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Stake: R$ {bet.stake.toFixed(2)}</span>
                  <span className="text-green-400 font-medium">Potencial: R$ {(bet.stake * bet.odds).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos Eventos Reais */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Próximos Jogos Reais</h3>
            {loading && <RefreshCw className="animate-spin text-yellow-400" size={18} />}
          </div>
          <button 
            onClick={fetchOdds}
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {upcomingGames.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum jogo encontrado no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((event) => (
              <div key={event.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-yellow-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">{event.league}</span>
                  <span className="text-yellow-400 text-xs">{event.bookmaker}</span>
                </div>
                <p className="text-white font-medium mb-3">{event.homeTeam} x {event.awayTeam}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-green-500/20 text-green-400 py-2 rounded text-sm font-medium hover:bg-green-500/30">
                    {event.homeOdds.toFixed(2)}
                  </button>
                  <button className="bg-slate-700 text-slate-300 py-2 rounded text-sm font-medium hover:bg-slate-600">
                    {event.drawOdds > 0 ? event.drawOdds.toFixed(2) : '-'}
                  </button>
                  <button className="bg-red-500/20 text-red-400 py-2 rounded text-sm font-medium hover:bg-red-500/30">
                    {event.awayOdds.toFixed(2)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
