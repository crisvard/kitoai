// SportMonks API Service - Football Odds Integration
// Documentation: https://sportmonks.com/docs/api/v3
// Includes Brazilian bookmakers like Bet365, Betano, Sportingbet, etc.

const SPORTMONKS_BASE_URL = 'https://api.sportmonks.com/v3';

export interface SportMonksOdds {
  id: string;
  fixtureId: number;
  sportId: number;
  leagueId: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string | number; // ISO string ou timestamp
  startTimeISO: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  bookmaker: string;
  lastUpdate: number;
  isLive: boolean;
}

export interface BookmakerOdds {
  bookmaker: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  lastUpdate: string;
}

export interface FixtureWithOdds {
  id: number;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  league: string;
  odds: BookmakerOdds[];
}

class SportMonksAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_SPORTMONKS_API_KEY || '';
    this.baseUrl = SPORTMONKS_BASE_URL;
  }

  // Buscar jogos com odds (inclui casas brasileiras)
  async getOddsByDate(
    date: string, // formato: YYYY-MM-DD
    leagueIds?: number[]
  ): Promise<SportMonksOdds[]> {
    if (!this.apiKey) {
      console.error('❌ SportMonks API key não configurada');
      return [];
    }

    console.log(`🔍 Buscando odds SportMonks para: ${date}`);

    try {
      // Buscar fixtures por data
      const fixturesUrl = `${this.baseUrl}/fixtures/date/${date}`;
      const fixturesParams = new URLSearchParams({
        api_token: this.apiKey,
        include: 'league,homeTeam,awayTeam,bookies',
        // Buscar apenas Brasileirão (league_id = 635 para Serie A)
        leagues: leagueIds?.join(',') || '635,271',
      });

      const response = await fetch(`${fixturesUrl}?${fixturesParams}`);

      if (!response.ok) {
        console.error(`❌ Erro na API: ${response.status}`);
        const errorData = await response.json();
        console.error('Detalhes do erro:', errorData);
        return [];
      }

      const data = await response.json();
      console.log(`✅ Recebidos ${data.data?.length || 0} jogos`);

      if (data.data && Array.isArray(data.data)) {
        return this.mapFixturesToOdds(data.data);
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar odds SportMonks:', error);
      return [];
    }
  }

  // Buscar odds de uma liga específica
  async getOddsByLeague(
    leagueId: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<SportMonksOdds[]> {
    if (!this.apiKey) {
      console.error('❌ SportMonks API key não configurada');
      return [];
    }

    try {
      let url = `${this.baseUrl}/odds/fixture/{fixture_id}`;
      
      // Na verdade, vamos buscar fixtures com odds
      const params = new URLSearchParams({
        api_token: this.apiKey,
        include: 'league,homeTeam,awayTeam,bookies',
        leagues: leagueId.toString(),
      });

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`${this.baseUrl}/fixtures?${params}`);

      if (!response.ok) {
        console.error(`❌ Erro na API: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        return this.mapFixturesToOdds(data.data);
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar odds por liga:', error);
      return [];
    }
  }

  // Buscar odds de um jogo específico
  async getOddsByFixture(fixtureId: number): Promise<FixtureWithOdds | null> {
    if (!this.apiKey) {
      console.error('❌ SportMonks API key não configurada');
      return null;
    }

    try {
      const params = new URLSearchParams({
        api_token: this.apiKey,
        include: 'league,homeTeam,awayTeam,bookies',
      });

      const response = await fetch(
        `${this.baseUrl}/fixtures/${fixtureId}?${params}`
      );

      if (!response.ok) {
        console.error(`❌ Erro na API: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.data) {
        return this.mapFixtureWithAllBookmakers(data.data);
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar odds do jogo:', error);
      return null;
    }
  }

  // Mapear resposta para formato interno
  private mapFixturesToOdds(fixtures: any[]): SportMonksOdds[] {
    const now = Date.now();
    
    return fixtures
      .filter((f) => f.bookies && f.bookies.length > 0)
      .map((fixture) => {
        const bookie = fixture.bookies?.[0];
        const homeTeam = fixture.homeTeam?.name || fixture.home_team?.name;
        const awayTeam = fixture.awayTeam?.name || fixture.away_team?.name;
        
        // Encontrar odds de 1X2 (match result)
        const odds1X2 = bookie?.odds?.find(
          (o: any) => o.label === '1X2' || o.name === '1X2'
        );

        const startTimeMs = new Date(
          fixture.starting_at || fixture.startingAt
        ).getTime();

        const isLive = Math.abs(startTimeMs - now) < 2 * 60 * 60 * 1000;

        return {
          id: fixture.id?.toString() || Math.random().toString(),
          fixtureId: fixture.id,
          sportId: fixture.sport_id || fixture.sportId,
          leagueId: fixture.league_id || fixture.leagueId,
          league: fixture.league?.name || fixture.league?.name || 'Unknown',
          homeTeam,
          awayTeam,
          startTime: startTimeMs,
          startTimeISO: fixture.starting_at || fixture.startingAt,
          homeOdds: odds1X2?.odds?.home || odds1X2?.home || 0,
          drawOdds: odds1X2?.odds?.draw || odds1X2?.draw || 0,
          awayOdds: odds1X2?.odds?.away || odds1X2?.away || 0,
          bookmaker: bookie?.name || bookie?.bookmaker?.name || 'Unknown',
          lastUpdate: Date.now(),
          isLive,
        };
      })
      .filter((o) => o.homeOdds > 0);
  }

  // Mapear fixture com todas as casas de aposta
  private mapFixtureWithAllBookmakers(fixture: any): FixtureWithOdds {
    const homeTeam = fixture.homeTeam?.name || fixture.home_team?.name;
    const awayTeam = fixture.awayTeam?.name || fixture.away_team?.name;

    const odds: BookmakerOdds[] = (fixture.bookies || []).map((bookie: any) => {
      const odds1X2 = bookie?.odds?.find(
        (o: any) => o.label === '1X2' || o.name === '1X2'
      );

      return {
        bookmaker: bookie?.name || bookie?.bookmaker?.name || 'Unknown',
        homeOdds: odds1X2?.odds?.home || odds1X2?.home || 0,
        drawOdds: odds1X2?.odds?.draw || odds1X2?.draw || 0,
        awayOdds: odds1X2?.odds?.away || odds1X2?.away || 0,
        lastUpdate: bookie?.lastUpdate || new Date().toISOString(),
      };
    });

    return {
      id: fixture.id,
      homeTeam,
      awayTeam,
      startTime: fixture.starting_at || fixture.startingAt,
      league: fixture.league?.name || 'Unknown',
      odds,
    };
  }

  // Listar casas de aposta disponíveis
  async getBookmakers(): Promise<{ id: number; name: string; imageId: string }[]> {
    if (!this.apiKey) {
      console.error('❌ SportMonks API key não configurada');
      return [];
    }

    try {
      const params = new URLSearchParams({
        api_token: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}/bookies?${params}`);

      if (!response.ok) {
        console.error(`❌ Erro na API: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar casas de aposta:', error);
      return [];
    }
  }

  // Listar ligas disponíveis
  async getLeagues(): Promise<{ id: number; name: string; countryId: number }[]> {
    if (!this.apiKey) {
      console.error('❌ SportMonks API key não configurada');
      return [];
    }

    try {
      const params = new URLSearchParams({
        api_token: this.apiKey,
        // Buscar apenas ligas ativas
        active: 'true',
      });

      const response = await fetch(`${this.baseUrl}/leagues?${params}`);

      if (!response.ok) {
        console.error(`❌ Erro na API: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar ligas:', error);
      return [];
    }
  }

  // Verificar créditos disponíveis
  async getCredits(): Promise<number> {
    if (!this.apiKey) return 0;

    try {
      const params = new URLSearchParams({
        api_token: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}/mycredits?${params}`);
      const data = await response.json();
      
      return data.credits_available || 0;
    } catch (error) {
      console.error('Erro ao verificar créditos:', error);
      return 0;
    }
  }

  // Verificar se API está configurada
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Exportar instância
export const sportmonksAPI = new SportMonksAPI();

// Constantes úteis
export const BRAZILIAN_LEAGUES = {
  CAMPEONATO_BRASILEIRO_SERIE_A: 635,
  CAMPEONATO_BRASILEIRO_SERIE_B: 271,
  COPA_DO_BRASIL: 454,
  CAMPEONATO_BRASILEIRO_SERIE_C: 1765,
};

export const POPULAR_BOOKMAKERS = {
  BET365: 'bet365',
  BETANO: 'Betano',
  SPORTINGBET: ' Sportingbet',
  BETWAY: 'Betway',
  PIXBET: 'Pixbet',
  GALERA_BET: 'Galera.bet',
  H2H: 'h2h',
};

// Funções utilitárias
export function formatMatchTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBestOdds(odds: BookmakerOdds[]): BookmakerOdds | null {
  if (!odds || odds.length === 0) return null;
  
  // Encontrar melhor odd para cada resultado
  const best: BookmakerOdds = {
    bookmaker: '',
    homeOdds: 0,
    drawOdds: 0,
    awayOdds: 0,
    lastUpdate: '',
  };

  odds.forEach((o) => {
    if (o.homeOdds > best.homeOdds) {
      best.homeOdds = o.homeOdds;
      best.bookmaker = o.bookmaker;
    }
    if (o.drawOdds > best.drawOdds) best.drawOdds = o.drawOdds;
    if (o.awayOdds > best.awayOdds) best.awayOdds = o.awayOdds;
  });

  return best;
}

export function calculateParlay(odds: number[]): number {
  return odds.reduce((acc, odd) => acc * odd, 1);
}
