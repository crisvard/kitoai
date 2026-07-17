// Odds API Service - The Odds API Integration
// Documentação: https://the-odds-api.com/

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

export interface Sport {
  key: string;
  group: string;
  title: string;
}

export interface ParsedOdds {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number; // timestamp em milliseconds
  startTimeISO: string; // ISO string para display
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  bookmaker: string;
  lastUpdate: number;
  isLive: boolean;
}

// Mapeamento de esportes - PRIORIDADE PARA BRASILEIRÃO
const SPORT_KEYS: Record<string, string> = {
  'soccer': 'soccer_brazil_campeonato',  // Brasileirão como padrão
  'basketball': 'basketball_nba',
  'tennis': 'tennis_atp',
  'mma': 'mma_mma',
};

class OddsAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = 'b6106a8518bcac0b60493d71a9fa8830';
    this.baseUrl = ODDS_API_BASE;
  }

  // Buscar odds de um esporte específico
  async getOdds(
    sport: string, 
    regions: string[] = ['us', 'uk', 'eu'],
    markets: string[] = ['h2h']
  ): Promise<ParsedOdds[]> {
    const sportKey = SPORT_KEYS[sport] || sport;
    
    console.log(`🔍 Buscando odds para: ${sportKey}`);
    
    try {
      if (this.apiKey) {
        const params = new URLSearchParams({
          apiKey: this.apiKey,
          regions: regions.join(','),
          markets: markets.join(','),
          oddsFormat: 'decimal'
        });

        const url = `${this.baseUrl}/sports/${sportKey}/odds?${params}`;
        console.log(`🌐 URL: ${url}`);

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Dados recebidos: ${data.length} eventos`);
          console.log(`📊 Créditos usados: ${response.headers.get('X-API-Credits-Used') || '?'}`);
          
          if (data.length > 0) {
            return this.mapOddsResponse(data, sport);
          }
        } else {
          console.error(`❌ Erro na API: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar odds:', error);
    }

    console.warn('⚠️ API não retornou dados, retornando array vazio');
    return [];
  }

  // Mapear resposta da API para formato interno
  private mapOddsResponse(data: any[], sport: string): ParsedOdds[] {
    const now = Date.now();
    
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

      const startTimeMs = new Date(event.commence_time).getTime();
      // Juego es "live" si commence_time es hace menos de 2 horas o ya pasó pero hace menos de 2 horas
      const isLive = Math.abs(startTimeMs - now) < 2 * 60 * 60 * 1000 && startTimeMs > now - 2 * 60 * 60 * 1000;

      return {
        id: event.id,
        sport: event.sport_key,
        league: event.sport_title,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        startTime: startTimeMs,
        startTimeISO: event.commence_time,
        homeOdds: homeOutcome?.price || 0,
        drawOdds: drawOutcome?.price || 0,
        awayOdds: awayOutcome?.price || 0,
        bookmaker: bookmaker?.title || 'Unknown',
        lastUpdate: Date.now(),
        isLive: isLive
      };
    }).filter((o) => o.homeOdds > 0);
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

// Exportar instância
export const oddsAPI = new OddsAPI();

// Funções utilitárias
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
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
