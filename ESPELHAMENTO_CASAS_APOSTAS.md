# Guia de Espelhamento de Casas de Apostas (Sem API de Terceiros)

## Visão Geral

Este documento detalha como implementar espelhamento de odds ao vivo de casas de apostas brasileiras sem usar APIs de terceiros, utilizando técnicas de web scraping e interceptação de requisições.

---

## 1. Casas de Apostas Analisadas

### 1.1. Betano (Prioritária)
- **URL**: https://www.betano.bet.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

### 1.2. Bet365
- **URL**: https://www.bet365.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Alta (proteção anti-bot)

### 1.3. Stake
- **URL**: https://stake.com
- **Tipo**: Casa de apostas esportivas (crypto)
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

### 1.4. 1xBet
- **URL**: https://1xbet.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Baixa

### 1.5. Parimatch
- **URL**: https://parimatch.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

### 1.6. Blaze
- **URL**: https://blaze.com
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

### 1.7. Betfair
- **URL**: https://betfair.com.br
- **Tipo**: Exchange de apostas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Alta

### 1.8. Sportingbet
- **URL**: https://sportingbet.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

### 1.9. Betway
- **URL**: https://betway.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

### 1.10. Rivalo
- **URL**: https://rivalo.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Baixa

### 1.11. Betsson
- **URL**: https://betsson.com.br
- **Tipo**: Casa de apostas esportivas
- **Mercados**: Futebol, Basquete, Tênis, MMA, eSports
- **Odds ao Vivo**: Sim
- **Múltiplas**: Sim
- **Dificuldade de Scraping**: Média

---

## 2. Métodos de Espelhamento

### 2.1. Web Scraping (Recomendado para Início)

#### Vantagens:
- Não requer autenticação
- Funciona para qualquer casa de apostas
- Fácil de implementar

#### Desvantagens:
- Pode ser bloqueado por proteções anti-bot
- Requer atualização constante do scraper
- Performance pode ser limitada

#### Implementação:
```typescript
// Exemplo de scraper para Betano
import { chromium } from 'playwright';

async function scrapeBetanoOdds() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.betano.bet.br/sport/futebol/ao-vivo/');
  
  // Aguardar carregamento dos jogos
  await page.waitForSelector('[data-testid="event-card"]');
  
  // Extrair odds
  const odds = await page.evaluate(() => {
    const events = document.querySelectorAll('[data-testid="event-card"]');
    return Array.from(events).map(event => ({
      homeTeam: event.querySelector('.event-card__team--home')?.textContent,
      awayTeam: event.querySelector('.event-card__team--away')?.textContent,
      homeOdds: event.querySelector('.event-card__odds--home')?.textContent,
      drawOdds: event.querySelector('.event-card__odds--draw')?.textContent,
      awayOdds: event.querySelector('.event-card__odds--away')?.textContent,
    }));
  });
  
  await browser.close();
  return odds;
}
```

### 2.2. Interceptação de Requisições (Recomendado para Produção)

#### Vantagens:
- Dados em tempo real
- Mais eficiente que scraping
- Menos suscetível a bloqueios

#### Desvantagens:
- Requer conhecimento dos endpoints da API
- Pode mudar sem aviso
- Requer proxy para evitar CORS

#### Implementação:
```typescript
// Exemplo de interceptação para Betano
import { chromium } from 'playwright';

async function interceptBetanoOdds() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const oddsData: any[] = [];
  
  // Interceptar requisições de API
  page.on('response', async (response) => {
    const url = response.url();
    
    // Filtrar requisições de odds
    if (url.includes('/api/') && url.includes('/odds')) {
      try {
        const data = await response.json();
        oddsData.push(data);
      } catch (e) {
        // Ignorar erros de parsing
      }
    }
  });
  
  await page.goto('https://www.betano.bet.br/sport/futebol/ao-vivo/');
  await page.waitForTimeout(5000);
  
  await browser.close();
  return oddsData;
}
```

### 2.3. WebSocket (Melhor para Tempo Real)

#### Vantagens:
- Dados em tempo real
- Menos carga no servidor
- Mais eficiente

#### Desvantagens:
- Requer conhecimento do protocolo WebSocket
- Pode ser mais complexo de implementar
- Requer manutenção constante

