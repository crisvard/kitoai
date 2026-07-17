import { useState, useMemo, useEffect } from 'react';
import {
    Dices,
    ChevronDown,
    ChevronUp,
    Clock,
    Trophy,
    Target,
    Zap,
    TrendingUp,
    X,
    ShoppingCart,
    Calculator,
    Star,
    Flame,
    Circle,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { useBetanoScraper } from '../hooks/useBetanoScraper';
import { BetanoMatch, BetanoMarket } from '../services/betano-scraper';

// ============================================
// TIPOS
// ============================================

interface Selection {
    id: string;
    name: string;
    odds: number;
    market: string;
    matchId: string;
    matchName: string;
    league: string;
    sport: string;
    isLive: boolean;
}

interface Market {
    id: string;
    name: string;
    selections: {
        id: string;
        name: string;
        odds: number;
    }[];
}

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    startTime: string;
    isLive: boolean;
    minute?: number;
    score?: string;
    markets: Market[];
}

interface BetSlipItem {
    selection: Selection;
    stake: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function BetanoMirror() {
    const [selectedSport, setSelectedSport] = useState<string>('all');
    const [selectedLeague, setSelectedLeague] = useState<string>('all');
    const [showLiveOnly, setShowLiveOnly] = useState(false);
    const [expandedMatches, setExpandedMatches] = useState<string[]>([]);
    const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
    const [betType, setBetType] = useState<'single' | 'multiple'>('single');
    const [showBetSlip, setShowBetSlip] = useState(false);

    // Hook para dados reais da Betano
    const {
        matches: BETANO_MATCHES,
        liveMatches,
        loading,
        error,
        lastUpdate,
        refresh
    } = useBetanoScraper(true, 30000);

    // Filtros
    const sports = useMemo(() => ['all', ...new Set(BETANO_MATCHES.map(m => m.sport))], [BETANO_MATCHES]);
    const leagues = useMemo(() => ['all', ...new Set(BETANO_MATCHES.map(m => m.league))], [BETANO_MATCHES]);

    const filteredMatches = useMemo(() => {
        return BETANO_MATCHES.filter(match => {
            if (selectedSport !== 'all' && match.sport !== selectedSport) return false;
            if (selectedLeague !== 'all' && match.league !== selectedLeague) return false;
            if (showLiveOnly && !match.isLive) return false;
            return true;
        });
    }, [BETANO_MATCHES, selectedSport, selectedLeague, showLiveOnly]);

    // Funções
    const toggleMatchExpansion = (matchId: string) => {
        setExpandedMatches(prev =>
            prev.includes(matchId)
                ? prev.filter(id => id !== matchId)
                : [...prev, matchId]
        );
    };

    const addSelection = (selection: Selection) => {
        // Verificar se já existe no carrinho
        const exists = betSlip.find(item => item.selection.id === selection.id);
        if (exists) {
            // Remover se já existe
            setBetSlip(prev => prev.filter(item => item.selection.id !== selection.id));
        } else {
            // Adicionar
            setBetSlip(prev => [...prev, { selection, stake: 0 }]);
            setShowBetSlip(true);
        }
    };

    const removeSelection = (selectionId: string) => {
        setBetSlip(prev => prev.filter(item => item.selection.id !== selectionId));
    };

    const updateStake = (selectionId: string, stake: number) => {
        setBetSlip(prev => prev.map(item =>
            item.selection.id === selectionId ? { ...item, stake } : item
        ));
    };

    const clearBetSlip = () => {
        setBetSlip([]);
    };

    const calculateTotalOdds = () => {
        if (betSlip.length === 0) return 0;
        return betSlip.reduce((acc, item) => acc * item.selection.odds, 1);
    };

    const calculateTotalStake = () => {
        if (betType === 'multiple') {
            return betSlip[0]?.stake || 0;
        }
        return betSlip.reduce((acc, item) => acc + item.stake, 0);
    };

    const calculatePotentialWin = () => {
        if (betType === 'single') {
            return betSlip.reduce((acc, item) => acc + (item.stake * item.selection.odds), 0);
        }
        return calculateTotalStake() * calculateTotalOdds();
    };

    const isSelected = (selectionId: string) => {
        return betSlip.some(item => item.selection.id === selectionId);
    };

    const getSportIcon = (sport: string) => {
        switch (sport) {
            case 'Futebol': return <Circle size={16} className="text-green-400" />;
            case 'Basquete': return <Circle size={16} className="text-orange-400" />;
            case 'Tênis': return <Circle size={16} className="text-yellow-400" />;
            case 'Vôlei': return <Circle size={16} className="text-blue-400" />;
            default: return <Trophy size={16} />;
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center text-black font-bold text-lg">
                            B
                        </div>
                        Betano - Espelhamento
                    </h2>
                    <p className="text-gray-400">
                        Todas as odds e mercados em tempo real
                        {lastUpdate && (
                            <span className="ml-2 text-xs text-gray-500">
                                Última atualização: {new Date(lastUpdate).toLocaleTimeString('pt-BR')}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        <span>Atualizar</span>
                    </button>
                    <button
                        onClick={() => setShowBetSlip(!showBetSlip)}
                        className="relative flex items-center gap-2 bg-[#FFD700] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FFC000] transition-colors"
                    >
                        <ShoppingCart size={20} />
                        <span>Bilhete</span>
                        {betSlip.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {betSlip.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Erro */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-400" size={20} />
                    <div>
                        <p className="text-red-400 font-medium">Erro ao carregar dados</p>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && BETANO_MATCHES.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="animate-spin text-[#FFD700] mx-auto mb-4" size={40} />
                        <p className="text-gray-400">Carregando dados da Betano...</p>
                    </div>
                </div>
            )}

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Ao Vivo</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{liveMatches.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="text-[#FFD700]" size={18} />
                        <span className="text-gray-400 text-sm">Total Jogos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{BETANO_MATCHES.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-[#FFD700]" size={18} />
                        <span className="text-gray-400 text-sm">Mercados</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {BETANO_MATCHES.reduce((acc, m) => acc + m.markets.length, 0)}
                    </p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="text-[#FFD700]" size={18} />
                        <span className="text-gray-400 text-sm">No Bilhete</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{betSlip.length}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Esporte</label>
                        <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]"
                        >
                            {sports.map(sport => (
                                <option key={sport} value={sport}>
                                    {sport === 'all' ? 'Todos os Esportes' : sport}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Liga</label>
                        <select
                            value={selectedLeague}
                            onChange={(e) => setSelectedLeague(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]"
                        >
                            {leagues.map(league => (
                                <option key={league} value={league}>
                                    {league === 'all' ? 'Todas as Ligas' : league}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            id="liveOnly"
                            checked={showLiveOnly}
                            onChange={(e) => setShowLiveOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#FFD700] focus:ring-[#FFD700]"
                        />
                        <label htmlFor="liveOnly" className="text-gray-400 text-sm flex items-center gap-1">
                            <Flame size={14} className="text-red-400" />
                            Apenas Ao Vivo
                        </label>
                    </div>
                </div>
            </div>

            {/* Layout Principal */}
            <div className="flex gap-6">
                {/* Lista de Jogos */}
                <div className={`space-y-4 ${showBetSlip && betSlip.length > 0 ? 'flex-1' : 'w-full'}`}>
                    {filteredMatches.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                            <Trophy className="text-gray-600 mx-auto mb-4" size={48} />
                            <p className="text-gray-400">Nenhum jogo encontrado</p>
                        </div>
                    ) : (
                        filteredMatches.map(match => (
                            <div
                                key={match.id}
                                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                            >
                                {/* Header do Jogo */}
                                <button
                                    onClick={() => toggleMatchExpansion(match.id)}
                                    className="w-full p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                {getSportIcon(match.sport)}
                                                <span className="text-gray-400 text-xs">{match.league}</span>
                                            </div>
                                            {match.isLive && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                                    <Flame size={12} />
                                                    AO VIVO {match.minute}'
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {!match.isLive && (
                                                <span className="text-gray-400 text-xs">
                                                    {formatDate(match.startTime)} {formatTime(match.startTime)}
                                                </span>
                                            )}
                                            {expandedMatches.includes(match.id) ? (
                                                <ChevronUp className="text-gray-400" size={20} />
                                            ) : (
                                                <ChevronDown className="text-gray-400" size={20} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Placar / Times */}
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{match.homeTeam}</p>
                                            <p className="text-white font-medium">{match.awayTeam}</p>
                                        </div>
                                        {match.isLive && match.score && (
                                            <div className="text-2xl font-bold text-[#FFD700]">
                                                {match.score}
                                            </div>
                                        )}
                                        {/* Odds Rápidas (1x2) */}
                                        {!expandedMatches.includes(match.id) && (
                                            <div className="flex gap-2 ml-4">
                                                {match.markets[0]?.selections.map(sel => (
                                                    <button
                                                        key={sel.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addSelection({
                                                                id: `${match.id}-${match.markets[0].id}-${sel.id}`,
                                                                name: sel.name,
                                                                odds: sel.odds,
                                                                market: match.markets[0].name,
                                                                matchId: match.id,
                                                                matchName: `${match.homeTeam} vs ${match.awayTeam}`,
                                                                league: match.league,
                                                                sport: match.sport,
                                                                isLive: match.isLive,
                                                            });
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected(`${match.id}-${match.markets[0].id}-${sel.id}`)
                                                            ? 'bg-[#FFD700] text-black'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-xs text-gray-400">{sel.name}</div>
                                                        <div className="font-bold">{sel.odds.toFixed(2)}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {/* Mercados Expandidos */}
                                {expandedMatches.includes(match.id) && (
                                    <div className="border-t border-white/10 p-4 space-y-4">
                                        {match.markets.map(market => (
                                            <div key={market.id} className="bg-white/5 rounded-xl p-4">
                                                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                                    <Target size={14} className="text-[#FFD700]" />
                                                    {market.name}
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {market.selections.map(sel => {
                                                        const selectionId = `${match.id}-${market.id}-${sel.id}`;
                                                        const isSel = isSelected(selectionId);

                                                        return (
                                                            <button
                                                                key={sel.id}
                                                                onClick={() => addSelection({
                                                                    id: selectionId,
                                                                    name: sel.name,
                                                                    odds: sel.odds,
                                                                    market: market.name,
                                                                    matchId: match.id,
                                                                    matchName: `${match.homeTeam} vs ${match.awayTeam}`,
                                                                    league: match.league,
                                                                    sport: match.sport,
                                                                    isLive: match.isLive,
                                                                })}
                                                                className={`p-3 rounded-lg text-center transition-colors ${isSel
                                                                    ? 'bg-[#FFD700] text-black'
                                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                                                    }`}
                                                            >
                                                                <div className="text-xs truncate">{sel.name}</div>
                                                                <div className="font-bold text-lg">{sel.odds.toFixed(2)}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Bilhete de Apostas */}
                {showBetSlip && betSlip.length > 0 && (
                    <div className="w-96 bg-white/5 backdrop-blur-xl rounded-2xl border border-[#FFD700]/30 p-6 h-fit sticky top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingCart size={20} className="text-[#FFD700]" />
                                Bilhete de Apostas
                            </h3>
                            <button
                                onClick={clearBetSlip}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tipo de Aposta */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setBetType('single')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${betType === 'single'
                                    ? 'bg-[#FFD700] text-black'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                Simples
                            </button>
                            <button
                                onClick={() => setBetType('multiple')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${betType === 'multiple'
                                    ? 'bg-[#FFD700] text-black'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                Múltipla
                            </button>
                        </div>

                        {/* Seleções */}
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                            {betSlip.map(item => (
                                <div key={item.selection.id} className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium truncate">{item.selection.name}</p>
                                            <p className="text-gray-400 text-xs">{item.selection.market}</p>
                                            <p className="text-gray-500 text-xs truncate">{item.selection.matchName}</p>
                                        </div>
                                        <button
                                            onClick={() => removeSelection(item.selection.id)}
                                            className="text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#FFD700] font-bold">{item.selection.odds.toFixed(2)}</span>
                                        {betType === 'single' && (
                                            <input
                                                type="number"
                                                value={item.stake || ''}
                                                onChange={(e) => updateStake(item.selection.id, parseFloat(e.target.value) || 0)}
                                                placeholder="R$ 0,00"
                                                className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#FFD700]"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Valor Total (Múltipla) */}
                        {betType === 'multiple' && (
                            <div className="mb-4">
                                <label className="text-gray-400 text-xs mb-1 block">Valor da Aposta</label>
                                <input
                                    type="number"
                                    value={betSlip[0]?.stake || ''}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        setBetSlip(prev => prev.map(item => ({ ...item, stake: value })));
                                    }}
                                    placeholder="R$ 0,00"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-[#FFD700]"
                                />
                            </div>
                        )}

                        {/* Resumo */}
                        <div className="border-t border-white/10 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Seleções</span>
                                <span className="text-white">{betSlip.length}</span>
                            </div>
                            {betType === 'multiple' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Odd Total</span>
                                    <span className="text-[#FFD700] font-bold">{calculateTotalOdds().toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Apostado</span>
                                <span className="text-white">R$ {calculateTotalStake().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-gray-400">Retorno Potencial</span>
                                <span className="text-green-400">R$ {calculatePotentialWin().toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Botão Apostar */}
                        <button
                            disabled={calculateTotalStake() === 0}
                            className="w-full mt-4 bg-[#FFD700] text-black py-3 rounded-lg font-bold hover:bg-[#FFC000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Calculator size={20} />
                            Confirmar Aposta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
