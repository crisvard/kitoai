import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Clock, 
  Calculator, 
  Trophy, 
  TrendingUp,
  DollarSign,
  Settings,
  Copy,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Filter,
  Calendar,
  Building2
} from 'lucide-react';
import { oddsAPI, formatTime, formatDateTime, getBestOdds, calculateParlay } from '../services/odds-api';

interface Odd {
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

interface ParlayBet {
  id: string;
  matchId: string;
  selection: 'home' | 'draw' | 'away';
  team: string;
  odds: number;
  bookmaker: string;
}

interface Parlay {
  id: string;
  bets: ParlayBet[];
  totalOdds: number;
  stake: number;
  potentialReturn: number;
}

interface BookmakerParlay {
  name: string;
  parlays: Parlay[];
  totalStake: number;
  totalReturn: number;
}

export default function BettingParlayBuilder() {
  const [odds, setOdds] = useState<Odd[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Configurações do usuário
  const [selectedSport, setSelectedSport] = useState('soccer');
  const [parlayCount, setParlayCount] = useState(5);
  const [stakePerParlay, setStakePerParlay] = useState(10);
  const [totalBudget, setTotalBudget] = useState(50);
  const [distributionType, setDistributionType] = useState<'equal' | 'custom'>('equal');
  const [minOdds, setMinOdds] = useState(1.5);
  const [maxOdds, setMaxOdds] = useState(10);
  const [betsPerParlay, setBetsPerParlay] = useState(3);
  
  // Seleção de apostas
  const [selectedBets, setSelectedBets] = useState<ParlayBet[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  
  // Resultados
  const [generatedParlays, setGeneratedParlays] = useState<Parlay[]>([]);
  const [bookmakerResults, setBookmakerResults] = useState<BookmakerParlay[]>([]);
  
  // Filtros
  const [filterBookmaker, setFilterBookmaker] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const sports = [
    { key: 'soccer', name: 'Futebol', icon: '⚽' },
    { key: 'basketball', name: 'Basquete', icon: '🏀' },
    { key: 'tennis', name: 'Tênis', icon: '🎾' },
    { key: 'mma', name: 'MMA', icon: '🥊' },
  ];

  const bookmakers = [...new Set(odds.map(o => o.bookmaker))];

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await oddsAPI.getOdds(selectedSport);
      setOdds(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar odds:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  // Calcular total investido automaticamente
  useEffect(() => {
    if (distributionType === 'equal') {
      setTotalBudget(parlayCount * stakePerParlay);
    }
  }, [parlayCount, stakePerParlay, distributionType]);

  // Gerar múltiplas automaticamente
  const generateParlays = () => {
    const filteredOdds = odds.filter(o => {
      const maxOdd = Math.max(o.homeOdds, o.drawOdds, o.awayOdds);
      return maxOdd >= minOdds && maxOdd <= maxOdds;
    });

    if (filterBookmaker !== 'all') {
      filteredOdds.filter(o => o.bookmaker === filterBookmaker);
    }

    const newParlays: Parlay[] = [];
    const newBookmakerResults: BookmakerParlay[] = [];
    
    // Agrupar por bookmaker
    const bookmakerGroups: Record<string, Odd[]> = {};
    filteredOdds.forEach(o => {
      if (!bookmakerGroups[o.bookmaker]) {
        bookmakerGroups[o.bookmaker] = [];
      }
      bookmakerGroups[o.bookmaker].push(o);
    });

    // Gerar múltiplas para cada bookmaker
    Object.entries(bookmakerGroups).forEach(([bookmaker, bookmakerOdds]) => {
      const bookmakerParlays: Parlay[] = [];
      
      for (let i = 0; i < Math.min(parlayCount, 10); i++) {
        // Selecionar jogos aleatórios
        const shuffled = [...bookmakerOdds].sort(() => Math.random() - 0.5);
        const selectedGames = shuffled.slice(0, Math.min(betsPerParlay, shuffled.length));
        
        if (selectedGames.length < 2) continue;

        const parlayBets: ParlayBet[] = [];
        let totalOdds = 1;

        selectedGames.forEach(game => {
          const best = getBestOdds(game.homeOdds, game.drawOdds, game.awayOdds);
          const selection = best.type as 'home' | 'draw' | 'away';
          const teamName = selection === 'home' ? game.homeTeam : selection === 'draw' ? 'Empate' : game.awayTeam;
          
          parlayBets.push({
            id: `${game.id}-${selection}-${i}`,
            matchId: game.id,
            selection,
            team: teamName,
            odds: best.value,
            bookmaker: game.bookmaker
          });
          
          totalOdds *= best.value;
        });

        const stake = distributionType === 'equal' ? stakePerParlay : stakePerParlay;
        
        bookmakerParlays.push({
          id: `parlay-${bookmaker}-${i}`,
          bets: parlayBets,
          totalOdds,
          stake,
          potentialReturn: stake * totalOdds
        });
      }

      if (bookmakerParlays.length > 0) {
        newBookmakerResults.push({
          name: bookmaker,
          parlays: bookmakerParlays,
          totalStake: bookmakerParlays.reduce((sum, p) => sum + p.stake, 0),
          totalReturn: bookmakerParlays.reduce((sum, p) => sum + p.potentialReturn, 0)
        });
      }
    });

    setGeneratedParlays(newParlays);
    setBookmakerResults(newBookmakerResults);
  };

  // Alternar seleção de aposta
  const toggleBetSelection = (odd: Odd, selection: 'home' | 'draw' | 'away') => {
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
        matchId: odd.id,
        selection,
        team: `${odd.homeTeam} x ${odd.awayTeam} - ${teamName}`,
        odds: oddsValue,
        bookmaker: odd.bookmaker
      }]);
    }
  };

