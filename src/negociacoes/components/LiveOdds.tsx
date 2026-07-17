import { useState, useEffect } from 'react';
import { Zap, RefreshCw, TrendingUp, TrendingDown, Minus, Clock, Activity, Target } from 'lucide-react';
import { BookmakerEvent } from '../types/bookmaker';

interface LiveOddsProps {
    events: BookmakerEvent[];
    loading?: boolean;
    onRefresh?: () => void;
}

export default function LiveOdds({ events, loading = false, onRefresh }: LiveOddsProps) {
    const [selectedSport, setSelectedSport] = useState<string>('all');
    const [selectedLeague, setSelectedLeague] = useState<string>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh a cada 10 segundos
    useEffect(() => {
        if (!autoRefresh || !onRefresh) return;

        const interval = setInterval(() => {
            onRefresh();
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh, onRefresh]);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getMatchMinute = (startTime: string) => {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        return minutes > 0 ? `${minutes}'` : '0\'';
    };

    const getOddsTrend = (current: number, previous: number) => {
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'stable';
    };

    const calculateProfit = (odds: number, stake: number = 100) => {
        return (odds - 1) * stake;
    };

    // Filtrar eventos
    const filteredEvents = events.filter(event => {
        if (selectedSport !== 'all' && event.sport !== selectedSport) return false;
        if (selectedLeague !== 'all' && event.league !== selectedLeague) return false;
        return true;
    });

    // Obter esportes únicos
    const sports = [...new Set(events.map(e => e.sport))];

    // Obter ligas únicas
    const leagues = [...new Set(events.map(e => e.league))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <Zap className="text-green-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Odds ao Vivo</h2>
                            <p className="text-gray-400 text-sm">Atualização automática a cada 10 segundos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="autoRefresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="autoRefresh" className="text-gray-400 text-sm">
                                Auto-refresh
                            </label>
                        </div>
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Atualizando...' : 'Atualizar'}
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Esporte</label>
                        <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="all">Todos</option>
                            {sports.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Liga</label>
                        <select
                            value={selectedLeague}
                            onChange={(e) => setSelectedLeague(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="all">Todas</option>
                            {leagues.map(league => (
                                <option key={league} value={league}>{league}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Ao Vivo</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{filteredEvents.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Esportes</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{sports.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-blue-400" size={18} />
                        <span className="text-gray-400 text-sm">Ligas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{leagues.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Casas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {[...new Set(events.map(e => e.bookmaker))].length}
                    </p>
                </div>
            </div>

            {/* Lista de Eventos ao Vivo */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando eventos ao vivo...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                    <Zap className="text-gray-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-400">Nenhum evento ao vivo</p>
                    <p className="text-gray-500 text-sm">Os eventos aparecerão aqui quando estiverem acontecendo</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEvents.map(event => {
                        const profitHome = calculateProfit(event.odds.home);
                        const profitDraw = calculateProfit(event.odds.draw);
                        const profitAway = calculateProfit(event.odds.away);

                        return (
                            <div
                                key={event.id}
                                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 hover:border-green-500 transition-all duration-200"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                            <Zap size={12} />
                                            AO VIVO
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white rounded-full text-xs font-medium">
                                            <Clock size={12} />
                                            {getMatchMinute(event.startTime)}
                                        </span>
                                        <span className="text-gray-400 text-sm">{event.bookmaker}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{event.league}</p>
                                        <p className="text-gray-400 text-sm">{event.sport}</p>
                                    </div>
                                </div>

                                {/* Times */}
                                <div className="flex items-center justify-center gap-8 mb-6">
                                    <div className="text-center">
                                        <p className="text-white font-bold text-lg">{event.homeTeam}</p>
                                        <p className="text-gray-400 text-sm">Casa</p>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-600">VS</div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-lg">{event.awayTeam}</p>
                                        <p className="text-gray-400 text-sm">Fora</p>
                                    </div>
                                </div>

                                {/* Odds */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-colors cursor-pointer">
                                        <p className="text-gray-400 text-xs mb-1">Casa</p>
                                        <p className="text-3xl font-bold text-white">{event.odds.home.toFixed(2)}</p>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            <TrendingUp className="text-green-400" size={14} />
                                            <span className="text-green-400 text-xs">+R$ {profitHome.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-colors cursor-pointer">
                                        <p className="text-gray-400 text-xs mb-1">Empate</p>
                                        <p className="text-3xl font-bold text-white">{event.odds.draw.toFixed(2)}</p>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            <Minus className="text-gray-400" size={14} />
                                            <span className="text-gray-400 text-xs">+R$ {profitDraw.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-colors cursor-pointer">
                                        <p className="text-gray-400 text-xs mb-1">Fora</p>
                                        <p className="text-3xl font-bold text-white">{event.odds.away.toFixed(2)}</p>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            <TrendingDown className="text-red-400" size={14} />
                                            <span className="text-red-400 text-xs">+R$ {profitAway.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-400 text-xs">
                                            Última atualização: {formatTime(event.lastUpdated)}
                                        </span>
                                    </div>
                                    <button className="flex items-center gap-2 bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500/90 transition-colors">
                                        <Target size={16} />
                                        Apostar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
