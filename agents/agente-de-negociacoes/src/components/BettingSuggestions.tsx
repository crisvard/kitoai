pedi import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Target, 
  TrendingUp, 
  Calculator,
  Filter,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { oddsAPI, ParsedOdds, formatDateTime } from '../services/odds-api';

interface SuggestionConfig {
  quantity: number;
  winRate: number; // percentage (ex: 20 = 20%)
}

interface Suggestion {
  id: string;
  match: string;
  selection: string;
  odds: number;
  probability: number;
  recommended: boolean;
}

// Gerar sugestões baseadas em probabilidade
function generateSuggestions(odds: ParsedOdds[], config: SuggestionConfig): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Filtrar apenas odds válidos
  const validOdds = odds.filter(o => o.homeOdds > 0 && o.awayOdds > 0);
  
  // Converter probability de acerto para odds decimais
  // Se winRate = 20%, odds justas = 1 / 0.20 = 5.0
  const fairOdds = 1 / (config.winRate / 100);
  
  // Encontrar jogos com odds maiores que o justo (valor)
  const valueBets = validOdds.flatMap(game => {
    const bets: Suggestion[] = [];
    
    // Casa
    if (game.homeOdds > fairOdds * 0.7) {
      bets.push({
        id: `${game.id}-home`,
        match: `${game.homeTeam} vs ${game.awayTeam}`,
        selection: game.homeTeam,
        odds: game.homeOdds,
        probability: 1 / game.homeOdds,
        recommended: game.homeOdds >= fairOdds
      });
    }
    
    // Visitante
    if (game.awayOdds > fairOdds * 0.7) {
      bets.push({
        id: `${game.id}-away`,
        match: `${game.homeTeam} vs ${game.awayTeam}`,
        selection: game.awayTeam,
        odds: game.awayOdds,
        probability: 1 / game.awayOdds,
        recommended: game.awayOdds >= fairOdds
      });
    }
    
    // Empate
    if (game.drawOdds > fairOdds * 0.7) {
      bets.push({
        id: `${game.id}-draw`,
        match: `${game.homeTeam} vs ${game.awayTeam}`,
        selection: 'Empate',
        odds: game.drawOdds,
        probability: 1 / game.drawOdds,
        recommended: game.drawOdds >= fairOdds
      });
    }
    
    return bets;
  });
  
  // Ordenar por valor (odds mais altas primeiro)
  valueBets.sort((a, b) => b.odds - a.odds);
  
  // Retornar quantidade solicitada
  return valueBets.slice(0, config.quantity);
}

export default function BettingSuggestions() {
  const [odds, setOdds] = useState<ParsedOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedSport, setSelectedSport] = useState('soccer');
  
  // Configurações
  const [quantity, setQuantity] = useState(10);
  const [winRate, setWinRate] = useState(20);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  const fetchOdds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await oddsAPI.getOdds(selectedSport);
      setOdds(data);
      setLastUpdate(new Date());
      
      // Gerar sugestões automaticamente
      const newSuggestions = generateSuggestions(data, { quantity, winRate });
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Erro ao buscar odds:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSport, quantity, winRate]);
  
  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);
  
  // Atualizar sugestões quando mudar configuração
  useEffect(() => {
    if (odds.length > 0) {
      const newSuggestions = generateSuggestions(odds, { quantity, winRate });
      setSuggestions(newSuggestions);
    }
  }, [quantity, winRate, odds]);
  
  // Auto-refresh a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(fetchOdds, 60000);
    return () => clearInterval(interval);
  }, [fetchOdds]);
  
  const sports = [
    { key: 'soccer', name: 'Brasileirão' },
    { key: 'basketball', name: 'NBA' },
    { key: 'tennis', name: 'Tennis' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sugestões de Apostas</h2>
            <p className="text-sm text-slate-400">Baseado em probabilidade de acerto</p>
          </div>
        </div>
        
        <button
          onClick={fetchOdds}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>
      
      {/* Configurações */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">Configurações</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Esporte</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              {sports.map(sport => (
                <option key={sport.key} value={sport.key}>{sport.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Quantidade de Apostas: {quantity}
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1</span>
              <span>30</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Percentual de Acerto: {winRate}%
            </label>
            <input
              type="range"
              min="5"
              max="80"
              value={winRate}
              onChange={(e) => setWinRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>5%</span>
              <span>80%</span>
            </div>
          </div>
        </div>
        
        {/* Info boxes */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Probabilidade</p>
            <p className="text-lg font-bold text-white">{(100 / winRate).toFixed(1)}x</p>
            <p className="text-xs text-slate-500">odds justas</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Odds Médias</p>
            <p className="text-lg font-bold text-purple-400">
              {suggestions.length > 0 
                ? (suggestions.reduce((s, s2) => s + s2.odds, 0) / suggestions.length).toFixed(2)
                : '0.00'
              }x
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Valor Esperado</p>
            <p className="text-lg font-bold text-green-400">
              {suggestions.length > 0 
                ? (((suggestions.reduce((s, s2) => s + s2.odds, 0) / suggestions.length) / (100 / winRate) - 1) * 100).toFixed(1)
                : '0'
              }%
            </p>
          </div>
        </div>
      </div>
      