  // Criar múltipla manual
  const createManualParlay = () => {
    if (selectedBets.length < 2) return;

    const totalOdds = selectedBets.reduce((acc, b) => acc * b.odds, 1);
    const newParlay: Parlay = {
      id: `parlay-manual-${Date.now()}`,
      bets: [...selectedBets],
      totalOdds,
      stake: stakePerParlay,
      potentialReturn: stakePerParlay * totalOdds
    };

    setGeneratedParlays([...generatedParlays, newParlay]);
    setSelectedBets([]);
  };

  const totalInvestido = bookmakerResults.reduce((sum, b) => sum + b.totalStake, 0) || 
    (distributionType === 'equal' ? parlayCount * stakePerParlay : totalBudget);
  
  const retornoTotal = bookmakerResults.reduce((sum, b) => sum + b.totalReturn, 0);
  const lucroTotal = retornoTotal - totalInvestido;

  const clearAll = () => {
    setGeneratedParlays([]);
    setBookmakerResults([]);
    setSelectedBets([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Gerador de Múltiplas</h2>
          <p className="text-slate-400">Crie e gerencie suas apostas múltiplas</p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-slate-400 text-sm">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={fetchOdds}
            disabled={loading}
            className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar Odds
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-yellow-400" size={20} />
          <h3 className="text-xl font-bold text-white">Configurações</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantidade de Múltiplas */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Quantidade de Múltiplas</label>
            <input
              type="number"
              min={1}
              max={50}
              value={parlayCount}
              onChange={(e) => setParlayCount(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Valor por Múltipla */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Valor por Múltipla (R$)</label>
            <input
              type="number"
              min={1}
              value={stakePerParlay}
              onChange={(e) => setStakePerParlay(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Total Investido */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Total a Investir (R$)</label>
            <input
              type="number"
              min={1}
              value={totalBudget}
              onChange={(e) => {
                setTotalBudget(Number(e.target.value));
                setDistributionType('custom');
              }}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Apostas por Múltipla */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Apostas por Múltipla</label>
            <input
              type="number"
              min={2}
              max={10}
              value={betsPerParlay}
              onChange={(e) => setBetsPerParlay(Math.max(2, Number(e.target.value)))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Odds Mínimas */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Odds Mínimas</label>
            <input
              type="number"
              min={1.1}
              step={0.1}
              value={minOdds}
              onChange={(e) => setMinOdds(Number(e.target.value))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Odds Máximas */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Odds Máximas</label>
            <input
              type="number"
              min={1.1}
              step={0.1}
              value={maxOdds}
              onChange={(e) => setMaxOdds(Number(e.target.value))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Tipo de Distribuição */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Tipo de Distribuição</label>
            <select
              value={distributionType}
              onChange={(e) => setDistributionType(e.target.value as 'equal' | 'custom')}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="equal">Igual por Múltipla</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Casa de Aposta */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Filtrar por Casa</label>
            <select
              value={filterBookmaker}
              onChange={(e) => setFilterBookmaker(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">Todas as Casas</option>
              {bookmakers.map(bm => (
                <option key={bm} value={bm}>{bm}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={generateParlays}
            disabled={loading || odds.length === 0}
            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
          >
            <Trophy size={20} />
            Gerar Múltiplas Automático
          </button>
          <button
            onClick={createManualParlay}
            disabled={selectedBets.length < 2}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Criar Múltipla Manual
          </button>
          <button
            onClick={clearAll}
            className="bg-red-500/20 text-red-400 px-4 py-3 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-yellow-400" size={18} />
            <span className="text-slate-400 text-sm">Total Investido</span>
          </div>
          <p className="text-2xl font-bold text-white">R$ {totalInvestido.toFixed(2)}</p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-400" size={18} />
            <span className="text-slate-400 text-sm">Retorno Potential</span>
          </div>
          <p className="text-2xl font-bold text-green-400">R$ {retornoTotal.toFixed(2)}</p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="text-blue-400" size={18} />
            <span className="text-slate-400 text-sm">Lucro Potential</span>
          </div>
          <p className={`text-2xl font-bold ${lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {lucroTotal.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-yellow-400" size={18} />
            <span className="text-slate-400 text-sm">Múltiplas Geradas</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {bookmakerResults.reduce((sum, b) => sum + b.parlays.length, 0)}
          </p>
        </div>
      </div>

      {/* Resultados por Casa de Aposta */}
      {bookmakerResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-yellow-400" size={20} />
            Múltiplas por Casa de Aposta
          </h3>
          
          {bookmakerResults.map((bookmaker, bmIndex) => (
            <div key={bmIndex} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-bold">
                      {bookmaker.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{bookmaker.name}</h4>
                      <p className="text-slate-400 text-sm">{bookmaker.parlays.length} múltiplas</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Investido</p>
                      <p className="text-white font-bold">R$ {bookmaker.totalStake.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Retorno</p>
                      <p className="text-green-400 font-bold">R$ {bookmaker.totalReturn.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-700">
                {bookmaker.parlays.map((parlay, pIndex) => (
                  <div key={pIndex} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold">
                          {pIndex + 1}
                        </span>
                        <span className="text-white font-medium">
                          {parlay.bets.length} jogos | Odds: {parlay.totalOdds.toFixed(2)}x
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-400">Stake: <span className="text-white font-medium">R$ {parlay.stake.toFixed(2)}</span></span>
                        <span className="text-green-400 font-medium">Retorno: R$ {parlay.potentialReturn.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {parlay.bets.map((bet, bIndex) => (
                        <div key={bIndex} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-slate-700 rounded text-white text-xs flex items-center justify-center">
                              {bIndex + 1}
                            </span>
                            <span className="text-slate-300 text-sm">{bet.team}</span>
                          </div>
                          <span className="text-green-400 font-bold">{bet.odds.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seleção Manual de Apostas */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Selecione as Apostas</h3>
          <span className="text-slate-400 text-sm">{selectedBets.length} selecionadas</span>
        </div>

        <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="animate-spin mx-auto text-yellow-400 mb-4" size={32} />
              <p className="text-slate-400">Carregando odds...</p>
            </div>
          ) : (
            odds.map((odd) => {
              const bestOdds = getBestOdds(odd.homeOdds, odd.drawOdds, odd.awayOdds);
              
              return (
                <div key={odd.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-slate-400 text-sm">{odd.league}</span>
                      <p className="text-white font-medium">{odd.homeTeam} x {odd.awayTeam}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="text-slate-500" size={14} />
                      <span className="text-slate-400 text-sm">{formatDateTime(odd.startTimeISO)}</span>
                      <span className="text-yellow-400 text-sm ml-2">{odd.bookmaker}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => toggleBetSelection(odd, 'home')}
                      className={`py-2 rounded-lg font-bold text-sm transition-all ${
                        selectedBets.some(b => b.id === `${odd.id}-home`)
                          ? 'bg-green-500 text-white'
                          : odd.homeOdds === bestOdds.value
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {odd.homeTeam.slice(0, 10)} {odd.homeOdds.toFixed(2)}
                    </button>

                    <button
                      onClick={() => toggleBetSelection(odd, 'draw')}
                      disabled={odd.drawOdds <= 0}
                      className={`py-2 rounded-lg font-bold text-sm transition-all ${
                        selectedBets.some(b => b.id === `${odd.id}-draw`)
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      X {odd.drawOdds > 0 ? odd.drawOdds.toFixed(2) : '-'}
                    </button>

                    <button
                      onClick={() => toggleBetSelection(odd, 'away')}
                      className={`py-2 rounded-lg font-bold text-sm transition-all ${
                        selectedBets.some(b => b.id === `${odd.id}-away`)
                          ? 'bg-green-500 text-white'
                          : odd.awayOdds === bestOdds.value
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {odd.awayTeam.slice(0, 10)} {odd.awayOdds.toFixed(2)}
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