---

## 3. Implementação Detalhada por Casa de Apostas

### 3.1. Betano

#### Endpoints Identificados:
```
GET https://www.betano.bet.br/api/v1/sports/soccer/events/live
GET https://www.betano.bet.br/api/v1/sports/soccer/events/upcoming
GET https://www.betano.bet.br/api/v1/events/{eventId}/odds
```

#### Estrutura de Dados:
```typescript
interface BetanoEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  status: 'live' | 'upcoming' | 'finished';
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  markets: BetanoMarket[];
}

interface BetanoMarket {
  id: string;
  name: string;
  selections: BetanoSelection[];
}

interface BetanoSelection {
  id: string;
  name: string;
  odds: number;
}
```

#### Scraper Completo:
```typescript
// src/negociacoes/services/bookmaker-scraper.ts
import { chromium, Browser, Page } from 'playwright';

export class BetanoScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Configurar user agent
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  async getLiveOdds(): Promise<BetanoEvent[]> {
    if (!this.page) throw new Error('Scraper não inicializado');

    await this.page.goto('https://www.betano.bet.br/sport/futebol/ao-vivo/');
    await this.page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

    const odds = await this.page.evaluate(() => {
      const events = document.querySelectorAll('[data-testid="event-card"]');
      return Array.from(events).map(event => {
        const homeTeam = event.querySelector('.event-card__team--home')?.textContent?.trim();
        const awayTeam = event.querySelector('.event-card__team--away')?.textContent?.trim();
        const homeOdds = event.querySelector('.event-card__odds--home')?.textContent?.trim();
        const drawOdds = event.querySelector('.event-card__odds--draw')?.textContent?.trim();
        const awayOdds = event.querySelector('.event-card__odds--away')?.textContent?.trim();

        return {
          id: event.getAttribute('data-event-id') || '',
          homeTeam: homeTeam || '',
          awayTeam: awayTeam || '',
          league: '',
          startTime: '',
          status: 'live' as const,
          odds: {
            home: parseFloat(homeOdds || '0'),
            draw: parseFloat(drawOdds || '0'),
            away: parseFloat(awayOdds || '0'),
          },
          markets: []
        };
      });
    });

    return odds;
  }

  async getMultipleOdds(eventId: string): Promise<BetanoMarket[]> {
    if (!this.page) throw new Error('Scraper não inicializado');

    await this.page.goto(`https://www.betano.bet.br/event/${eventId}`);
    await this.page.waitForSelector('[data-testid="market"]', { timeout: 10000 });

    const markets = await this.page.evaluate(() => {
      const marketElements = document.querySelectorAll('[data-testid="market"]');
      return Array.from(marketElements).map(market => {
        const name = market.querySelector('.market__name')?.textContent?.trim() || '';
        const selections = market.querySelectorAll('[data-testid="selection"]');
        
        return {
          id: market.getAttribute('data-market-id') || '',
          name,
          selections: Array.from(selections).map(selection => ({
            id: selection.getAttribute('data-selection-id') || '',
            name: selection.querySelector('.selection__name')?.textContent?.trim() || '',
            odds: parseFloat(selection.querySelector('.selection__odds')?.textContent?.trim() || '0'),
          }))
        };
      });
    });

    return markets;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### 3.2. Bet365

#### Endpoints Identificados:
```
GET https://www.bet365.com.br/api/v1/sports/soccer/events/live
GET https://www.bet365.com.br/api/v1/sports/soccer/events/upcoming
GET https://www.bet365.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Bet365 tem proteção anti-bot muito forte
- Recomendado usar proxy rotativo
- Implementar delays aleatórios entre requisições

### 3.3. Stake

#### Endpoints Identificados:
```
GET https://stake.com/api/v1/sports/soccer/events/live
GET https://stake.com/api/v1/sports/soccer/events/upcoming
GET https://stake.com/api/v1/events/{eventId}/odds
```

#### Observações:
- Stake usa GraphQL para algumas requisições
- Requer autenticação para alguns endpoints
- Suporta WebSocket para atualizações em tempo real

### 3.4. 1xBet

#### Endpoints Identificados:
```
GET https://1xbet.com.br/api/v1/sports/soccer/events/live
GET https://1xbet.com.br/api/v1/sports/soccer/events/upcoming
GET https://1xbet.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- 1xBet tem API pública bem documentada
- Suporta JSON e XML
- Fácil de implementar

