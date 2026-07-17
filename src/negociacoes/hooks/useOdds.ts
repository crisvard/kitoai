import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hedxxbsieoazrmbayzab.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface OddsEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  bookmaker: string;
  lastUpdate: number;
}

interface UseOddsReturn {
  odds: OddsEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOdds(sport: string = 'soccer'): UseOddsReturn {
  const [odds, setOdds] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-odds', {
        body: { sport }
      });

      if (fetchError) {
        console.error('Erro ao buscar odds:', fetchError);
        setError('Erro ao carregar odds');
        return;
      }

      if (data?.success) {
        setOdds(data.data || []);
        console.log(`📊 Odds carregadas: ${data.data?.length || 0} eventos (${data.source})`);
      } else {
        setError(data?.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
      setError('Falha ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchOdds();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchOdds, 60000);
    
    return () => clearInterval(interval);
  }, [fetchOdds]);

  return { odds, loading, error, refresh: fetchOdds };
}

// Hook para odds em tempo real (para mercados ao vivo)
export function useLiveOdds(sport: string = 'soccer'): UseOddsReturn {
  const { odds, loading, error, refresh } = useOdds(sport);
  
  // Filtrar apenas jogos que começam em menos de 30 minutos
  const liveOdds = odds.filter(o => {
    const timeUntilStart = o.startTime - Date.now();
    return timeUntilStart > 0 && timeUntilStart < 30 * 60 * 1000;
  });

  return {
    odds: liveOdds,
    loading,
    error,
    refresh
  };
}

// Hook para múltiplos esportes
export function useMultipleSportsOdds(sports: string[]): UseOddsReturn {
  const [allOdds, setAllOdds] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllOdds = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          sports.map(async (sport) => {
            const result = await supabase.functions.invoke('get-odds', { body: { sport } });
            return (result.data?.data || []) as OddsEvent[];
          })
        );

        setAllOdds(results.flat());
      } catch (err) {
        setError('Erro ao carregar odds');
      } finally {
        setLoading(false);
      }
    };

    fetchAllOdds();
  }, [sports.join(',')]);

  return { odds: allOdds, loading, error, refresh: async () => {} };
}
