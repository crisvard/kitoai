/**
 * Scraper Genérico para Casas de Apostas
 * Classe base para implementação de scrapers específicos
 */

import { BookmakerEvent, BookmakerMarket, BookmakerSelection } from '../types/bookmaker';

export interface ScraperConfig {
    name: string;
    baseUrl: string;
    userAgent: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
}

export abstract class BaseBookmakerScraper {
    protected config: ScraperConfig;
    protected browser: any = null;
    protected page: any = null;

    constructor(config: ScraperConfig) {
        this.config = config;
    }

    /**
     * Inicializa o scraper
     */
    abstract initialize(): Promise<void>;

    /**
     * Busca odds ao vivo
     */
    abstract getLiveOdds(): Promise<BookmakerEvent[]>;

    /**
     * Busca odds futuras
     */
    abstract getUpcomingOdds(): Promise<BookmakerEvent[]>;

    /**
     * Busca odds de um evento específico
     */
    abstract getEventOdds(eventId: string): Promise<BookmakerMarket[]>;

    /**
     * Fecha o scraper
     */
    abstract close(): Promise<void>;

    /**
     * Extrai odds de um elemento HTML
     */
    protected async extractOdds(element: any): Promise<{ home: number; draw: number; away: number }> {
        // Implementação genérica - sobrescrever em classes filhas
        return {
            home: 0,
            draw: 0,
            away: 0,
        };
    }

    /**
     * Extrai informações de um evento
     */
    protected async extractEventInfo(element: any): Promise<Partial<BookmakerEvent>> {
        // Implementação genérica - sobrescrever em classes filhas
        return {};
    }

    /**
     * Normaliza nome de time
     */
    protected normalizeTeamName(name: string): string {
        return name
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .toUpperCase();
    }

    /**
     * Normaliza odds
     */
    protected normalizeOdds(odds: string | number): number {
        if (typeof odds === 'number') return odds;
        return parseFloat(odds.replace(',', '.')) || 0;
    }

    /**
     * Formata data
     */
    protected formatDate(date: Date): string {
        return date.toISOString();
    }

    /**
     * Verifica se um evento está ao vivo
     */
    protected isLive(startTime: string): boolean {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        return diff >= 0 && diff <= 90 * 60 * 1000; // 90 minutos
    }

    /**
     * Gera ID único para evento
     */
    protected generateEventId(homeTeam: string, awayTeam: string, startTime: string): string {
        const normalizedHome = this.normalizeTeamName(homeTeam);
        const normalizedAway = this.normalizeTeamName(awayTeam);
        const date = new Date(startTime).toISOString().split('T')[0];
        return `${normalizedHome}-${normalizedAway}-${date}`.replace(/\s+/g, '-');
    }
}

/**
 * Scraper Mock para demonstração
 * Em produção, substituir por scrapers reais
 */
export class MockBookmakerScraper extends BaseBookmakerScraper {
    private mockEvents: BookmakerEvent[] = [];

    constructor(config: ScraperConfig) {
        super(config);
        this.generateMockEvents();
    }

    private generateMockEvents() {
        const teams = [
            { home: 'Flamengo', away: 'Palmeiras' },
            { home: 'Corinthians', away: 'São Paulo' },
            { home: 'Grêmio', away: 'Internacional' },
            { home: 'Atlético-MG', away: 'Cruzeiro' },
            { home: 'Vasco', away: 'Botafogo' },
            { home: 'Fluminense', away: 'Santos' },
        ];

        const leagues = [
            'Brasileirão Série A',
            'Copa do Brasil',
            'Libertadores',
            'Sul-Americana',
        ];

        teams.forEach((match, index) => {
            const startTime = new Date(Date.now() + (index + 1) * 3600000);
            const isLive = index === 0;

            this.mockEvents.push({
                id: this.generateEventId(match.home, match.away, startTime.toISOString()),
                bookmaker: this.config.name,
                homeTeam: match.home,
                awayTeam: match.away,
                league: leagues[index % leagues.length],
                sport: 'Futebol',
                startTime: startTime.toISOString(),
                status: isLive ? 'live' : 'upcoming',
                odds: {
                    home: 2.0 + Math.random() * 0.5,
                    draw: 3.0 + Math.random() * 0.5,
                    away: 2.5 + Math.random() * 0.5,
                },
                markets: [],
                lastUpdated: new Date().toISOString(),
            });
        });
    }

    async initialize(): Promise<void> {
        console.log(`[${this.config.name}] Scraper inicializado`);
    }

    async getLiveOdds(): Promise<BookmakerEvent[]> {
        return this.mockEvents.filter(e => e.status === 'live');
    }

    async getUpcomingOdds(): Promise<BookmakerEvent[]> {
        return this.mockEvents.filter(e => e.status === 'upcoming');
    }

    async getEventOdds(eventId: string): Promise<BookmakerMarket[]> {
        const event = this.mockEvents.find(e => e.id === eventId);
        if (!event) return [];

        return [
            {
                id: '1x2',
                name: 'Resultado Final',
                selections: [
                    { id: 'home', name: event.homeTeam, odds: event.odds.home, available: true },
                    { id: 'draw', name: 'Empate', odds: event.odds.draw, available: true },
                    { id: 'away', name: event.awayTeam, odds: event.odds.away, available: true },
                ],
            },
            {
                id: 'over-under',
                name: 'Over/Under 2.5',
                selections: [
                    { id: 'over', name: 'Over 2.5', odds: 1.85, available: true },
                    { id: 'under', name: 'Under 2.5', odds: 1.95, available: true },
                ],
            },
            {
                id: 'both-teams-score',
                name: 'Ambas Marcam',
                selections: [
                    { id: 'yes', name: 'Sim', odds: 1.75, available: true },
                    { id: 'no', name: 'Não', odds: 2.05, available: true },
                ],
            },
        ];
    }

    async close(): Promise<void> {
        console.log(`[${this.config.name}] Scraper fechado`);
    }
}

/**
 * Factory para criar scrapers
 */
export class ScraperFactory {
    private static scrapers: Map<string, BaseBookmakerScraper> = new Map();

    static createScraper(bookmaker: string): BaseBookmakerScraper {
        if (this.scrapers.has(bookmaker)) {
            return this.scrapers.get(bookmaker)!;
        }

        const config: ScraperConfig = {
            name: bookmaker,
            baseUrl: '',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timeout: 30000,
            maxRetries: 3,
            retryDelay: 1000,
        };

        // Por enquanto, usar mock para todos
        // Em produção, criar scrapers específicos para cada casa
        const scraper = new MockBookmakerScraper(config);
        this.scrapers.set(bookmaker, scraper);

        return scraper;
    }

    static getScraper(bookmaker: string): BaseBookmakerScraper | undefined {
        return this.scrapers.get(bookmaker);
    }

    static async closeAll(): Promise<void> {
        for (const scraper of this.scrapers.values()) {
            await scraper.close();
        }
        this.scrapers.clear();
    }
}
