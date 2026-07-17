import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, Calendar, Download, Percent, Award, Zap, PieChart, Activity, DollarSign, Minus } from 'lucide-react';

export default function BettingAnalytics() {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    const stats = {
        totalBets: 155,
        wins: 102,
        losses: 53,
        winRate: 65.8,
        totalStaked: 42500,
        totalProfit: 7230,
        roi: 17.0,
        averageOdds: 2.15,
        averageStake: 274,
        biggestWin: 2500,
        biggestLoss: -800,
        longestWinStreak: 8,
        longestLoseStreak: 3,
        currentStreak: 5,
        currentStreakType: 'win',
    };

    const bySport = [
        { name: 'Futebol', bets: 85, winRate: 68, profit: 4200, roi: 22 },
        { name: 'Basquete', bets: 25, winRate: 60, profit: 850, roi: 12 },
        { name: 'Tênis', bets: 20, winRate: 55, profit: -200, roi: -5 },
        { name: 'MMA', bets: 15, winRate: 73, profit: 1800, roi: 35 },
        { name: 'eSports', bets: 10, winRate: 70, profit: 580, roi: 28 },
    ];

    const byMarket = [
        { name: 'Resultado Final', bets: 65, winRate: 62, profit: 2100, roi: 18 },
        { name: 'Over/Under', bets: 35, winRate: 68, profit: 1850, roi: 24 },
        { name: 'Ambas Marcam', bets: 25, winRate: 72, profit: 2200, roi: 32 },
        { name: 'Handicap', bets: 20, winRate: 55, profit: -300, roi: -8 },
        { name: 'Primeiro Gol', bets: 10, winRate: 60, profit: 380, roi: 15 },
    ];

    const byBookmaker = [
        { name: 'Betano', bets: 45, winRate: 67, profit: 2100, roi: 20 },
        { name: 'Bet365', bets: 35, winRate: 63, profit: 1850, roi: 18 },
        { name: 'Stake', bets: 25, winRate: 68, profit: 1200, roi: 22 },
        { name: '1xBet', bets: 20, winRate: 60, profit: 580, roi: 12 },
        { name: 'Betfair', bets: 15, winRate: 73, profit: 1500, roi: 28 },
    ];

    const recentBets = [
        { id: 1, match: 'Flamengo vs Palmeiras', market: 'Resultado Final', selection: 'Casa', odds: 2.15, stake: 200, result: 'win', profit: 230, date: '2026-03-25' },
        { id: 2, match: 'Corinthians vs São Paulo', market: 'Over/Under', selection: 'Over 2.5', odds: 1.85, stake: 150, result: 'win', profit: 127.50, date: '2026-03-24' },
        { id: 3, match: 'Grêmio vs Internacional', market: 'Ambas Marcam', selection: 'Sim', odds: 1.75, stake: 100, result: 'loss', profit: -100, date: '2026-03-23' },
        { id: 4, match: 'Atlético-MG vs Cruzeiro', market: 'Resultado Final', selection: 'Casa', odds: 2.20, stake: 250, result: 'win', profit: 300, date: '2026-03-22' },
        { id: 5, match: 'Vasco vs Botafogo', market: 'Handicap', selection: 'Casa -1', odds: 3.50, stake: 100, result: 'loss', profit: -100, date: '2026-03-21' },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Análise de Apostas</h2>
                <p className="text-gray-400">Estatísticas detalhadas e insights para melhorar suas apostas</p>
            </div>

            {/* Filtro de Tempo */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Calendar className="text-[#c4d82e]" size={20} />
                        <span className="text-white font-medium">Período</span>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { value: '7d', label: '7 dias' },
                            { value: '30d', label: '30 dias' },
                            { value: '90d', label: '90 dias' },
                            { value: 'all', label: 'Todos' },
                        ].map(range => (
                            <button
                                key={range.value}
                                onClick={() => setTimeRange(range.value as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range.value
                                    ? 'bg-[#c4d82e] text-black'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Estatísticas Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Apostas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
                    <p className="text-gray-400 text-xs mt-1">{stats.wins}W / {stats.losses}L</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Percent className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Acerto</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.winRate}%</p>
                    <p className="text-gray-400 text-xs mt-1">Sequência: {stats.currentStreak} {stats.currentStreakType === 'win' ? 'vitórias' : 'derrotas'}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Lucro Total</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalProfit)}</p>
                    <p className="text-gray-400 text-xs mt-1">ROI: {stats.roi}%</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Odds Média</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.averageOdds}x</p>
                    <p className="text-gray-400 text-xs mt-1">Stake: {formatCurrency(stats.averageStake)}</p>
                </div>
            </div>

            {/* Recordes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Maior Vitória</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.biggestWin)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Maior Perda</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.biggestLoss)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Sequência Vitória</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.longestWinStreak}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Minus className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Sequência Derrota</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.longestLoseStreak}</p>
                </div>
            </div>

            {/* Análise por Esporte */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Por Esporte</h3>
                    <Activity className="text-[#c4d82e]" size={20} />
                </div>
                <div className="space-y-4">
                    {bySport.map((sport, index) => (
                        <div key={index} className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{sport.name}</span>
                                <span className={`font-medium ${sport.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {sport.profit > 0 ? '+' : ''}{formatCurrency(sport.profit)}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">{sport.bets} Apostas</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-400">Taxa: {sport.winRate}%</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-[#c4d82e]">ROI: {sport.roi}%</span>
                            </div>
                            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${sport.profit > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.abs(sport.roi)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Análise por Mercado */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Por Mercado</h3>
                    <PieChart className="text-[#c4d82e]" size={20} />
                </div>
                <div className="space-y-4">
                    {byMarket.map((market, index) => (
                        <div key={index} className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{market.name}</span>
                                <span className={`font-medium ${market.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {market.profit > 0 ? '+' : ''}{formatCurrency(market.profit)}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">{market.bets} Apostas</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-400">Taxa: {market.winRate}%</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-[#c4d82e]">ROI: {market.roi}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Análise por Casa de Apostas */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Por Casa de Apostas</h3>
                    <BarChart3 className="text-[#c4d82e]" size={20} />
                </div>
                <div className="space-y-4">
                    {byBookmaker.map((bookmaker, index) => (
                        <div key={index} className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{bookmaker.name}</span>
                                <span className={`font-medium ${bookmaker.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {bookmaker.profit > 0 ? '+' : ''}{formatCurrency(bookmaker.profit)}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">{bookmaker.bets} Apostas</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-400">Taxa: {bookmaker.winRate}%</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-[#c4d82e]">ROI: {bookmaker.roi}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Apostas Recentes */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Apostas Recentes</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                                <th className="pb-3">Data</th>
                                <th className="pb-3">Partida</th>
                                <th className="pb-3">Mercado</th>
                                <th className="pb-3">Seleção</th>
                                <th className="pb-3">Odds</th>
                                <th className="pb-3">Stake</th>
                                <th className="pb-3">Resultado</th>
                                <th className="pb-3">Lucro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBets.map(bet => (
                                <tr key={bet.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 text-gray-400 text-sm">{bet.date}</td>
                                    <td className="py-3 text-white text-sm">{bet.match}</td>
                                    <td className="py-3 text-gray-400 text-sm">{bet.market}</td>
                                    <td className="py-3 text-white text-sm">{bet.selection}</td>
                                    <td className="py-3 text-white text-sm">{bet.odds.toFixed(2)}</td>
                                    <td className="py-3 text-white text-sm">{formatCurrency(bet.stake)}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${bet.result === 'win'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {bet.result === 'win' ? 'Vitória' : 'Derrota'}
                                        </span>
                                    </td>
                                    <td className={`py-3 text-sm font-medium ${bet.profit > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-[#c4d82e]/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#c4d82e]/20 rounded-lg">
                        <Zap className="text-[#c4d82e]" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-green-400 font-medium mb-2">✅ Melhor Esporte</p>
                        <p className="text-white">MMA com 73% de taxa de acerto e ROI de 35%</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-[#c4d82e] font-medium mb-2">⚠️ Cuidado</p>
                        <p className="text-white">Handicap está com ROI negativo. Considere reduzir apostas.</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-blue-400 font-medium mb-2">💡 Oportunidade</p>
                        <p className="text-white">Mercado "Ambas Marcam" tem o melhor ROI: 32%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
