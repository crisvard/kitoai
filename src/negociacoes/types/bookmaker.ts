/**
 * Tipos para o Sistema de Espelhamento de Casas de Apostas
 */

export interface BookmakerEvent {
    id: string;
    bookmaker: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    startTime: string;
    status: 'live' | 'upcoming' | 'finished';
    odds: {
        home: number;
        draw: number;
        away: number;
    };
    markets: BookmakerMarket[];
    lastUpdated: string;
}

export interface BookmakerMarket {
    id: string;
    name: string;
    selections: BookmakerSelection[];
}

export interface BookmakerSelection {
    id: string;
    name: string;
    odds: number;
    available: boolean;
}

export interface BookmakerConfig {
    name: string;
    url: string;
    scraper: string;
    enabled: boolean;
    updateInterval: number; // em segundos
    maxRetries: number;
    difficulty: 'low' | 'medium' | 'high';
    features: string[];
}

export interface OddsComparison {
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    startTime: string;
    bookmakers: {
        name: string;
        homeOdds: number;
        drawOdds: number;
        awayOdds: number;
        lastUpdated: string;
    }[];
    bestOdds: {
        home: { bookmaker: string; odds: number };
        draw: { bookmaker: string; odds: number };
        away: { bookmaker: string; odds: number };
    };
}

export interface ScraperStatus {
    name: string;
    status: 'active' | 'inactive' | 'error';
    lastRun: string;
    eventsScraped: number;
    errors: number;
    errorMessage?: string;
}

export interface BookmakerStats {
    totalEvents: number;
    liveEvents: number;
    upcomingEvents: number;
    totalBookmakers: number;
    activeBookmakers: number;
    lastUpdate: string;
}
