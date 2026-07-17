import { supabase } from '../lib/supabase';

// ─── Interfaces ─────────────────────────────────────────────────────

export interface GeneratedBet {
  id: string;
  type: 'single' | 'multiple';
  totalOdds: number;
  bookmaker: string;
  isReal: boolean;
  selections: {
    match: string;
    market: string;
    selection: string;
    odd: number;
    probability?: number;
    startTime?: string;
  }[];
}

// ─── Bookmakers Baseados no Scraper ──────────────────────────────────────────

export const BOOKMAKERS: { id: number; label: string; value: string }[] = [
  { id: 1, label: 'Betano (Local Scraper)', value: 'betano' },
  { id: 2, label: 'Qualquer Local', value: 'any' },
];

// ─── Serviço Exclusivo de Banco de Dados Local (Sem APIs Externas) ────────────

export class LocalBettingService {
  /** Gera bilhetes de apostas unicamente com os dados inseridos pelo Scraper em Python */
  async generateBets(params: {
    bookmakerId: number;
    type: 'single' | 'multiple';
    quantity: number;
    targetOddsMin: number;
    targetOddsMax: number;
  }): Promise<GeneratedBet[]> {
    const { type, quantity, targetOddsMin, targetOddsMax } = params;

    // ── 1. Busca Direta no Supabase ───────────────────────────
    const agora = new Date().toISOString();
    const { data: matches, error } = await supabase
      .from('betting_odds')
      .select('*')
      .or(`is_live.eq.true,start_time.gte.${agora}`)
      .order('start_time', { ascending: true });

    if (error || !matches || matches.length === 0) {
      console.warn('[LocalBettingService] Erro ao buscar matches locais ou tabela vazia:', error);
      return [];
    }

    // ── 2. Desdobramento de Seleções ─────────────────────────
    type Candidate = { homeTeam: string; awayTeam: string; odd: number; bookmaker: string; startTime: string; league: string; selection: string; market: string };
    const candidates: Candidate[] = [];

    for (const row of matches) {
      // Mandante (1)
      if (row.home_odds > 1.0) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.home_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: row.home_team, market: 'Resultado Final (1x2)' });
      }
      // Empate (X)
      if (row.draw_odds > 1.0) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.draw_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: 'Empate', market: 'Resultado Final (1x2)' });
      }
      // Visitante (2)
      if (row.away_odds > 1.0) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.away_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: row.away_team, market: 'Resultado Final (1x2)' });
      }
      // Escanteios Over
      if (row.corners_over_odds > 1.0 && row.corners_line) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.corners_over_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: `Mais de ${row.corners_line} Escanteios`, market: `Escanteios Mais/Menos (${row.corners_line})` });
      }
      // Escanteios Under
      if (row.corners_under_odds > 1.0 && row.corners_line) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.corners_under_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: `Menos de ${row.corners_line} Escanteios`, market: `Escanteios Mais/Menos (${row.corners_line})` });
      }
      // Cartões Over
      if (row.cards_over_odds > 1.0 && row.cards_line) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.cards_over_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: `Mais de ${row.cards_line} Cartões`, market: `Cartões Mais/Menos (${row.cards_line})` });
      }
      // Cartões Under
      if (row.cards_under_odds > 1.0 && row.cards_line) {
        candidates.push({ homeTeam: row.home_team, awayTeam: row.away_team, odd: Number(row.cards_under_odds), bookmaker: row.bookmaker || 'Betano', startTime: row.start_time || row.last_update || new Date().toISOString(), league: row.league, selection: `Menos de ${row.cards_line} Cartões`, market: `Cartões Mais/Menos (${row.cards_line})` });
      }
    }

    const results: GeneratedBet[] = [];
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);

    // ── 3. Montagem (Simples) ────────────────────────────────
    if (type === 'single') {
      const filtered = shuffled.filter(c => c.odd >= targetOddsMin && c.odd <= targetOddsMax);
      for (let i = 0; i < Math.min(quantity, filtered.length); i++) {
        const c = filtered[i];
        results.push({
          id: `db-single-${Date.now()}-${i}`,
          type: 'single',
          totalOdds: c.odd,
          bookmaker: c.bookmaker,
          isReal: true,
          selections: [{
            match: `${c.homeTeam} x ${c.awayTeam}`,
            market: c.market,
            selection: c.selection,
            odd: c.odd,
            startTime: c.startTime,
          }],
        });
      }
    }
      // ── 4. Montagem (Múltipla) ──────────────────────────────
    else {
      for (let b = 0; b < quantity; b++) {
        let currentTicket: Candidate[] = [];
        let currentTotalOdds = 1.0;
        let attempts = 0;
        const usedMatches = new Set<string>();

        while (attempts < 100 && (currentTotalOdds < targetOddsMin || currentTicket.length < 2)) {
          const pick = shuffled[Math.floor(Math.random() * shuffled.length)];
          const matchKey = `${pick.homeTeam}-${pick.awayTeam}`;

          // Validar que o jogo é do futuro (ou ao vivo) e não duplica
          if (!usedMatches.has(matchKey) && (currentTotalOdds * pick.odd) <= targetOddsMax * 1.5) {
            currentTicket.push(pick);
            currentTotalOdds *= pick.odd;
            usedMatches.add(matchKey);
          }

          if (currentTotalOdds >= targetOddsMin && currentTotalOdds <= targetOddsMax && currentTicket.length >= 2) {
            break;
          }

          if (currentTicket.length >= 6 || currentTotalOdds > targetOddsMax) {
            currentTicket = [];
            currentTotalOdds = 1.0;
            usedMatches.clear();
          }
          attempts++;
        }

        if (currentTicket.length >= 2 && currentTotalOdds >= targetOddsMin && currentTotalOdds <= targetOddsMax) {
          results.push({
            id: `db-multi-${Date.now()}-${b}`,
            type: 'multiple',
            totalOdds: Math.round(currentTotalOdds * 100) / 100,
            bookmaker: currentTicket[0]?.bookmaker || 'Local Scraper',
            isReal: true,
            selections: currentTicket.map(p => ({
              match: `${p.homeTeam} x ${p.awayTeam}`,
              market: p.market,
              selection: p.selection,
              odd: p.odd,
              startTime: p.startTime,
            })),
          });
        }
      }
    }

    return results;
  }
}

// Exportar as instâncias para retrocompatibilidade
export const sportmonksAPI = new LocalBettingService();