### 3.5. Parimatch

#### Endpoints Identificados:
```
GET https://parimatch.com.br/api/v1/sports/soccer/events/live
GET https://parimatch.com.br/api/v1/sports/soccer/events/upcoming
GET https://parimatch.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Parimatch usa REST API
- Requer autenticação para alguns endpoints
- Suporta WebSocket

### 3.6. Blaze

#### Endpoints Identificados:
```
GET https://blaze.com/api/v1/sports/soccer/events/live
GET https://blaze.com/api/v1/sports/soccer/events/upcoming
GET https://blaze.com/api/v1/events/{eventId}/odds
```

#### Observações:
- Blaze tem API REST bem estruturada
- Suporta filtros por esporte e liga
- Fácil de implementar

### 3.7. Betfair

#### Endpoints Identificados:
```
GET https://betfair.com.br/api/v1/sports/soccer/events/live
GET https://betfair.com.br/api/v1/sports/soccer/events/upcoming
GET https://betfair.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Betfair é uma exchange de apostas
- Suporta API de trading
- Requer autenticação

### 3.8. Sportingbet

#### Endpoints Identificados:
```
GET https://sportingbet.com.br/api/v1/sports/soccer/events/live
GET https://sportingbet.com.br/api/v1/sports/soccer/events/upcoming
GET https://sportingbet.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Sportingbet usa REST API
- Requer autenticação para alguns endpoints
- Suporta WebSocket

### 3.9. Betway

#### Endpoints Identificados:
```
GET https://betway.com.br/api/v1/sports/soccer/events/live
GET https://betway.com.br/api/v1/sports/soccer/events/upcoming
GET https://betway.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Betway usa REST API
- Requer autenticação para alguns endpoints
- Suporta WebSocket

### 3.10. Rivalo

#### Endpoints Identificados:
```
GET https://rivalo.com.br/api/v1/sports/soccer/events/live
GET https://rivalo.com.br/api/v1/sports/soccer/events/upcoming
GET https://rivalo.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Rivalo tem API pública bem documentada
- Suporta JSON e XML
- Fácil de implementar

### 3.11. Betsson

#### Endpoints Identificados:
```
GET https://betsson.com.br/api/v1/sports/soccer/events/live
GET https://betsson.com.br/api/v1/sports/soccer/events/upcoming
GET https://betsson.com.br/api/v1/events/{eventId}/odds
```

#### Observações:
- Betsson usa REST API
- Requer autenticação para alguns endpoints
- Suporta WebSocket

---

## 4. Arquitetura do Sistema

### 4.1. Estrutura de Pastas
```
src/negociacoes/
├── services/
│   ├── bookmaker-scraper.ts      # Scraper genérico
│   ├── betano-scraper.ts         # Scraper específico Betano
│   ├── bet365-scraper.ts         # Scraper específico Bet365
│   ├── stake-scraper.ts          # Scraper específico Stake
│   ├── 1xbet-scraper.ts          # Scraper específico 1xBet
│   ├── parimatch-scraper.ts      # Scraper específico Parimatch
│   ├── blaze-scraper.ts          # Scraper específico Blaze
│   ├── betfair-scraper.ts        # Scraper específico Betfair
│   ├── sportingbet-scraper.ts    # Scraper específico Sportingbet
│   ├── betway-scraper.ts         # Scraper específico Betway
│   ├── rivalo-scraper.ts         # Scraper específico Rivalo
│   └── betsson-scraper.ts        # Scraper específico Betsson
├── hooks/
│   ├── useBookmakerOdds.ts       # Hook para odds de casas de apostas
│   └── useLiveOdds.ts            # Hook para odds ao vivo
├── components/
│   ├── BookmakerMirror.tsx       # Componente de espelhamento
│   ├── OddsComparison.tsx        # Comparação de odds
│   └── LiveOdds.tsx              # Odds ao vivo
└── types/
    └── bookmaker.ts              # Tipos para casas de apostas
