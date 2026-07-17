import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Clock, 
  Calendar,
  Trophy, 
  Star, 
  Zap,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { oddsAPI, formatTime, formatDateTime, getBestOdds } from '../services/odds-api';
import { sportmonksAPI, BRAZILIAN_LEAGUES } from '../services/sportmonks-api';

interface LiveOdd {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number;
  startTimeISO: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  bookmaker: string;
  lastUpdate: number;
  isLive: boolean;
}

interface SelectedBet {
  id: string;
  team: string;
  odds: number;
  bookmaker: string;
}

export default function BettingLiveOdds() {
  const [odds, setOdds] = useState<LiveOdd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApi, setSelectedApi] = useState<'sportmonks' | 'theodds'>('sportmonks');
  const [selectedSport, setSelectedSport] = useState('soccer');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [bookmakerFilter, setBookmakerFilter] = useState('all');
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const [parlayCount, setParlayCount] = useState(1);
  const [parlayStake, setParlayStake] = useState(10);

  const sports = [
    { key: 'soccer', name: 'Futebol', icon: '⚽' },
    { key: 'basketball', name: 'Basquete', icon: '🏀' },
    { key: 'tennis', name: 'Tênis', icon: '🎾' },
    { key: 'mma', name: 'MMA', icon: '🥊' },
  ];

  const leagues = [...new Set(odds.map(o => o.league))];
  const bookmakers = [...new Set(odds.map(o => o.bookmaker))];

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔄 Buscando odds para ${selectedSport} usando ${selectedApi}...`);
      
      let data;
      if (selectedApi === 'sportmonks') {
        // Verificar se API key está configurada
        if (!sportmonksAPI.isConfigured()) {
          setError('⚠️ API Key SportMonks não configurada. Configure VITE_SPORTMONKS_API_KEY no arquivo .env');
          setLoading(false);
          return;
        }
        // Buscar odds do Brasileirão
        const sportmonksData = await sportmonksAPI.getOddsByDate(
          new Date().toISOString().split('T')[0],
          [BRAZILIAN_LEAGUES.CAMPEONATO_BRASILEIRO_SERIE_A]
        );
        // Mapear para formato interno
        data = sportmonksData.map((sm: any) => ({
          id: sm.id,
          sport: 'soccer',
          league: sm.league,
          homeTeam: sm.homeTeam,
          awayTeam: sm.awayTeam,
          startTime: typeof sm.startTime === 'number' ? sm.startTime : new Date(sm.startTime).getTime(),
          startTimeISO: sm.startTimeISO,
          homeOdds: sm.homeOdds,
          drawOdds: sm.drawOdds,
          awayOdds: sm.awayOdds,
          bookmaker: sm.bookmaker,
          lastUpdate: sm.lastUpdate,
          isLive: sm.isLive,
        }));
      } else {
        data = await oddsAPI.getOdds(selectedSport);
      }
      
      console.log(`✅ Recebidos ${data.length} eventos`);
      setOdds(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao carregar dados da API');
    } finally {
      setLoading(false);
    }
  }, [selectedSport, selectedApi]);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds, selectedApi]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto refresh...');
      fetchOdds();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOdds]);

  // Filtrar odds por data
  const filteredByDate = selectedDate 
    ? odds.filter(o => {
        const date = new Date(o.startTime);
        const filterDate = new Date(selectedDate);
        return date.toDateString() === filterDate.toDateString();
      })
    : odds;

  // Filtrar odds por hora
  const filteredByTime = selectedTime
    ? filteredByDate.filter(o => {
        const hour = new Date(o.startTime).getHours();
        const [startHour, endHour] = selectedTime.split('-').map(Number);
        return hour >= startHour && hour < endHour;
      })
    : filteredByDate;

  // Filtrar por liga
  const filteredByLeague = selectedLeague !== 'all'
    ? filteredByTime.filter(o => o.league === selectedLeague)
    : filteredByTime;

  // Filtrar por casa
  const filteredOdds = bookmakerFilter !== 'all'
    ? filteredByLeague.filter(o => o.bookmaker === bookmakerFilter)
    : filteredByLeague;

  const toggleBetSelection = (odd: LiveOdd, selection: 'home' | 'draw' | 'away') => {
    const teamName = selection === 'home' ? odd.homeTeam : selection === 'draw' ? 'Empate' : odd.awayTeam;
    const oddsValue = selection === 'home' ? odd.homeOdds : selection === 'draw' ? odd.drawOdds : odd.awayOdds;
    
    if (oddsValue <= 0) return;

    const betId = `${odd.id}-${selection}`;
    const existingIndex = selectedBets.findIndex(b => b.id === betId);
    
    if (existingIndex >= 0) {
      setSelectedBets(selectedBets.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedBets([...selectedBets, {
        id: betId,
        team: `${odd.homeTeam} x ${odd.awayTeam} - ${teamName}`,
        odds: oddsValue,
        bookmaker: odd.bookmaker
      }]);
    }
  };

  const isBetSelected = (odd: LiveOdd, selection: 'home' | 'draw' | 'away') => {
    const betId = `${odd.id}-${selection}`;
    return selectedBets.some(b => b.id === betId);
  };

  const calculateParlayOdds = () => {
    if (selectedBets.length < 2) return 0;
    return selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  };

  const totalParlayOdds = calculateParlayOdds();
  const totalStake = parlayCount * parlayStake;
  const potentialReturn = totalParlayOdds * totalStake;
  const profit = potentialReturn - totalStake;

  const clearSelection = () => setSelectedBets([]);

  // Ordenar por data
  const sortedOdds = [...filteredOdds].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Odds em Tempo Real</h2>
          <p className="text-slate-400">Dados reais da API - Brasileirão e mais</p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-slate-400 text-sm">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="text-red-400" size={20} />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-slate-400 text-xs">Eventos Encontrados</p>
          <p className="text-2xl font-bold text-white">{odds.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-slate-400 text-xs">Ao Vivo</p>
          <p className="text-2xl font-bold text-red-400">{odds.filter(o => o.isLive).length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-slate-400 text-xs">Próximos 24h</p>
          <p className="text-2xl font-bold text-yellow-400">
            {odds.filter(o => o.startTime > Date.now() && o.startTime < Date.now() + 24*60*60*1000).length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-slate-400 text-xs">Casas de Odds</p>
          <p className="text-2xl font-bold text-blue-400">{bookmakers.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* API Selector */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block flex items-center gap-2">
              <Settings className="w-4 h-4" /> API
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedApi('sportmonks');
                  setSelectedBets([]);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  selectedApi === 'sportmonks'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                🏆 SportMonks
              </button>
              <button
                onClick={() => {
                  setSelectedApi('theodds');
                  setSelectedBets([]);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  selectedApi === 'theodds'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                📊 Odds API
              </button>
            </div>
          </div>

          {/* Esporte */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Esporte</label>
            <div className="flex gap-2">
              {sports.map(sport => (
                <button
                  key={sport.key}
                  onClick={() => {
                    setSelectedSport(sport.key);
                    setSelectedBets([]);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedSport === sport.key
                      ? 'bg-yellow-500 text-black'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {sport.icon} {sport.name}
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Hora */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Horário</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="">Todos os horários</option>
              <option value="0-6">Madrugada (00h-06h)</option>
              <option value="6-12">Manhã (06h-12h)</option>
              <option value="12-18">Tarde (12h-18h)</option>
              <option value="18-24">Noite (18h-24h)</option>
            </select>
          </div>

          {/* Liga */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Liga</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">Todas as ligas</option>
              {leagues.map(league => (
                <option key={league} value={league}>{league}</option>
              ))}
            </select>
          </div>

          {/* Casa */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Casa de Aposta</label>
            <select
              value={bookmakerFilter}
              onChange={(e) => setBookmakerFilter(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">Todas as casas</option>
              {bookmakers.map(bm => (
                <option key={bm} value={bm}>{bm}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {autoRefresh ? `Auto (${refreshInterval}s)` : 'Manual'}
          </button>
          
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600"
            >
              <option value={10}>10 segundos</option>
              <option value={30}>30 segundos</option>
              <option value={60}>60 segundos</option>
            </select>
          )}
          
          <button
            onClick={fetchOdds}
            disabled={loading}
            className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar Agora
          </button>
        </div>
      </div>

      {/* Card de Múltipla */}
      {selectedBets.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={24} />
              <h3 className="text-xl font-bold text-white">Múltipla Selecionada ({selectedBets.length} jogos)</h3>
            </div>
            <button
              onClick={clearSelection}
              className="text-slate-400 hover:text-white text-sm"
            >
              Limpar
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {selectedBets.map((bet, index) => (
              <div key={bet.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-white text-sm">{bet.team}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">{bet.bookmaker}</span>
                  <span className="text-green-400 font-bold">{bet.odds.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculadora */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Qtd Múltiplas</label>
              <input
                type="number"
                min={1}
                max={100}
                value={parlayCount}
                onChange={(e) => setParlayCount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Valor por Múltipla</label>
              <input
                type="number"
                min={1}
                value={parlayStake}
                onChange={(e) => setParlayStake(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Total Investido</label>
              <div className="bg-slate-900/50 rounded-lg px-4 py-2 text-white font-bold">
                R$ {totalStake.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Retorno Potencial</label>
              <div className={`rounded-lg px-4 py-2 font-bold ${potentialReturn > totalStake ? 'text-green-400' : 'text-red-400'}`}>
                R$ {potentialReturn.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div>
              <span className="text-slate-400 text-sm">Odds Total: </span>
              <span className="text-yellow-400 font-bold text-xl">{totalParlayOdds.toFixed(2)}x</span>
            </div>
            <div>
              <span className="text-slate-400 text-sm">Lucro: </span>
              <span className={`font-bold text-xl ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                R$ {profit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Odds */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {sports.find(s => s.key === selectedSport)?.name} - {sortedOdds.length} jogos encontrados
            </h3>
            <div className="flex items-center gap-2">
              {loading && <RefreshCw className="animate-spin text-yellow-400" size={18} />}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700">
          {loading && odds.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="animate-spin mx-auto text-yellow-400 mb-4" size={32} />
              <p className="text-slate-400">Carregando dados da API...</p>
            </div>
          ) : sortedOdds.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto text-slate-600 mb-4" size={32} />
              <p className="text-slate-400">Nenhum jogo encontrado</p>
              <p className="text-slate-500 text-sm mt-2">Tente selecionar outro esporte ou filtro</p>
            </div>
          ) : (
            sortedOdds.map((odd) => {
              const bestOdds = getBestOdds(odd.homeOdds, odd.drawOdds, odd.awayOdds);
              const now = Date.now();
              const isUpcoming = odd.startTime > now;
              const hoursUntil = Math.round((odd.startTime - now) / (1000 * 60 * 60));
              
              return (
                <div key={odd.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {odd.isLive && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          AO VIVO
                        </span>
                      )}
                      <span className="text-slate-400 text-sm">{odd.league}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="text-slate-500" size={14} />
                      <span className="text-yellow-400 text-sm font-medium">
                        {formatDateTime(odd.startTimeISO)}
                      </span>
                      {isUpcoming && hoursUntil <= 24 && (
                        <span className="text-slate-500 text-xs">
                          ({hoursUntil}h)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-white font-medium">{odd.homeTeam}</p>
                      <p className="text-white font-medium">{odd.awayTeam}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">{odd.bookmaker}</span>
                      {bestOdds.value > 0 && (
                        <Star className="text-yellow-400 fill-yellow-400" size={14} />
                      )}
                    </div>
                  </div>

                  {/* Odds Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => toggleBetSelection(odd, 'home')}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        isBetSelected(odd, 'home')
                          ? 'bg-green-500 text-white'
                          : odd.homeOdds > 0
                            ? odd.homeOdds === bestOdds.value && bestOdds.type === 'home'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      disabled={odd.homeOdds <= 0}
                    >
                      <div className="text-xs text-slate-400 mb-1">1</div>
                      <div>{odd.homeOdds > 0 ? odd.homeOdds.toFixed(2) : '-'}</div>
                    </button>

                    <button
                      onClick={() => toggleBetSelection(odd, 'draw')}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        isBetSelected(odd, 'draw')
                          ? 'bg-green-500 text-white'
                          : odd.drawOdds > 0
                            ? 'bg-slate-700 text-white hover:bg-slate-600'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      disabled={odd.drawOdds <= 0}
                    >
                      <div className="text-xs text-slate-400 mb-1">X</div>
                      <div>{odd.drawOdds > 0 ? odd.drawOdds.toFixed(2) : '-'}</div>
                    </button>

                    <button
                      onClick={() => toggleBetSelection(odd, 'away')}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        isBetSelected(odd, 'away')
                          ? 'bg-green-500 text-white'
                          : odd.awayOdds > 0
                            ? odd.awayOdds === bestOdds.value && bestOdds.type === 'away'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      disabled={odd.awayOdds <= 0}
                    >
                      <div className="text-xs text-slate-400 mb-1">2</div>
                      <div>{odd.awayOdds > 0 ? odd.awayOdds.toFixed(2) : '-'}</div>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
