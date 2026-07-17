import { useState, useEffect, useCallback } from 'react';
import { BetanoMatch, BetanoMarket } from '../services/betano-scraper';
import { createClient } from '@supabase/supabase-js';

export interface UseBetanoScraperReturn {
    matches: BetanoMatch[];
    liveMatches: BetanoMatch[];
    upcomingMatches: BetanoMatch[];
    loading: boolean;
    error: string | null;
    lastUpdate: string | null;
    refresh: () => Promise<void>;
    fetchMatchOdds: (matchId: string) => Promise<BetanoMarket[]>;
    fetchSportMatches: (sport: string) => Promise<void>;
}

// Supabase client para buscar dados reais da tabela betting_odds
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function useBetanoScraper(autoRefresh: boolean = true, refreshInterval: number = 30000): UseBetanoScraperReturn {
    const [matches, setMatches] = useState<BetanoMatch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        if (!supabase) {
            setError('Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Buscar dados reais da tabela betting_odds no Supabase
            const { data, error: dbError } = await supabase
                .from('betting_odds')
                .select('*')
                .order('last_update', { ascending: false });

            if (dbError) {
                console.error('Erro ao buscar betting_odds:', dbError);
                setError(`Erro no banco: ${dbError.message}`);
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                setError(null);
                setMatches([]);
                setLoading(false);
                return;
            }

            // Mapear dados do Supabase para o formato BetanoMatch esperado pela UI
            const mappedMatches: BetanoMatch[] = data.map((row: any) => ({
                id: row.id,
                homeTeam: row.home_team,
                awayTeam: row.away_team,
                league: row.league || 'Liga',
                sport: row.sport === 'soccer' ? 'Futebol' : row.sport,
                startTime: row.start_time || row.last_update || new Date().toISOString(),
                isLive: row.is_live || false,
                minute: undefined,
                score: undefined,
                markets: [
                    {
                        id: `${row.id}-1x2`,
                        name: 'Resultado Final',
                        selections: [
                            { id: `${row.id}-home`, name: '1', odds: Number(row.home_odds) },
                            { id: `${row.id}-draw`, name: 'X', odds: Number(row.draw_odds) },
                            { id: `${row.id}-away`, name: '2', odds: Number(row.away_odds) },
                        ].filter(s => s.odds > 0)
                    }
                ]
            }));

            setMatches(mappedMatches);
            setLastUpdate(new Date().toISOString());
            console.log(`✅ Carregados ${mappedMatches.length} jogos do Supabase`);
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMatchOdds = useCallback(async (matchId: string): Promise<BetanoMarket[]> => {
        // As odds já estão nos matches carregados
        const match = matches.find(m => m.id === matchId);
        return match?.markets || [];
    }, [matches]);

    const fetchSportMatches = useCallback(async (sport: string) => {
        // Re-fetch com filtro de esporte
        await fetchMatches();
    }, [fetchMatches]);

    // Auto-refresh
    useEffect(() => {
        fetchMatches();

        if (autoRefresh) {
            const interval = setInterval(fetchMatches, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchMatches, autoRefresh, refreshInterval]);

    // Filtrar jogos ao vivo
    const liveMatches = matches.filter(match => match.isLive);

    // Filtrar jogos futuros
    const upcomingMatches = matches.filter(match => !match.isLive);

    return {
        matches,
        liveMatches,
        upcomingMatches,
        loading,
        error,
        lastUpdate,
        refresh: fetchMatches,
        fetchMatchOdds,
        fetchSportMatches,
    };
}
