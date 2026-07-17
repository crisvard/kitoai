import { useState, useMemo } from 'react';
import {
    RefreshCw, AlertCircle, TrendingUp, Zap, Activity, Dices,
    ChevronDown, ChevronUp, Star, Globe, Filter, Key, ExternalLink,
    CheckCircle, Trophy
} from 'lucide-react';
import { useBookmakerOdds, SPORTS_CONFIG, REGIONS, OddsRegion } from '../hooks/useBookmakerOdds';

// ─── helpers UI ──────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function oddsColor(odds: number, best: number) {
    if (odds <= 0) return 'text-gray-600';
    if (odds === best) return 'text-green-400 font-bold';
    if (odds >= best * 0.98) return 'text-yellow-400';
    return 'text-white';
}

/** Detecta arbitragem simples (1/h + 1/d + 1/a < 1) */
function arbMargin(h: number, d: number, a: number): number {
    const sum = 1 / h + (d > 0 ? 1 / d : 0) + 1 / a;
    return sum;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookmakerMirror() {
    const {
        events, loading, error, creditsRemaining, lastUpdate,
        selectedSports, selectedRegions, selectedBookmakers, availableBookmakers,
        stats, refresh, toggleSport, toggleRegion, toggleBookmaker, getComparisons,
    } = useBookmakerOdds(
        ['soccer_brazil_campeonato', 'soccer_brazil_serie_b', 'soccer_conmebol_copa_libertadores'],
        ['eu'],
    );

    const [showSportFilter, setShowSportFilter] = useState(false);
    const [showRegionFilter, setShowRegionFilter] = useState(false);
    const [showBkFilter, setShowBkFilter] = useState(false);
    const [expandedEvents, setExpandedEvents] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'comparison' | 'events'>('comparison');
    const [showArbOnly, setShowArbOnly] = useState(false);
    const [noApiKey] = useState(!import.meta.env.VITE_ODDS_API_KEY);

    const comparisons = useMemo(() => getComparisons(), [getComparisons]);

    const visibleComparisons = useMemo(() => {
        if (!showArbOnly) return comparisons;
        return comparisons.filter(c => {
            const h = c.bestOdds.home.odds;
            const d = c.bestOdds.draw.odds;
            const a = c.bestOdds.away.odds;
            return arbMargin(h, d > 0 ? d : Infinity, a) < 1;
        });
    }, [comparisons, showArbOnly]);

    const toggleExpand = (id: string) =>
        setExpandedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    // ─── No API key warning ───────────────────────────────────────────────────
    if (noApiKey) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Dices className="text-[#c4d82e]" size={32} />
                        OddsHub — Todas as Casas
                    </h2>
                    <p className="text-gray-400">Odds em tempo real de todas as casas via The Odds API</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-8 flex flex-col items-center gap-4">
                    <Key className="text-yellow-400" size={48} />
                    <h3 className="text-xl font-bold text-white">Configure sua API Key</h3>
                    <p className="text-gray-300 text-center max-w-md">
                        Adicione <code className="bg-white/10 px-2 py-0.5 rounded text-[#c4d82e]">VITE_ODDS_API_KEY=sua_chave</code> no arquivo <code className="bg-white/10 px-2 py-0.5 rounded">.env</code> do projeto.
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                        Chave gratuita com 500 créditos/mês em{' '}
                        <a href="https://the-odds-api.com/" target="_blank" rel="noopener noreferrer"
                            className="text-[#c4d82e] hover:underline inline-flex items-center gap-1">
                            the-odds-api.com <ExternalLink size={12} />
                        </a>
                    </p>
                    <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-green-400 w-full max-w-md">
                        <p className="text-gray-500"># .env</p>
                        <p>VITE_ODDS_API_KEY=<span className="text-white">sua_chave_aqui</span></p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">

            {/* ── Header ───────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Dices className="text-[#c4d82e]" size={32} />
                        OddsHub — Todas as Casas
                    </h2>
                    <p className="text-gray-400 text-sm">
                        The Odds API · {selectedSports.length} esporte(s) · {selectedRegions.join(', ').toUpperCase()}
                        {lastUpdate && (
                            <span className="ml-2 text-gray-500">· Atualizado: {fmtTime(lastUpdate)}</span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {creditsRemaining > 0 && (
                        <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 text-xs text-gray-400">
                            <CheckCircle size={14} className="text-green-400" />
                            {creditsRemaining} créditos restantes
                        </div>
                    )}
                    <button onClick={refresh} disabled={loading}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors disabled:opacity-50">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Buscando…' : 'Atualizar'}
                    </button>
                </div>
            </div>

            {/* ── Stats Cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Activity, color: 'text-[#c4d82e]', label: 'Total Eventos', value: stats.totalEvents },
                    { icon: Zap, color: 'text-red-400', label: 'Ao Vivo', value: stats.liveEvents },
                    { icon: TrendingUp, color: 'text-blue-400', label: 'Próximos', value: stats.upcomingEvents },
                    { icon: Dices, color: 'text-[#c4d82e]', label: 'Casas', value: availableBookmakers.length },
                ].map(({ icon: Icon, color, label, value }) => (
                    <div key={label} className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className={color} size={18} />
                            <span className="text-gray-400 text-sm">{label}</span>
                        </div>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters row ──────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3">

                {/* Esportes */}
                <div className="relative">
                    <button
                        onClick={() => { setShowSportFilter(v => !v); setShowRegionFilter(false); setShowBkFilter(false); }}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#c4d82e]/50 px-4 py-2 rounded-lg text-sm text-white transition-colors">
                        <Filter size={16} className="text-[#c4d82e]" />
                        Esportes ({selectedSports.length})
                        {showSportFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showSportFilter && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-3 max-h-[480px] overflow-y-auto">
                            {/* Agrupado por região */}
                            {(['Brasil', 'América do Sul', 'Europa', 'Outros'] as const).map(group => {
                                const grouped = SPORTS_CONFIG.filter(s => s.group === group);
                                const allSelected = grouped.every(s => selectedSports.includes(s.key));
                                return (
                                    <div key={group} className="mb-3">
                                        <div className="flex items-center justify-between px-2 mb-1">
                                            <p className="text-[#c4d82e] text-xs font-bold uppercase tracking-wider">{group}</p>
                                            <button
                                                onClick={() => grouped.forEach(s => {
                                                    if (!allSelected && !selectedSports.includes(s.key)) toggleSport(s.key);
                                                    if (allSelected && selectedSports.includes(s.key)) toggleSport(s.key);
                                                })}
                                                className="text-xs text-gray-500 hover:text-white transition-colors">
                                                {allSelected ? 'Desmarcar' : 'Todos'}
                                            </button>
                                        </div>
                                        {grouped.map(s => (
                                            <label key={s.key} className="flex items-center gap-3 px-2 py-1.5 hover:bg-white/5 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={selectedSports.includes(s.key)}
                                                    onChange={() => toggleSport(s.key)}
                                                    className="w-4 h-4 accent-[#c4d82e]" />
                                                <span className="text-white text-sm">{s.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Regiões */}
                <div className="relative">
                    <button
                        onClick={() => { setShowRegionFilter(v => !v); setShowSportFilter(false); setShowBkFilter(false); }}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#c4d82e]/50 px-4 py-2 rounded-lg text-sm text-white transition-colors">
                        <Globe size={16} className="text-[#c4d82e]" />
                        Regiões ({selectedRegions.length})
                        {showRegionFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showRegionFilter && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-3">
                            {REGIONS.map(r => (
                                <label key={r.key} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                    <input type="checkbox" checked={selectedRegions.includes(r.key as OddsRegion)}
                                        onChange={() => toggleRegion(r.key as OddsRegion)}
                                        className="w-4 h-4 accent-[#c4d82e]" />
                                    <span className="text-white text-sm"><span className="font-mono text-[#c4d82e] mr-1">{r.key.toUpperCase()}</span>{r.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bookmakers */}
                {availableBookmakers.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => { setShowBkFilter(v => !v); setShowSportFilter(false); setShowRegionFilter(false); }}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#c4d82e]/50 px-4 py-2 rounded-lg text-sm text-white transition-colors">
                            <Star size={16} className="text-[#c4d82e]" />
                            Casas ({selectedBookmakers.length === 0 ? 'Todas' : selectedBookmakers.length})
                            {showBkFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showBkFilter && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-3 max-h-72 overflow-y-auto">
                                <button onClick={() => availableBookmakers.forEach(b => { if (!selectedBookmakers.includes(b)) toggleBookmaker(b); })}
                                    className="w-full text-left text-xs text-[#c4d82e] px-2 py-1 hover:bg-white/5 rounded mb-1">
                                    Selecionar todas
                                </button>
                                <button onClick={() => availableBookmakers.forEach(b => { if (selectedBookmakers.includes(b)) toggleBookmaker(b); })}
                                    className="w-full text-left text-xs text-gray-400 px-2 py-1 hover:bg-white/5 rounded mb-2">
                                    Limpar seleção
                                </button>
                                {availableBookmakers.map(bk => (
                                    <label key={bk} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                        <input type="checkbox" checked={selectedBookmakers.length === 0 || selectedBookmakers.includes(bk)}
                                            onChange={() => toggleBookmaker(bk)}
                                            className="w-4 h-4 accent-[#c4d82e]" />
                                        <span className="text-white text-sm">{bk}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Só arbitragem */}
                <button onClick={() => setShowArbOnly(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${showArbOnly ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-green-500/50'}`}>
                    <Trophy size={16} />
                    Só Arbitragem
                </button>
            </div>

            {/* ── Error ────────────────────────────────────────────────────────── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-red-400 font-medium">Erro ao buscar odds</p>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* ── Loading skeleton ─────────────────────────────────────────────── */}
            {loading && events.length === 0 && (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-pulse">
                            <div className="h-5 bg-white/10 rounded w-1/3 mb-3" />
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(j => <div key={j} className="h-10 bg-white/10 rounded" />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tabs ─────────────────────────────────────────────────────────── */}
            {events.length > 0 && (
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
                    {([['comparison', 'Comparação de Odds'], ['events', 'Todos os Eventos']] as const).map(([tab, label]) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-[#c4d82e] text-black' : 'text-gray-400 hover:text-white'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Comparison Tab ───────────────────────────────────────────────── */}
            {activeTab === 'comparison' && (
                <div className="space-y-4">
                    {visibleComparisons.length === 0 && !loading && (
                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                            <Dices className="text-gray-600 mx-auto mb-4" size={48} />
                            <p className="text-gray-400">
                                {showArbOnly ? 'Nenhuma oportunidade de arbitragem encontrada' : 'Nenhum evento encontrado'}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">Selecione esportes e regiões nos filtros acima</p>
                        </div>
                    )}

                    {visibleComparisons.map(cmp => {
                        const isExpanded = expandedEvents.includes(cmp.eventId);
                        const margin = arbMargin(
                            cmp.bestOdds.home.odds,
                            cmp.bestOdds.draw.odds > 0 ? cmp.bestOdds.draw.odds : Infinity,
                            cmp.bestOdds.away.odds,
                        );
                        const hasArb = margin < 1;

                        return (
                            <div key={cmp.eventId}
                                className={`bg-white/5 backdrop-blur-xl rounded-2xl border transition-all ${hasArb ? 'border-green-500/50 shadow-lg shadow-green-500/10' : 'border-white/10'}`}>

                                {/* Header do evento */}
                                <button className="w-full p-5 text-left" onClick={() => toggleExpand(cmp.eventId)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-[#c4d82e] font-medium bg-[#c4d82e]/10 px-2 py-0.5 rounded">
                                                        {cmp.league}
                                                    </span>
                                                    {hasArb && (
                                                        <span className="text-xs text-green-400 font-bold bg-green-500/20 border border-green-500/40 px-2 py-0.5 rounded animate-pulse">
                                                            🎯 ARBITRAGEM {((1 - margin) * 100).toFixed(2)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-white font-bold text-lg">
                                                    {cmp.homeTeam} <span className="text-gray-400 font-normal">vs</span> {cmp.awayTeam}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[#c4d82e] font-medium">{fmtDate(cmp.startTime)}</p>
                                                <p className="text-gray-400 text-sm">{fmtTime(cmp.startTime)}</p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="text-gray-400" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
                                        </div>
                                    </div>

                                    {/* Melhores odds resumo */}
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {([
                                            ['Casa', cmp.bestOdds.home],
                                            ['Empate', cmp.bestOdds.draw],
                                            ['Fora', cmp.bestOdds.away],
                                        ] as const).map(([label, best]) => (
                                            <div key={label} className={`rounded-xl p-3 text-center border ${best.odds > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                                                <p className="text-gray-400 text-xs mb-1">{label}</p>
                                                <p className={`text-2xl font-bold ${best.odds > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                                                    {best.odds > 0 ? best.odds.toFixed(2) : '—'}
                                                </p>
                                                {best.bookmaker && (
                                                    <p className="text-green-300 text-xs mt-1 truncate">{best.bookmaker}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </button>

                                {/* Tabela expandida por casa */}
                                {isExpanded && (
                                    <div className="border-t border-white/10 p-5">
                                        <p className="text-gray-400 text-sm mb-3 font-medium">Odds por casa de apostas:</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-gray-500 text-xs">
                                                        <th className="text-left pb-3 pr-4">Casa</th>
                                                        <th className="text-center pb-3 px-3">Casa</th>
                                                        <th className="text-center pb-3 px-3">Empate</th>
                                                        <th className="text-center pb-3 px-3">Fora</th>
                                                        <th className="text-center pb-3 pl-3 hidden md:table-cell">Margem</th>
                                                        <th className="text-right pb-3 hidden md:table-cell">Atualizado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {cmp.bookmakers.map(bk => {
                                                        const m = arbMargin(bk.homeOdds, bk.drawOdds > 0 ? bk.drawOdds : Infinity, bk.awayOdds);
                                                        return (
                                                            <tr key={bk.name} className="hover:bg-white/5 transition-colors">
                                                                <td className="py-3 pr-4">
                                                                    <span className="text-white font-medium">{bk.name}</span>
                                                                </td>
                                                                <td className={`text-center py-3 px-3 ${oddsColor(bk.homeOdds, cmp.bestOdds.home.odds)}`}>
                                                                    {bk.homeOdds > 0 ? bk.homeOdds.toFixed(2) : '—'}
                                                                </td>
                                                                <td className={`text-center py-3 px-3 ${oddsColor(bk.drawOdds, cmp.bestOdds.draw.odds)}`}>
                                                                    {bk.drawOdds > 0 ? bk.drawOdds.toFixed(2) : '—'}
                                                                </td>
                                                                <td className={`text-center py-3 px-3 ${oddsColor(bk.awayOdds, cmp.bestOdds.away.odds)}`}>
                                                                    {bk.awayOdds > 0 ? bk.awayOdds.toFixed(2) : '—'}
                                                                </td>
                                                                <td className="text-center py-3 pl-3 hidden md:table-cell">
                                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m < 1 ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}>
                                                                        {(m * 100).toFixed(1)}%
                                                                    </span>
                                                                </td>
                                                                <td className="text-right py-3 text-gray-500 text-xs hidden md:table-cell">
                                                                    {fmtTime(bk.lastUpdated)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Events Tab ─────────────────────────────────────────────────────── */}
            {activeTab === 'events' && (
                <div className="space-y-3">
                    {events.length === 0 && !loading && (
                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                            <Activity className="text-gray-600 mx-auto mb-4" size={48} />
                            <p className="text-gray-400">Nenhum evento encontrado</p>
                        </div>
                    )}
                    {events.map(ev => (
                        <div key={ev.id} className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden ${ev.isLive ? 'border-red-500/30' : ''}`}>
                            <button className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                                onClick={() => toggleExpand(ev.id)}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-[#c4d82e]">{ev.sportLabel}</span>
                                            {ev.isLive && (
                                                <span className="text-xs text-red-400 font-bold bg-red-500/20 px-2 py-0.5 rounded-full animate-pulse">AO VIVO</span>
                                            )}
                                        </div>
                                        <p className="text-white font-semibold">{ev.homeTeam} vs {ev.awayTeam}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 text-sm">{ev.bookmakers.length} casas</span>
                                        <span className="text-gray-400 text-sm">{fmtDate(ev.commenceTime)} {fmtTime(ev.commenceTime)}</span>
                                        {expandedEvents.includes(ev.id) ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                    </div>
                                </div>
                            </button>

                            {expandedEvents.includes(ev.id) && (
                                <div className="border-t border-white/10 p-4 space-y-4">
                                    {ev.bookmakers.map(bk => (
                                        <div key={bk.key} className="bg-white/5 rounded-lg p-3">
                                            <p className="text-white font-medium mb-2 text-sm">{bk.title}</p>
                                            {bk.markets.map(mk => (
                                                <div key={mk.key} className="mb-2">
                                                    <p className="text-gray-500 text-xs mb-1">{mk.name}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {mk.outcomes.map(oc => (
                                                            <div key={oc.name} className="bg-white/10 rounded-lg px-3 py-2 text-center min-w-[80px]">
                                                                <p className="text-gray-400 text-xs truncate">{oc.name}</p>
                                                                <p className="text-white font-bold">{oc.price.toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