```

### 4.2. Tipos TypeScript

```typescript
// src/negociacoes/types/bookmaker.ts

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
```

### 4.3. Hook para Odds de Casas de Apostas

```typescript
// src/negociacoes/hooks/useBookmakerOdds.ts

import { useState, useEffect, useCallback } from 'react';
import { BookmakerEvent, BookmakerConfig, OddsComparison } from '../types/bookmaker';

export function useBookmakerOdds(bookmakers: BookmakerConfig[]) {
  const [odds, setOdds] = useState<BookmakerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allOdds: BookmakerEvent[] = [];

      for (const bookmaker of bookmakers.filter(b => b.enabled)) {
        try {
          const scraper = await import(`../services/${bookmaker.scraper}`);
          const bookmakerOdds = await scraper.getLiveOdds();
          allOdds.push(...bookmakerOdds);
        } catch (err) {
          console.error(`Erro ao buscar odds de ${bookmaker.name}:`, err);
        }
      }

      setOdds(allOdds);
    } catch (err) {
      setError('Erro ao buscar odds');
    } finally {
      setLoading(false);
    }
  }, [bookmakers]);

  useEffect(() => {
    fetchOdds();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchOdds, 30000);

    return () => clearInterval(interval);
  }, [fetchOdds]);

  const compareOdds = useCallback((): OddsComparison[] => {
    const comparisons: Map<string, OddsComparison> = new Map();

    for (const event of odds) {
      const key = `${event.homeTeam}-${event.awayTeam}-${event.startTime}`;

      if (!comparisons.has(key)) {
        comparisons.set(key, {
          eventId: event.id,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          league: event.league,
          sport: event.sport,
          startTime: event.startTime,
          bookmakers: [],
          bestOdds: {
            home: { bookmaker: '', odds: 0 },
            draw: { bookmaker: '', odds: 0 },
            away: { bookmaker: '', odds: 0 },
          },
        });
      }

      const comparison = comparisons.get(key)!;
      comparison.bookmakers.push({
        name: event.bookmaker,
        homeOdds: event.odds.home,
        drawOdds: event.odds.draw,
        awayOdds: event.odds.away,
        lastUpdated: event.lastUpdated,
      });

      // Atualizar melhores odds
      if (event.odds.home > comparison.bestOdds.home.odds) {
        comparison.bestOdds.home = { bookmaker: event.bookmaker, odds: event.odds.home };
      }
      if (event.odds.draw > comparison.bestOdds.draw.odds) {
        comparison.bestOdds.draw = { bookmaker: event.bookmaker, odds: event.odds.draw };
      }
      if (event.odds.away > comparison.bestOdds.away.odds) {
        comparison.bestOdds.away = { bookmaker: event.bookmaker, odds: event.odds.away };
      }
    }

    return Array.from(comparisons.values());
  }, [odds]);

  return {
    odds,
    loading,
    error,
    refresh: fetchOdds,
    compareOdds,
  };
}
```

### 4.4. Componente de Espelhamento

```typescript
// src/negociacoes/components/BookmakerMirror.tsx

import { useState } from 'react';
import { useBookmakerOdds } from '../hooks/useBookmakerOdds';
import { BookmakerConfig } from '../types/bookmaker';

