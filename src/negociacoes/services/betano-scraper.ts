/**
 * Serviço de Web Scraping para Betano
 * Extrai dados reais de jogos, odds e mercados do site da Betano
 *
 * NOTA: Este serviço utiliza técnicas de scraping que podem ser afetadas
 * por mudanças na estrutura do site da Betano.
 */

export interface BetanoMatch {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    startTime: string;
    isLive: boolean;
    minute?: number;
    score?: string;
    markets: BetanoMarket[];
}

export interface BetanoMarket {
    id: string;
    name: string;
    selections: BetanoSelection[];
}

export interface BetanoSelection {
    id: string;
    name: string;
    odds: number;
}

export interface BetanoScrapingResult {
    success: boolean;
    matches: BetanoMatch[];
    error?: string;
    timestamp: string;
}

/**
 * Classe principal para scraping da Betano
 */
export class BetanoScraper {
    private proxyServer: string;
    private baseUrl: string;

    constructor() {
        // Usando servidor proxy local para contornar CORS
        this.proxyServer = 'http://localhost:3001';
        this.baseUrl = 'https://www.betano.bet.br';
    }

    /**
     * Busca jogos de futebol ao vivo e pré-jogo
     */
    async fetchFootballMatches(): Promise<BetanoScrapingResult> {
        try {
            // URLs da Betano para diferentes tipos de jogos
            const urls = {
                live: `${this.baseUrl}/sport/futebol/ao-vivo/`,
                upcoming: `${this.baseUrl}/sport/futebol/`,
            };

            const matches: BetanoMatch[] = [];

            // Buscar jogos ao vivo
            const liveMatches = await this.scrapeMatches(urls.live, true);
            matches.push(...liveMatches);

            // Buscar jogos futuros
            const upcomingMatches = await this.scrapeMatches(urls.upcoming, false);
            matches.push(...upcomingMatches);

            return {
                success: true,
                matches,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                matches: [],
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Faz scraping dos jogos de uma URL específica
     */
    private async scrapeMatches(url: string, isLive: boolean): Promise<BetanoMatch[]> {
        try {
            // Fazer requisição via servidor proxy local
            const response = await fetch(`${this.proxyServer}/api/betano/football?live=${isLive}`);
            const html = await response.text();

            // Parsear o HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const matches: BetanoMatch[] = [];

            // Selecionar elementos de jogos (ajustar seletores conforme estrutura do site)
            const eventElements = doc.querySelectorAll('[data-testid="event-card"], .event-card, [class*="event"]');

            eventElements.forEach((element, index) => {
                try {
                    const match = this.parseMatchElement(element, isLive, index);
                    if (match) {
                        matches.push(match);
                    }
                } catch (e) {
                    console.warn('Erro ao parsear elemento de jogo:', e);
                }
            });

            return matches;
        } catch (error) {
            console.error('Erro ao fazer scraping:', error);
            return [];
        }
    }

    /**
     * Parseia um elemento de jogo do HTML
     */
    private parseMatchElement(element: Element, isLive: boolean, index: number): BetanoMatch | null {
        try {
            // Extrair nomes dos times
            const teamElements = element.querySelectorAll('[class*="team"], [class*="participant"]');
            if (teamElements.length < 2) return null;

            const homeTeam = teamElements[0]?.textContent?.trim() || `Time Casa ${index}`;
            const awayTeam = teamElements[1]?.textContent?.trim() || `Time Fora ${index}`;

            // Extrair liga
            const leagueElement = element.querySelector('[class*="league"], [class*="tournament"], [class*="competition"]');
            const league = leagueElement?.textContent?.trim() || 'Liga Desconhecida';

            // Extrair placar se ao vivo
            let score: string | undefined;
            let minute: number | undefined;

            if (isLive) {
                const scoreElement = element.querySelector('[class*="score"], [class*="result"]');
                score = scoreElement?.textContent?.trim() || undefined;

                const minuteElement = element.querySelector('[class*="minute"], [class*="time"], [class*="clock"]');
                if (minuteElement) {
                    const minuteText = minuteElement.textContent?.trim() || '';
                    const minuteMatch = minuteText.match(/(\d+)/);
                    minute = minuteMatch ? parseInt(minuteMatch[1]) : undefined;
                }
            }

            // Extrair horário
            const timeElement = element.querySelector('[class*="time"], [class*="date"], [class*="start"]');
            const startTime = timeElement?.textContent?.trim() || new Date().toISOString();

            // Extrair mercados e odds
            const markets = this.parseMarkets(element);

            return {
                id: `betano-${Date.now()}-${index}`,
                homeTeam,
                awayTeam,
                league,
                sport: 'Futebol',
                startTime,
                isLive,
                minute,
                score,
                markets,
            };
        } catch (error) {
            console.error('Erro ao parsear elemento de jogo:', error);
            return null;
        }
    }

    /**
     * Parseia mercados e odds de um elemento
     */
    private parseMarkets(element: Element): BetanoMarket[] {
        const markets: BetanoMarket[] = [];

        try {
            // Mercado 1X2 (Resultado Final)
            const oddsElements = element.querySelectorAll('[class*="odds"], [class*="price"], [class*="odd"]');

            if (oddsElements.length >= 3) {
                const homeOdds = this.parseOdds(oddsElements[0]?.textContent || '0');
                const drawOdds = this.parseOdds(oddsElements[1]?.textContent || '0');
                const awayOdds = this.parseOdds(oddsElements[2]?.textContent || '0');

                markets.push({
                    id: '1x2',
                    name: 'Resultado Final',
                    selections: [
                        { id: 'home', name: 'Casa', odds: homeOdds },
                        { id: 'draw', name: 'Empate', odds: drawOdds },
                        { id: 'away', name: 'Fora', odds: awayOdds },
                    ],
                });
            }

            // Mercado Over/Under
            const overUnderElements = element.querySelectorAll('[class*="over"], [class*="under"], [class*="total"]');
            if (overUnderElements.length >= 2) {
                const overOdds = this.parseOdds(overUnderElements[0]?.textContent || '0');
                const underOdds = this.parseOdds(overUnderElements[1]?.textContent || '0');

                markets.push({
                    id: 'over-under-25',
                    name: 'Over/Under 2.5',
                    selections: [
                        { id: 'over', name: 'Mais de 2.5', odds: overOdds },
                        { id: 'under', name: 'Menos de 2.5', odds: underOdds },
                    ],
                });
            }

            // Mercado Ambas Marcam
            const bttsElements = element.querySelectorAll('[class*="btts"], [class*="both"], [class*="gg"]');
            if (bttsElements.length >= 2) {
                const yesOdds = this.parseOdds(bttsElements[0]?.textContent || '0');
                const noOdds = this.parseOdds(bttsElements[1]?.textContent || '0');

                markets.push({
                    id: 'both-teams-score',
                    name: 'Ambas Marcam',
                    selections: [
                        { id: 'yes', name: 'Sim', odds: yesOdds },
                        { id: 'no', name: 'Não', odds: noOdds },
                    ],
                });
            }
        } catch (error) {
            console.error('Erro ao parsear mercados:', error);
        }

        return markets;
    }

    /**
     * Converte texto de odds para número
     */
    private parseOdds(text: string): number {
        try {
            // Remove caracteres não numéricos exceto ponto e vírgula
            const cleaned = text.replace(/[^\d.,]/g, '');
            // Substitui vírgula por ponto
            const normalized = cleaned.replace(',', '.');
            const odds = parseFloat(normalized);
            return isNaN(odds) ? 1.5 : odds;
        } catch {
            return 1.5;
        }
    }

    /**
     * Busca odds de um jogo específico
     */
    async fetchMatchOdds(matchId: string): Promise<BetanoMarket[]> {
        try {
            // URL do jogo específico
            const url = `${this.baseUrl}/event/${matchId}`;
            const response = await fetch(`${this.proxyServer}/api/betano/football?matchId=${matchId}`);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const markets: BetanoMarket[] = [];

            // Parsear todos os mercados disponíveis
            const marketElements = doc.querySelectorAll('[class*="market"], [class*="bet-type"]');

            marketElements.forEach((marketEl, index) => {
                try {
                    const marketName = marketEl.querySelector('[class*="market-name"], [class*="title"]')?.textContent?.trim() || `Mercado ${index + 1}`;

                    const selectionElements = marketEl.querySelectorAll('[class*="selection"], [class*="outcome"]');
                    const selections: BetanoSelection[] = [];

                    selectionElements.forEach((selEl, selIndex) => {
                        const name = selEl.querySelector('[class*="name"], [class*="label"]')?.textContent?.trim() || `Seleção ${selIndex + 1}`;
                        const oddsText = selEl.querySelector('[class*="odds"], [class*="price"]')?.textContent || '0';
                        const odds = this.parseOdds(oddsText);

                        selections.push({
                            id: `sel-${index}-${selIndex}`,
                            name,
                            odds,
                        });
                    });

                    if (selections.length > 0) {
                        markets.push({
                            id: `market-${index}`,
                            name: marketName,
                            selections,
                        });
                    }
                } catch (e) {
                    console.warn('Erro ao parsear mercado:', e);
                }
            });

            return markets;
        } catch (error) {
            console.error('Erro ao buscar odds do jogo:', error);
            return [];
        }
    }

    /**
     * Busca jogos de um esporte específico
     */
    async fetchSportMatches(sport: string): Promise<BetanoScrapingResult> {
        try {
            const sportUrls: Record<string, string> = {
                futebol: `${this.baseUrl}/sport/futebol/`,
                basquete: `${this.baseUrl}/sport/basquete/`,
                tenis: `${this.baseUrl}/sport/tenis/`,
                volei: `${this.baseUrl}/sport/volei/`,
                mma: `${this.baseUrl}/sport/mma/`,
            };

            const url = sportUrls[sport.toLowerCase()] || sportUrls.futebol;
            const matches = await this.scrapeMatches(url, false);

            return {
                success: true,
                matches,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                matches: [],
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                timestamp: new Date().toISOString(),
            };
        }
    }
}

// Instância singleton
export const betanoScraper = new BetanoScraper();
