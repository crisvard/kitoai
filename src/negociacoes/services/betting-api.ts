// API de Apostas Esportivas
// Integração com Odds API e APIs de casas de aposta

export interface Odds {
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

export interface Bet {
  id: string;
  oddsId: string;
  selection: 'home' | 'draw' | 'away';
  odds: number;
  stake: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: number;
  settledAt?: number;
  result?: 'home' | 'draw' | 'away';
}

export interface BettingStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  profit: number;
  roi: number;
  winRate: number;
}

// API de Odds - integração com TheRundown ou similares
class BettingAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
    // Usando API pública de odds (ou mock)
    this.baseUrl = 'https://api.the-odds-api.com/v4';
  }

  // Obter esportes disponíveis
  async getSports(): Promise<string[]> {
    // Lista de esportes suportados
    return [
      'soccer',
      'basketball',
      'american_football',
      'tennis',
      'ice_hockey',
      'baseball',
      'mma',
      'boxing',
      'golf',
      'motor_racing',
    ];
  }

  // Obter odds de um esporte
  async getOdds(sport: string, regions: string[] = ['us', 'uk', 'eu']): Promise<Odds[]> {
    try {
      // Tenta usar API real
      if (this.apiKey) {
        const response = await fetch(
          `${this.baseUrl}/sports/${sport}/odds?apiKey=${this.apiKey}&regions=${regions.join(',')}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return this.mapOdds(data);
        }
      }
    } catch (error) {
      console.warn('API de odds não disponível, retornando dados mock');
    }
    
    // Retorna dados mock para demonstração
    return this.getMockOdds(sport);
  }

  // Mapear dados da API
  private mapOdds(data: any[]): Odds[] {
    return data.map((event: any) => ({
      id: event.id,
      sport: event.sport_key,
      league: event.sport_title,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      startTime: event.commence_time,
      homeOdds: event.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || 0,
      drawOdds: event.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === 'Draw')?.price || 0,
      awayOdds: event.bookmakers?.[0]?.markets?.[0]?.outcomes?.[1]?.price || 0,
      bookmaker: event.bookmakers?.[0]?.title || 'Unknown',
      lastUpdate: Date.now(),
    }));
  }

  // Dados mock para demonstração
  private getMockOdds(sport: string): Odds[] {
    const now = Date.now();
    const hour = 3600000;

    const mockData: Record<string, Odds[]> = {
      soccer: [
        {
          id: '1',
          sport: 'soccer',
          league: 'Brasileirão Série A',
          homeTeam: 'Flamengo',
          awayTeam: 'Palmeiras',
          startTime: now + hour * 2,
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
          startTime: now + hour * 4,
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
          startTime: now + hour * 6,
          homeOdds: 2.20,
          drawOdds: 3.60,
          awayOdds: 2.90,
          bookmaker: 'Bet365',
          lastUpdate: now,
        },
      ],
      basketball: [
        {
          id: '4',
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
      ],
      tennis: [
        {
          id: '5',
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
    };

    return mockData[sport] || [];
  }

  // Obter odds de futebol brasileiro
  async getBrazilianFootball(): Promise<Odds[]> {
    return this.getMockOdds('soccer').filter(
      (o) => o.league.includes('Brasileirão') || o.league.includes('Copa')
    );
  }

  // Obter odds de jogos ao vivo
  async getLiveOdds(): Promise<Odds[]> {
    // Filtrar odds com menos de 30 minutos
    const now = Date.now();
    const allOdds = await this.getOdds('soccer');
    return allOdds.filter((o) => now < o.startTime && o.startTime - now < 1800000);
  }
}

// Gerenciador de Apostas
class BetManager {
  private bets: Map<string, Bet> = new Map();
  private onUpdate?: () => void;

  constructor(onUpdate?: () => void) {
    this.onUpdate = onUpdate;
  }

  // Criar uma nova aposta
  placeBet(oddsId: string, selection: 'home' | 'draw' | 'away', odds: number, stake: number): Bet {
    const bet: Bet = {
      id: `bet_${Date.now()}`,
      oddsId,
      selection,
      odds,
      stake,
      potentialWin: stake * odds,
      status: 'pending',
      placedAt: Date.now(),
    };

    this.bets.set(bet.id, bet);
    this.onUpdate?.();
    
    return bet;
  }

  // Cancelar uma aposta
  cancelBet(betId: string): boolean {
    const bet = this.bets.get(betId);
    if (bet && bet.status === 'pending') {
      bet.status = 'cancelled';
      this.onUpdate?.();
      return true;
    }
    return false;
  }

  // Settle de uma aposta (simulado)
  settleBet(betId: string, result: 'home' | 'draw' | 'away'): boolean {
    const bet = this.bets.get(betId);
    if (bet && bet.status === 'pending') {
      bet.status = bet.selection === result ? 'won' : 'lost';
      bet.result = result;
      bet.settledAt = Date.now();
      this.onUpdate?.();
      return true;
    }
    return false;
  }

  // Obter todas as apostas
  getBets(): Bet[] {
    return Array.from(this.bets.values());
  }

  // Obter estatísticas
  getStats(): BettingStats {
    const bets = this.getBets();
    const settled = bets.filter((b) => b.status !== 'pending');
    const won = settled.filter((b) => b.status === 'won');
    const lost = settled.filter((b) => b.status === 'lost');
    const pending = bets.filter((b) => b.status === 'pending');

    const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
    const totalWon = won.reduce((sum, b) => b.potentialWin, 0);
    const totalLost = lost.reduce((sum, b) => b.stake, 0);
    const profit = totalWon - totalLost;

    return {
      totalBets: bets.length,
      wonBets: won.length,
      lostBets: lost.length,
      pendingBets: pending.length,
      totalStaked,
      totalWon,
      totalLost,
      profit,
      roi: totalStaked > 0 ? (profit / totalStaked) * 100 : 0,
      winRate: settled.length > 0 ? (won.length / settled.length) * 100 : 0,
    };
  }

  // Carregar apuestas do localStorage
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('bets');
      if (stored) {
        const data = JSON.parse(stored);
        this.bets = new Map(Object.entries(data));
      }
    } catch (e) {
      console.error('Erro ao carregar apuestas:', e);
    }
  }

  // Salvar apuestas no localStorage
  saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.bets);
      localStorage.setItem('bets', JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar apuestas:', e);
    }
  }
}

// Exportar instâncias
export const bettingAPI = new BettingAPI();
export const createBetManager = (onUpdate?: () => void) => new BetManager(onUpdate);

// Funções utilitárias
export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function calculateProfit(stake: number, odds: number, won: boolean): number {
  return won ? stake * (odds - 1) : -stake;
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

export function getStatusColor(status: Bet['status']): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-400';
    case 'won':
      return 'text-green-400';
    case 'lost':
      return 'text-red-400';
    case 'cancelled':
      return 'text-gray-400';
    default:
      return 'text-white';
  }
}
