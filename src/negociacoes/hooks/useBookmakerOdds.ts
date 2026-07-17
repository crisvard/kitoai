/**
 * Hook para Gerenciamento de Odds via The Odds API
 * Busca odds reais de múltiplas casas de apostas e esportes
 * Proxy: /odds-api → https://api.the-odds-api.com/v4  (vite.config.ts)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BookmakerEvent, OddsComparison, BookmakerStats } from '../types/bookmaker';

// ─── Configuração ───────────────────────────────────────────────────────────

const BASE = '/odds-api';
const API_KEY = import.meta.env.VITE_ODDS_API_KEY || '';

/** Esportes suportados pela The Odds API com opção de Empate */
export const SPORTS_CONFIG = [
    // ── Brasil ────────────────────────────────────────────────────────────────
    { key: 'soccer_brazil_campeonato', label: 'Brasileirão Série A', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_serie_b', label: 'Brasileirão Série B', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_serie_c', label: 'Brasileirão Série C', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_copa_do_brasil', label: 'Copa do Brasil', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_estado_paulista', label: 'Campeonato Paulista', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_estado_carioca', label: 'Campeonato Carioca', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_estado_gaucho', label: 'Campeonato Gaúcho', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_estado_mineiro', label: 'Campeonato Mineiro', hasDraw: true, group: 'Brasil' },
    { key: 'soccer_brazil_estado_baiano', label: 'Campeonato Baiano', hasDraw: true, group: 'Brasil' },
    // ── América do Sul ────────────────────────────────────────────────────────
    { key: 'soccer_conmebol_copa_libertadores', label: 'Copa Libertadores', hasDraw: true, group: 'América do Sul' },
    { key: 'soccer_conmebol_copa_sudamericana', label: 'Copa Sul-Americana', hasDraw: true, group: 'América do Sul' },
    // ── Europa ────────────────────────────────────────────────────────────────
    { key: 'soccer_UEFA_champ_league', label: 'Champions League', hasDraw: true, group: 'Europa' },
    { key: 'soccer_UEFA_europa_league', label: 'UEFA Europa League', hasDraw: true, group: 'Europa' },
    { key: 'soccer_epl', label: 'Premier League', hasDraw: true, group: 'Europa' },
    { key: 'soccer_spain_la_liga', label: 'La Liga', hasDraw: true, group: 'Europa' },
    { key: 'soccer_italy_serie_a', label: 'Serie A Italiana', hasDraw: true, group: 'Europa' },
    { key: 'soccer_germany_bundesliga', label: 'Bundesliga', hasDraw: true, group: 'Europa' },
    { key: 'soccer_france_ligue_one', label: 'Ligue 1', hasDraw: true, group: 'Europa' },
    { key: 'soccer_portugal_primeira_liga', label: 'Primeira Liga (Portugal)', hasDraw: true, group: 'Europa' },
    { key: 'soccer_netherlands_eredivisie', label: 'Eredivisie', hasDraw: true, group: 'Europa' },
    // ── Outros ────────────────────────────────────────────────────────────────
    { key: 'basketball_nba', label: 'NBA', hasDraw: false, group: 'Outros' },
    { key: 'mma_mixed_martial_arts', label: 'MMA / UFC', hasDraw: false, group: 'Outros' },
    { key: 'boxing_boxing', label: 'Boxe', hasDraw: false, group: 'Outros' },
    { key: 'americanfootball_nfl', label: 'NFL', hasDraw: false, group: 'Outros' },
];

/** Regiões de bookmakers disponíveis na Odds API */
export type OddsRegion = 'us' | 'us2' | 'uk' | 'eu' | 'au';

export const REGIONS: { key: OddsRegion; label: string }[] = [
    { key: 'eu', label: 'Europa (Betano, Bet365, Betfair…)' },
    { key: 'uk', label: 'Reino Unido' },
    { key: 'us', label: 'EUA' },
    { key: 'us2', label: 'EUA 2' },
    { key: 'au', label: 'Austrália' },
];

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface RawEvent {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: RawBookmaker[];
}

interface RawBookmaker {
    key: string;
    title: string;
    last_update: string;
    markets: RawMarket[];
}

interface RawMarket {
    key: string;
    last_update: string;
    outcomes: { name: string; price: number; point?: number }[];
}

export interface OddsEventFull {
    id: string;
    sportKey: string;
    sportLabel: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    isLive: boolean;
    bookmakers: {
        key: string;
        title: string;
        lastUpdate: string;
        markets: {
            key: string;
            name: string;
            outcomes: { name: string; price: number; point?: number }[];
        }[];
    }[];
}

export interface UseBookmakerOddsReturn {
    events: OddsEventFull[];
    loading: boolean;
    error: string | null;
    creditsUsed: number;
    creditsRemaining: number;
    lastUpdate: string | null;
    selectedSports: string[];
    selectedRegions: OddsRegion[];
    selectedBookmakers: string[];
    availableBookmakers: string[];
    stats: BookmakerStats;
    refresh: () => void;
    toggleSport: (key: string) => void;
    toggleRegion: (r: OddsRegion) => void;
    toggleBookmaker: (name: string) => void;
    getComparisons: () => OddsComparison[];
    getLiveEvents: () => OddsEventFull[];
    getUpcomingEvents: () => OddsEventFull[];
}

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useBookmakerOdds(
    initSports: string[] = ['soccer_brazil_campeonato', 'soccer_brazil_serie_b', 'soccer_conmebol_copa_libertadores'],
    initRegions: OddsRegion[] = ['eu'],
): UseBookmakerOddsReturn {
    const [events, setEvents] = useState<OddsEventFull[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creditsUsed, setCreditsUsed] = useState(0);
    const [creditsRemaining, setCreditsRemaining] = useState(0);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [selectedSports, setSelectedSports] = useState<string[]>(initSports);
    const [selectedRegions, setSelectedRegions] = useState<OddsRegion[]>(initRegions);
    const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
    const [availableBookmakers, setAvailableBookmakers] = useState<string[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    // Label do esporte
    const getSportLabel = (key: string): string =>
        SPORTS_CONFIG.find(s => s.key === key)?.label ?? key;

    // Buscar um esporte de uma vez
    const fetchSport = useCallback(async (
        sportKey: string,
        regions: string[],
        signal: AbortSignal,
    ): Promise<OddsEventFull[]> => {
        if (!API_KEY) throw new Error('VITE_ODDS_API_KEY não configurada no .env');

        const params = new URLSearchParams({
            apiKey: API_KEY,
            regions: regions.join(','),
            markets: 'h2h',
            oddsFormat: 'decimal',
            dateFormat: 'iso',
        });

        const url = `${BASE}/sports/${sportKey}/odds?${params}`;
        const res = await fetch(url, { signal });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`[${sportKey}] HTTP ${res.status}: ${body}`);
        }

        // Capturar headers de créditos
        const used = parseInt(res.headers.get('x-requests-used') ?? '0', 10);
        const remaining = parseInt(res.headers.get('x-requests-remaining') ?? '0', 10);
        setCreditsUsed(prev => prev + used);
        setCreditsRemaining(remaining);

        const raw: RawEvent[] = await res.json();
        const now = new Date();

        return raw.map((ev): OddsEventFull => ({
            id: ev.id,
            sportKey: ev.sport_key,
            sportLabel: getSportLabel(ev.sport_key),
            homeTeam: ev.home_team,
            awayTeam: ev.away_team,
            commenceTime: ev.commence_time,
            isLive: new Date(ev.commence_time) <= now,
            bookmakers: ev.bookmakers.map(bk => ({
                key: bk.key,
                title: bk.title,
                lastUpdate: bk.last_update,
                markets: bk.markets.map(mk => ({
                    key: mk.key,
                    name: marketName(mk.key),
                    outcomes: mk.outcomes,
                })),
            })),
        }));
    }, []);

    // Buscar todos os esportes selecionados
    const fetchAll = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        setCreditsUsed(0);

        try {
            const results = await Promise.allSettled(
                selectedSports.map(sport =>
                    fetchSport(sport, selectedRegions, controller.signal)
                )
            );

            const allEvents: OddsEventFull[] = [];
            const errors: string[] = [];

            for (const r of results) {
                if (r.status === 'fulfilled') allEvents.push(...r.value);
                else if (!(r.reason instanceof DOMException && r.reason.name === 'AbortError')) {
                    errors.push(r.reason?.message ?? 'Erro desconhecido');
                }
            }

            if (controller.signal.aborted) return;

            setEvents(allEvents);
            setLastUpdate(new Date().toISOString());

            // Extrair bookmakers disponíveis
            const bkSet = new Set<string>();
            allEvents.forEach(ev => ev.bookmakers.forEach(bk => bkSet.add(bk.title)));
            setAvailableBookmakers(Array.from(bkSet).sort());

            if (errors.length > 0 && allEvents.length === 0) {
                setError(errors[0]);
            } else if (errors.length > 0) {
                console.warn('Alguns esportes falharam:', errors);
            }
        } catch (e) {
            if (!(e instanceof DOMException && e.name === 'AbortError')) {
                setError(e instanceof Error ? e.message : 'Erro ao buscar odds');
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [fetchSport, selectedSports, selectedRegions]);

    // Auto-fetch quando esportes/regiões mudam
    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 60_000); // atualiza a cada 1 min
        return () => {
            clearInterval(interval);
            abortRef.current?.abort();
        };
    }, [fetchAll]);

    // Filtrar eventos pelos bookmakers selecionados
    const filteredEvents = useCallback((): OddsEventFull[] => {
        if (selectedBookmakers.length === 0) return events;
        return events.map(ev => ({
            ...ev,
            bookmakers: ev.bookmakers.filter(bk => selectedBookmakers.includes(bk.title)),
        })).filter(ev => ev.bookmakers.length > 0);
    }, [events, selectedBookmakers]);

    // Comparações de odds entre casas para h2h
    const getComparisons = useCallback((): OddsComparison[] => {
        return filteredEvents().map(ev => {
            const best = {
                home: { bookmaker: '', odds: 0 },
                draw: { bookmaker: '', odds: 0 },
                away: { bookmaker: '', odds: 0 },
            };
            const bkList: OddsComparison['bookmakers'] = [];

            for (const bk of ev.bookmakers) {
                const h2h = bk.markets.find(m => m.key === 'h2h');
                if (!h2h) continue;

                const home = h2h.outcomes.find(o => o.name === ev.homeTeam)?.price ?? 0;
                const away = h2h.outcomes.find(o => o.name === ev.awayTeam)?.price ?? 0;
                const draw = h2h.outcomes.find(o => o.name === 'Draw')?.price ?? 0;

                bkList.push({ name: bk.title, homeOdds: home, drawOdds: draw, awayOdds: away, lastUpdated: bk.lastUpdate });

                if (home > best.home.odds) best.home = { bookmaker: bk.title, odds: home };
                if (draw > best.draw.odds) best.draw = { bookmaker: bk.title, odds: draw };
                if (away > best.away.odds) best.away = { bookmaker: bk.title, odds: away };
            }

            return {
                eventId: ev.id,
                homeTeam: ev.homeTeam,
                awayTeam: ev.awayTeam,
                league: ev.sportLabel,
                sport: ev.sportLabel,
                startTime: ev.commenceTime,
                bookmakers: bkList,
                bestOdds: best,
            };
        }).filter(c => c.bookmakers.length > 0);
    }, [filteredEvents]);

    const getLiveEvents = useCallback(() => filteredEvents().filter(e => e.isLive), [filteredEvents]);
    const getUpcomingEvents = useCallback(() => filteredEvents().filter(e => !e.isLive), [filteredEvents]);

    const stats: BookmakerStats = {
        totalEvents: filteredEvents().length,
        liveEvents: getLiveEvents().length,
        upcomingEvents: getUpcomingEvents().length,
        totalBookmakers: availableBookmakers.length,
        activeBookmakers: selectedBookmakers.length || availableBookmakers.length,
        lastUpdate: lastUpdate ?? '',
    };

    const toggleSport = (key: string) =>
        setSelectedSports(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

    const toggleRegion = (r: OddsRegion) =>
        setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

    const toggleBookmaker = (name: string) =>
        setSelectedBookmakers(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);

    return {
        events: filteredEvents(),
        loading,
        error,
        creditsUsed,
        creditsRemaining,
        lastUpdate,
        selectedSports,
        selectedRegions,
        selectedBookmakers,
        availableBookmakers,
        stats,
        refresh: fetchAll,
        toggleSport,
        toggleRegion,
        toggleBookmaker,
        getComparisons,
        getLiveEvents,
        getUpcomingEvents,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function marketName(key: string): string {
    const map: Record<string, string> = {
        h2h: 'Resultado Final (1X2)',
        spreads: 'Handicap',
        totals: 'Mais/Menos Gols',
        outrights: 'Campeão',
    };
    return map[key] ?? key;
}

// Manter compatibilidade com código antigo que usa BOOKMAKER_CONFIGS
export const BOOKMAKER_CONFIGS = SPORTS_CONFIG.map(s => ({
    name: s.label,
    url: '',
    scraper: '',
    enabled: true,
    updateInterval: 60,
    maxRetries: 3,
    difficulty: 'low' as const,
    features: [],
}));