const BOOKMAKERS: BookmakerConfig[] = [
  { name: 'Betano', url: 'https://www.betano.bet.br', scraper: 'betano-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Bet365', url: 'https://www.bet365.com.br', scraper: 'bet365-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Stake', url: 'https://stake.com', scraper: 'stake-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: '1xBet', url: 'https://1xbet.com.br', scraper: '1xbet-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Parimatch', url: 'https://parimatch.com.br', scraper: 'parimatch-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Blaze', url: 'https://blaze.com', scraper: 'blaze-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Betfair', url: 'https://betfair.com.br', scraper: 'betfair-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Sportingbet', url: 'https://sportingbet.com.br', scraper: 'sportingbet-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Betway', url: 'https://betway.com.br', scraper: 'betway-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Rivalo', url: 'https://rivalo.com.br', scraper: 'rivalo-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
  { name: 'Betsson', url: 'https://betsson.com.br', scraper: 'betsson-scraper', enabled: true, updateInterval: 30, maxRetries: 3 },
];

export default function BookmakerMirror() {
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>(['Betano', 'Bet365', 'Stake']);
  const { odds, loading, error, refresh, compareOdds } = useBookmakerOdds(
    BOOKMAKERS.filter(b => selectedBookmakers.includes(b.name))
  );

  const comparisons = compareOdds();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Espelhamento de Casas de Apostas</h2>
        <p className="text-gray-400">Compare odds ao vivo de múltiplas casas de apostas</p>
      </div>

      {/* Seletor de Casas de Apostas */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Casas de Apostas</h3>
        <div className="flex flex-wrap gap-2">
          {BOOKMAKERS.map(bookmaker => (
            <button
              key={bookmaker.name}
              onClick={() => {
                if (selectedBookmakers.includes(bookmaker.name)) {
                  setSelectedBookmakers(selectedBookmakers.filter(b => b !== bookmaker.name));
                } else {
                  setSelectedBookmakers([...selectedBookmakers, bookmaker.name]);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedBookmakers.includes(bookmaker.name)
                  ? 'bg-[#c4d82e] text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {bookmaker.name}
            </button>
          ))}
        </div>
      </div>

      {/* Comparação de Odds */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Comparação de Odds</h3>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {comparisons.map(comparison => (
            <div key={comparison.eventId} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-white font-bold">{comparison.homeTeam} vs {comparison.awayTeam}</h4>
                  <p className="text-gray-400 text-sm">{comparison.league} • {comparison.sport}</p>
                </div>
                <span className="text-[#c4d82e] text-sm">{comparison.startTime}</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Casa</p>
                  <p className="text-2xl font-bold text-white">{comparison.bestOdds.home.odds.toFixed(2)}</p>
                  <p className="text-[#c4d82e] text-xs">{comparison.bestOdds.home.bookmaker}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Empate</p>
                  <p className="text-2xl font-bold text-white">{comparison.bestOdds.draw.odds.toFixed(2)}</p>
                  <p className="text-[#c4d82e] text-xs">{comparison.bestOdds.draw.bookmaker}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Fora</p>
                  <p className="text-2xl font-bold text-white">{comparison.bestOdds.away.odds.toFixed(2)}</p>
                  <p className="text-[#c4d82e] text-xs">{comparison.bestOdds.away.bookmaker}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-400 text-xs mb-2">Odds por Casa:</p>
                <div className="flex flex-wrap gap-2">
                  {comparison.bookmakers.map(bookmaker => (
                    <div key={bookmaker.name} className="bg-white/5 rounded-lg px-3 py-2">
                      <p className="text-white text-xs font-medium">{bookmaker.name}</p>
                      <p className="text-gray-400 text-xs">
                        {bookmaker.homeOdds.toFixed(2)} / {bookmaker.drawOdds.toFixed(2)} / {bookmaker.awayOdds.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Considerações de Implementação

### 5.1. Performance
- Usar headless browser (Playwright ou Puppeteer)
- Implementar cache de odds (Redis ou localStorage)
- Usar proxy rotativo para evitar bloqueios
- Implementar rate limiting

### 5.2. Confiabilidade
- Implementar retry logic para falhas
- Monitorar status dos scrapers
- Implementar fallback para APIs alternativas
- Log detalhado de erros

### 5.3. Segurança
- Não armazenar credenciais de usuários
- Usar HTTPS para todas as requisições
- Implementar validação de dados
- Proteger contra ataques de injeção

### 5.4. Manutenção
- Atualizar scrapers regularmente
- Monitorar mudanças nas casas de apostas
- Implementar testes automatizados
- Documentar todas as alterações

---

## 6. Próximos Passos

1. **Implementar scrapers para cada casa de apostas**
2. **Criar hook de gerenciamento de odds**
3. **Desenvolver componente de espelhamento**
4. **Implementar cache de dados**
5. **Adicionar monitoramento e alertas**
6. **Testar com dados reais**
7. **Otimizar performance**
8. **Documentar API interna**

---

## 7. Referências

- Playwright: https://playwright.dev/
- Puppeteer: https://pptr.dev/
- Web Scraping Best Practices: https://www.scrapingbee.com/blog/web-scraping-best-practices/
- Anti-Detection Techniques: https://www.scrapingbee.com/blog/avoid-being-blocked-while-scraping/
