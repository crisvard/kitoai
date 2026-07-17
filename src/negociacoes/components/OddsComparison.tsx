import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Zap, Target, BarChart3 } from 'lucide-react';
import { OddsComparison as OddsComparisonType } from '../types/bookmaker';

interface OddsComparisonProps {
    comparisons: OddsComparisonType[];
    loading?: boolean;
}

export default function OddsComparison({ comparisons, loading = false }: OddsComparisonProps) {
    const [sortBy, setSortBy] = useState<'odds' | 'profit' | 'time'>('odds');
    const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'upcoming'>('all');

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const calculateProfit = (odds: number, stake: number = 100) => {
        return (odds - 1) * stake;
    };

    const calculateROI = (odds: number) => {
        return ((odds - 1) * 100).toFixed(1);
    };

    const getOddsTrend = (current: number, previous: number) => {
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'stable';
    };

    const filteredComparisons = comparisons.filter(comparison => {
        if (filterStatus === 'all') return true;
        const isLive = comparison.startTime <= new Date().toISOString();
        return filterStatus === 'live' ? isLive : !isLive;
    });

    const sortedComparisons = [...filteredComparisons].sort((a, b) => {
        if (sortBy === 'odds') {
            const aMaxOdds = Math.max(a.bestOdds.home.odds, a.bestOdds.draw.odds, a.bestOdds.away.odds);
            const bMaxOdds = Math.max(b.bestOdds.home.odds, b.bestOdds.draw.odds, b.bestOdds.away.odds);
            return bMaxOdds - aMaxOdds;
        }
        if (sortBy === 'profit') {
            const aProfit = calculateProfit(a.bestOdds.home.odds) + calculateProfit(a.bestOdds.draw.odds) + calculateProfit(a.bestOdds.away.odds);
            const bProfit = calculateProfit(b.bestOdds.home.odds) + calculateProfit(b.bestOdds.draw.odds) + calculateProfit(b.bestOdds.away.odds);
            return bProfit - aProfit;
        }
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return (
        <div className="space-y-6">
            {/* Filtros e Ordenação */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Filtrar por</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all'
                                            ? 'bg-[#c4d82e] text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('live')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'live'
                                            ? 'bg-green-500 text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    Ao Vivo
                                </button>
                                <button
                                    onClick={() => setFilterStatus('upcoming')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'upcoming'
                                            ? 'bg-blue-500 text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    Futuros
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Ordenar por</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSortBy('odds')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'odds'
                                            ? 'bg-[#c4d82e] text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    Melhores Odds
                                </button>
                                <button
                                    onClick={() => setSortBy('profit')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'profit'
                                            ? 'bg-[#c4d82e] text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    Maior Lucro
                                </button>
                                <button
                                    onClick={() => setSortBy('time')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'time'
                                            ? 'bg-[#c4d82e] text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    Mais Próximos
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-gray-400 text-xs">Eventos encontrados</p>
                        <p className="text-2xl font-bold text-white">{sortedComparisons.length}</p>
                    </div>
                </div>
            </div>

            {/* Lista de Comparações */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c4d82e] mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando odds...</p>
                </div>
            ) : sortedComparisons.length === 0 ? (
                <div className="text-center py-12">
                    <Target className="text-gray-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-400">Nenhum evento encontrado</p>
                    <p className="text-gray-500 text-sm">Tente ajustar os filtros</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedComparisons.map(comparison => {
                        const isLive = comparison.startTime <= new Date().toISOString();
                        const profitHome = calculateProfit(comparison.bestOdds.home.odds);
                        const profitDraw = calculateProfit(comparison.bestOdds.draw.odds);
                        const profitAway = calculateProfit(comparison.bestOdds.away.odds);

                        return (
                            <div
                                key={comparison.eventId}
                                className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-200 ${isLive
                                        ? 'border-green-500/30 hover:border-green-500'
                                        : 'border-white/10 hover:border-[#c4d82e]/50'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        {isLive && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                                <Zap size={12} />
                                                AO VIVO
                                            </span>
                                        )}
                                        <div>
                                            <h3 className="text-white font-bold text-lg">
                                                {comparison.homeTeam} vs {comparison.awayTeam}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {comparison.league} • {comparison.sport}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#c4d82e] font-bold">{formatDate(comparison.startTime)}</p>
                                        <p className="text-gray-400 text-sm">{formatTime(comparison.startTime)}</p>
                                    </div>
                                </div>

                                {/* Melhores Odds */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                                        <p className="text-gray-400 text-xs mb-1">Casa</p>
                                        <p className="text-3xl font-bold text-green-400">
                                            {comparison.bestOdds.home.odds.toFixed(2)}
                                        </p>
                                        <p className="text-green-400 text-xs mt-1">{comparison.bestOdds.home.bookmaker}</p>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            <ArrowUpRight className="text-green-400" size={14} />
                                            <span className="text-green-400 text-xs">+R$ {profitHome.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="text-center bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                                        <p className="text-gray-400 text-xs mb-1">Empate</p>
                                        <p className="text-3xl font-bold text-green-400">
                                            {comparison.bestOdds.draw.odds.toFixed(2)}
                                        </p>
                                        <p className="text-green-400 text-xs mt-1">{comparison.bestOdds.draw.bookmaker}</p>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            <ArrowUpRight className="text-green-400" size={14} />
                                            <span className="text-green-400 text-xs">+R$ {profitDraw.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="text-center bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                                        <p className="text-gray-400 text-xs mb-1">Fora</p>
                                        <p className="text-3xl font-bold text-green-400">
                                            {comparison.bestOdds.away.odds.toFixed(2)}
                                        </p>
                                        <p className="text-green-400 text-xs mt-1">{comparison.bestOdds.away.bookmaker}</p>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            <ArrowUpRight className="text-green-400" size={14} />
                                            <span className="text-green-400 text-xs">+R$ {profitAway.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Odds por Casa */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-gray-400 text-xs">Odds por Casa de Apostas:</p>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="text-gray-400" size={14} />
                                            <span className="text-gray-400 text-xs">{comparison.bookmakers.length} casas</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {comparison.bookmakers.map(bookmaker => {
                                            const isBestHome = bookmaker.homeOdds === comparison.bestOdds.home.odds;
                                            const isBestDraw = bookmaker.drawOdds === comparison.bestOdds.draw.odds;
                                            const isBestAway = bookmaker.awayOdds === comparison.bestOdds.away.odds;

                                            return (
                                                <div
                                                    key={bookmaker.name}
                                                    className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/30 transition-colors"
                                                >
                                                    <p className="text-white text-sm font-medium mb-2">{bookmaker.name}</p>
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div>
                                                            <p className={`text-sm font-bold ${isBestHome ? 'text-green-400' : 'text-white'}`}>
                                                                {bookmaker.homeOdds.toFixed(2)}
                                                            </p>
                                                            {isBestHome && <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1" />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-bold ${isBestDraw ? 'text-green-400' : 'text-white'}`}>
                                                                {bookmaker.drawOdds.toFixed(2)}
                                                            </p>
                                                            {isBestDraw && <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1" />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-bold ${isBestAway ? 'text-green-400' : 'text-white'}`}>
                                                                {bookmaker.awayOdds.toFixed(2)}
                                                            </p>
                                                            {isBestAway && <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-500 text-xs mt-2 text-center">
                                                        {formatTime(bookmaker.lastUpdated)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ROI */}
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="text-green-400" size={16} />
                                                <span className="text-gray-400 text-xs">ROI Casa:</span>
                                                <span className="text-green-400 text-sm font-bold">{calculateROI(comparison.bestOdds.home.odds)}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Minus className="text-gray-400" size={16} />
                                                <span className="text-gray-400 text-xs">ROI Empate:</span>
                                                <span className="text-gray-400 text-sm font-bold">{calculateROI(comparison.bestOdds.draw.odds)}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="text-red-400" size={16} />
                                                <span className="text-gray-400 text-xs">ROI Fora:</span>
                                                <span className="text-red-400 text-sm font-bold">{calculateROI(comparison.bestOdds.away.odds)}%</span>
                                            </div>
                                        </div>
                                        <button className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c4d82e]/90 transition-colors">
                                            <Target size={16} />
                                            Apostar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
