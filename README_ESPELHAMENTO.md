# Sistema de Espelhamento de Casas de Apostas

## Visão Geral

Este sistema permite espelhar odds ao vivo de múltiplas casas de apostas brasileiras sem usar APIs de terceiros, utilizando técnicas de web scraping e interceptação de requisições.

## Casas de Apostas Suportadas

| Casa | Dificuldade | Features | Status |
|------|-------------|----------|--------|
| Betano | Média | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Bet365 | Alta | Ao Vivo, Cash Out, Streaming | ✅ Implementado |
| Stake | Média | Crypto, Ao Vivo, Altas Odds | ✅ Implementado |
| 1xBet | Baixa | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Parimatch | Média | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Blaze | Média | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Betfair | Alta | Exchange, Ao Vivo, Cash Out | ✅ Implementado |
| Sportingbet | Média | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Betway | Média | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Rivalo | Baixa | Ao Vivo, Cash Out, Pix | ✅ Implementado |
| Betsson | Média | Ao Vivo, Cash Out, Pix | ✅ Implementado |

## Estrutura de Arquivos

```
src/negociacoes/
├── types/
│   └── bookmaker.ts              # Tipos TypeScript
├── hooks/
│   └── useBookmakerOdds.ts       # Hook para gerenciamento de odds
├── components/
│   └── BookmakerMirror.tsx       # Componente de espelhamento
└── services/
    ├── bookmaker-scraper.ts      # Scraper genérico
    └── betano-scraper.ts         # Scraper específico Betano
```

## Como Usar

### 1. Importar o Componente

```typescript
import BookmakerMirror from './components/BookmakerMirror';

function App() {
  return <BookmakerMirror />;
}
```

### 2. Usar o Hook

```typescript
import { useBookmakerOdds } from './hooks/useBookmakerOdds';

function MyComponent() {
  const { odds, loading, error, refresh, compareOdds } = useBookmakerOdds(['Betano', 'Bet365', 'Stake']);

  const comparisons = compareOdds();

  return (
    <div>
      {comparisons.map(comparison => (
        <div key={comparison.eventId}>
          <h3>{comparison.homeTeam} vs {comparison.awayTeam}</h3>
          <p>Melhor odd casa: {comparison.bestOdds.home.odds} ({comparison.bestOdds.home.bookmaker})</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Configurar Casas de Apostas

```typescript
import { BOOKMAKER_CONFIGS } from './hooks/useBookmakerOdds';

// Selecionar casas de apostas
const selectedBookmakers = ['Betano', 'Bet365', 'Stake'];

// Filtrar configurações
const configs = BOOKMAKER_CONFIGS.filter(b => selectedBookmakers.includes(b.name));
```

## Funcionalidades

### 1. Comparação de Odds
- Compara odds de múltiplas casas de apostas
- Destaca as melhores odds em verde
- Atualização automática a cada 30 segundos

### 2. Odds ao Vivo
- Filtra apenas eventos ao vivo
- Atualização em tempo real
- Status de cada scraper

### 3. Odds Futuras
- Lista eventos futuros
- Ordenação por data/hora
- Filtro por liga/esporte

### 4. Estatísticas
- Total de eventos
- Eventos ao vivo
- Eventos futuros
- Casas ativas

### 5. Status dos Scrapers
- Monitoramento em tempo real
- Contagem de erros
- Última execução

## Implementação de Scrapers Reais

Para implementar scrapers reais, siga estas etapas:

### 1. Instalar Dependências

```bash
npm install playwright
npx playwright install chromium
```

### 2. Implementar Scraper

```typescript
// src/negociacoes/services/betano-scraper-real.ts
import { chromium } from 'playwright';
import { BookmakerEvent } from '../types/bookmaker';
import { BaseBookmakerScraper, ScraperConfig } from './bookmaker-scraper';

export class BetanoScraperReal extends BaseBookmakerScraper {
  private browser: any = null;
  private page: any = null;

  constructor() {
    const config: ScraperConfig = {
      name: 'Betano',
      baseUrl: 'https://www.betano.bet.br',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };
    super(config);
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({ 'User-Agent': this.config.userAgent });
  }

