// The Odds API Integration
// Documentação: https://the-odds-api.com/
// API v4 — via proxy Vite /odds-api para evitar CORS

// Em dev: /odds-api/* → proxy Vite → api.the-odds-api.com/v4/*
const ODDS_API_BASE = '/odds-api';
const DEFAULT_ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY || '';

export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
}

export interface Bookmaker {
  key: string;
  title: string;
  lastUpdate: number;
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface OddsResponse {
  success: boolean;
  data: Event[];
  apiCreditsUsed: number;
}

export interface ParsedOdds {
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

// Mapeamento de esportes
const SPORT_KEYS: Record<string, string> = {
  'soccer': 'soccer',
  'basketball': 'basketball_nba',
  'american_football': 'americanfootball_nfl',
  'tennis': 'tennis_atp',
  'mma': 'mma_mma',
  'boxing': 'boxing_boxing',
};

class OddsAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = DEFAULT_ODDS_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = ODDS_API_BASE;
  }

  // Lista de esportes disponíveis
  async getSports(): Promise<Sport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sports`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar esportes:', error);
      return [];
    }
  }

  // Buscar odds de um esporte específico
  async getOdds(
    sport: string,
    regions: string[] = ['us', 'uk', 'eu'],
    markets: string[] = ['h2h', 'totals', 'spreads']
  ): Promise<ParsedOdds[]> {
    const sportKey = SPORT_KEYS[sport] || sport;

    try {
      // Tentar com API key se disponível
      if (this.apiKey) {
        const params = new URLSearchParams({
          apiKey: this.apiKey,
          regions: regions.join(','),
          markets: markets.join(','),
          oddsFormat: 'decimal'
        });

        const response = await fetch(
          `${this.baseUrl}/sports/${sportKey}/odds?${params}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Odds API: Usou ${response.headers.get('X-API-Credits-Used') || '?'} créditos`);
          return this.mapOddsResponse(data);
        }
      }
    } catch (error) {
      console.warn('The Odds API não disponível:', error);
    }

    // Fallback: dados mock para demonstração
    return this.getMockOdds(sport);
  }

  // Buscar odds de Futebol Brasileiro
  async getBrazilianFootball(): Promise<ParsedOdds[]> {
    try {
      if (this.apiKey) {
        const params = new URLSearchParams({
          apiKey: this.apiKey,
          regions: 'eu',
          markets: 'h2h',
          oddsFormat: 'decimal'
        });

        const response = await fetch(
          `${this.baseUrl}/sports/soccer_brazil_serie_a/odds?${params}`
        );

        if (response.ok) {
          const data = await response.json();
          return this.mapOddsResponse(data);
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar futebol brasileiro:', error);
    }

    // Fallback
    return this.getMockOdds('soccer').filter(
      (o) => o.league.includes('Brasileirão') || o.league.includes('Copa')
    );
  }

  // Buscar odds de múltiplas casas
  async getOddsMultipleBookmakers(
    eventId: string,
    sport: string
  ): Promise<Record<string, number>> {
    try {
      if (this.apiKey) {
        const params = new URLSearchParams({
          apiKey: this.apiKey,
          regions: 'us,uk,eu',
          markets: 'h2h',
          oddsFormat: 'decimal'
        });

        const response = await fetch(
          `${this.baseUrl}/sports/${sport}/events/${eventId}/odds?${params}`
        );

        if (response.ok) {
          const data = await response.json();

          // Mapear odds de cada bookmaker
          const result: Record<string, number> = {};

          for (const bookmaker of data.bookmakers || []) {
            const h2h = bookmaker.markets?.find((m: any) => m.key === 'h2h');
            if (h2h) {
              for (const outcome of h2h.outcomes || []) {
                const key = `${bookmaker.title}_${outcome.name}`;
                result[key] = outcome.price;
              }
            }
          }

          return result;
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar odds múltiplas:', error);
    }

    return {};
  }

  // Mapear resposta da API para formato interno
  private mapOddsResponse(data: any[]): ParsedOdds[] {
    return data.map((event: any) => {
      const bookmaker = event.bookmakers?.[0];
      const h2h = bookmaker?.markets?.find((m: any) => m.key === 'h2h');

      const homeOutcome = h2h?.outcomes?.find((o: any) =>
        o.name === event.home_team || o.name === 'Home'
      );
      const drawOutcome = h2h?.outcomes?.find((o: any) =>
        o.name === 'Draw'
      );
      const awayOutcome = h2h?.outcomes?.find((o: any) =>
        o.name === event.away_team || o.name === 'Away'
      );

      return {
        id: event.id,
        sport: event.sport_key,
        league: event.sport_title,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        startTime: new Date(event.commence_time).getTime(),
        homeOdds: homeOutcome?.price || 0,
        drawOdds: drawOutcome?.price || 0,
        awayOdds: awayOutcome?.price || 0,
        bookmaker: bookmaker?.title || 'Unknown',
        lastUpdate: Date.now(),
      };
    }).filter((o) => o.homeOdds > 0 && o.startTime > Date.now()); // Filtrar eventos sem odds ou já iniciados
  }

  // Dados mock para quando API não está disponível
  private getMockOdds(sport: string): ParsedOdds[] {
    const now = Date.now();
    const hour = 3600000;

    const mockData: Record<string, ParsedOdds[]> = {
      soccer: [
        {
          id: '1',
          sport: 'soccer',
          league: 'Brasileirão Série A',
          homeTeam: 'Flamengo',
          awayTeam: 'Palmeiras',
          startTime: now + hour * 24, // Amanhã
          homeOdds: 2.15,
          drawOdds: 3.40,
          awayOdds: 3.20,
          bookmaker: 'Bet365',
          lastUpdate: now,
        },
        {
          id: '2',
          sport: 'soccer',
          league: 'Premier League',
          homeTeam: 'Arsenal',
          awayTeam: 'Liverpool',
          startTime: now + hour * 26,
          homeOdds: 2.60,
          drawOdds: 3.50,
          awayOdds: 2.50,
          bookmaker: 'Betano',
          lastUpdate: now,
        },
        {
          id: '3',
          sport: 'soccer',
          league: 'La Liga',
          homeTeam: 'Real Madrid',
          awayTeam: 'Barcelona',
          startTime: now + hour * 48,
          homeOdds: 2.20,
          drawOdds: 3.60,
          awayOdds: 2.90,
          bookmaker: 'Bet365',
          lastUpdate: now,
        },
        {
          id: '4',
          sport: 'soccer',
          league: 'Brasileirão Série A',
          homeTeam: 'Corinthians',
          awayTeam: 'São Paulo',
          startTime: now + hour * 50,
          homeOdds: 2.80,
          drawOdds: 3.20,
          awayOdds: 2.50,
          bookmaker: 'Betano',
          lastUpdate: now,
        },
      ],
      basketball: [
        {
          id: '5',
          sport: 'basketball',
          league: 'NBA',
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
          startTime: now + hour * 3,
          homeOdds: 1.85,
          drawOdds: 0,
          awayOdds: 1.95,
          bookmaker: 'Stake',
          lastUpdate: now,
        },
        {
          id: '6',
          sport: 'basketball',
          league: 'NBA',
          homeTeam: 'Warriors',
          awayTeam: 'Bulls',
          startTime: now + hour * 5,
          homeOdds: 1.70,
          drawOdds: 0,
          awayOdds: 2.10,
          bookmaker: 'Bet365',
          lastUpdate: now,
        },
      ],
      tennis: [
        {
          id: '7',
          sport: 'tennis',
          league: 'ATP',
          homeTeam: 'Nadal',
          awayTeam: 'Djokovic',
          startTime: now + hour * 5,
          homeOdds: 2.80,
          drawOdds: 0,
          awayOdds: 1.50,
          bookmaker: 'Bet365',
          lastUpdate: now,
        },
      ],
      mma: [
        {
          id: '8',
          sport: 'mma',
          league: 'UFC',
          homeTeam: 'Charles Oliveira',
          awayTeam: 'Islam Makhachev',
          startTime: now + hour * 24,
          homeOdds: 2.40,
          drawOdds: 0,
          awayOdds: 1.60,
          bookmaker: 'Bet365',
          lastUpdate: now,
        },
      ],
    };

    return mockData[sport] || [];
  }

  // Verificar Credits disponíveis na API
  async getCredits(): Promise<number> {
    try {
      if (this.apiKey) {
        const response = await fetch(
          `${this.baseUrl}/sports?apiKey=${this.apiKey}`
        );
        const credits = response.headers.get('X-API-Credits-Remaining');
        return parseInt(credits || '0', 10);
      }
    } catch (error) {
      console.error('Erro ao verificar credits:', error);
    }
    return 0;
  }
}

// Criar instância com API key do ambiente
export const oddsAPI = new OddsAPI(import.meta.env.VITE_ODDS_API_KEY || '');

// Funções utilitárias
export function formatOdds(odds: number): string {
  return odds > 0 ? odds.toFixed(2) : '-';
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBestOdds(home: number, draw: number, away: number): { value: number; type: string } {
  const max = Math.max(home, draw, away);
  if (max === home) return { value: home, type: 'home' };
  if (max === draw && draw > 0) return { value: draw, type: 'draw' };
  return { value: away, type: 'away' };
}

export function calculateParlay(odds: number[]): number {
  return odds.reduce((acc, odd) => acc * odd, 1);
}

export function calculateProfit(stake: number, odds: number, won: boolean): number {
  return won ? stake * (odds - 1) : -stake;
}