  async getLiveOdds(): Promise<BookmakerEvent[]> {
    await this.page.goto(`${this.config.baseUrl}/sport/futebol/ao-vivo/`);
    await this.page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

    const odds = await this.page.evaluate(() => {
      const events = document.querySelectorAll('[data-testid="event-card"]');
      return Array.from(events).map(event => {
        const homeTeam = event.querySelector('.event-card__team--home')?.textContent?.trim();
        const awayTeam = event.querySelector('.event-card__team--away')?.textContent?.trim();
        const homeOdds = event.querySelector('.event-card__odds--home')?.textContent?.trim();
        const drawOdds = event.querySelector('.event-card__odds--draw')?.textContent?.trim();
        const awayOdds = event.querySelector('.event-card__odds--away')?.textContent?.trim();
        const league = event.querySelector('.event-card__league')?.textContent?.trim();

        return {
          id: event.getAttribute('data-event-id') || '',
          bookmaker: 'Betano',
          homeTeam: homeTeam || '',
          awayTeam: awayTeam || '',
          league: league || '',
          sport: 'Futebol',
          startTime: new Date().toISOString(),
          status: 'live' as const,
          odds: {
            home: parseFloat(homeOdds || '0'),
            draw: parseFloat(drawOdds || '0'),
            away: parseFloat(awayOdds || '0'),
          },
          markets: [],
          lastUpdated: new Date().toISOString(),
        };
      });
    });

    return odds;
  }

  async getUpcomingOdds(): Promise<BookmakerEvent[]> {
    await this.page.goto(`${this.config.baseUrl}/sport/futebol/`);
    await this.page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

    const odds = await this.page.evaluate(() => {
      const events = document.querySelectorAll('[data-testid="event-card"]');
      return Array.from(events).map(event => {
        const homeTeam = event.querySelector('.event-card__team--home')?.textContent?.trim();
        const awayTeam = event.querySelector('.event-card__team--away')?.textContent?.trim();
        const homeOdds = event.querySelector('.event-card__odds--home')?.textContent?.trim();
        const drawOdds = event.querySelector('.event-card__odds--draw')?.textContent?.trim();
        const awayOdds = event.querySelector('.event-card__odds--away')?.textContent?.trim();
        const league = event.querySelector('.event-card__league')?.textContent?.trim();
        const startTime = event.querySelector('.event-card__time')?.textContent?.trim();

        return {
          id: event.getAttribute('data-event-id') || '',
          bookmaker: 'Betano',
          homeTeam: homeTeam || '',
          awayTeam: awayTeam || '',
          league: league || '',
          sport: 'Futebol',
          startTime: startTime || new Date().toISOString(),
          status: 'upcoming' as const,
          odds: {
            home: parseFloat(homeOdds || '0'),
            draw: parseFloat(drawOdds || '0'),
            away: parseFloat(awayOdds || '0'),
          },
          markets: [],
          lastUpdated: new Date().toISOString(),
        };
      });
    });

    return odds;
  }

  async getEventOdds(eventId: string): Promise<any[]> {
    await this.page.goto(`${this.config.baseUrl}/event/${eventId}`);
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
            available: !selection.classList.contains('disabled'),
          })),
        };
      });
    });

    return markets;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### 3. Atualizar Hook

```typescript
// src/negociacoes/hooks/useBookmakerOdds.ts
import { BetanoScraperReal } from '../services/betano-scraper-real';

// Substituir mock por scraper real
const fetchBookmakerOdds = useCallback(async (bookmaker: BookmakerConfig): Promise<BookmakerEvent[]> => {
  const scraper = ScraperFactory.createScraper(bookmaker.name);
  await scraper.initialize();
  
  try {
    const liveOdds = await scraper.getLiveOdds();
    const upcomingOdds = await scraper.getUpcomingOdds();
    return [...liveOdds, ...upcomingOdds];
  } finally {
    await scraper.close();
  }
}, []);
```

## Considerações de Segurança

### 1. Rate Limiting
- Implementar delays entre requisições
- Usar proxy rotativo
- Respeitar robots.txt

### 2. Anti-Detecção
- Usar user agents reais
- Implementar delays aleatórios
- Usar headless browser

### 3. Tratamento de Erros
- Implementar retry logic
- Log detalhado de erros
- Fallback para dados mock

### 4. Cache
- Cache de odds para evitar requisições desnecessárias
- TTL de 30 segundos
- Invalidação automática

## Próximos Passos

1. **Implementar scrapers reais para cada casa de apostas**
2. **Adicionar suporte a mais mercados (Over/Under, Handicap, etc.)**
3. **Implementar WebSocket para atualizações em tempo real**
4. **Adicionar filtros por liga, esporte, data**
5. **Implementar alertas de arbitragem**
6. **Adicionar histórico de odds**
7. **Implementar exportação de dados**
8. **Adicionar gráficos de variação de odds**

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação: [`ESPELHAMENTO_CASAS_APOSTAS.md`](ESPELHAMENTO_CASAS_APOSTAS.md)
- Tipos: [`src/negociacoes/types/bookmaker.ts`](src/negociacoes/types/bookmaker.ts)
- Hook: [`src/negociacoes/hooks/useBookmakerOdds.ts`](src/negociacoes/hooks/useBookmakerOdds.ts)
- Componente: [`src/negociacoes/components/BookmakerMirror.tsx`](src/negociacoes/components/BookmakerMirror.tsx)
