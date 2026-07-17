/**
 * Servidor Proxy para scraping da Betano
 * 
 * Este servidor faz o scraping do site da Betano e serve os dados
 * via API local, contornando problemas de CORS.
 * 
 * Uso: node server/betano-proxy.js
 */

import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3001;

// Habilitar CORS para o frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET'],
    credentials: true
}));

app.use(express.json());

/**
 * Função principal para fazer requisição via Puppeteer Invisível
 * Bypassa a Akamai/Cloudflare renderizando o DOM igual ao navegador real.
 */
async function fetchUrl(url) {
    let browser;
    try {
        console.log(`[Puppeteer] Instanciando navegador headless...`);
        browser = await puppeteer.launch({
            headless: 'new', // Novo headless é menos detectável
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });

        const page = await browser.newPage();

        // Bloquear carregamento de recursos inúteis para focar velocidade
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const rt = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(rt)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Configurar agente hiper realista
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`[Puppeteer] Navegando para: ${url}`);
        // Espera a rede estabilizar para sites reativos e pesados (React/Angular)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        // Aguarda eventuais animações de loading caírem
        console.log(`[Puppeteer] Extraindo a árvore DOM final...`);
        await new Promise(r => setTimeout(r, 2000));

        const html = await page.content();
        return html;

    } catch (e) {
        console.error(`[Puppeteer Falhou] Erro no scraping:`, e.message);
        throw e;
    } finally {
        if (browser) {
            await browser.close();
            console.log(`[Puppeteer] Processo finalizado.`);
        }
    }
}

/**
 * Parseia jogos de futebol do HTML da Betano
 */
function parseFootballMatches(html, isLive = false) {
    const matches = [];

    try {
        // Regex para encontrar blocos de jogos
        // Ajustar conforme estrutura real do HTML da Betano

        // Padrão para encontrar nomes de times
        const teamPattern = /class="[^"]*team[^"]*"[^>]*>([^<]+)</gi;
        const teams = [];
        let match;

        while ((match = teamPattern.exec(html)) !== null) {
            teams.push(match[1].trim());
        }

        // Padrão para encontrar odds
        const oddsPattern = /class="[^"]*odds[^"]*"[^>]*>(\d+[.,]\d+)/gi;
        const odds = [];

        while ((match = oddsPattern.exec(html)) !== null) {
            odds.push(parseFloat(match[1].replace(',', '.')));
        }

        // Padrão para encontrar ligas
        const leaguePattern = /class="[^"]*league[^"]*"[^>]*>([^<]+)</gi;
        const leagues = [];

        while ((match = leaguePattern.exec(html)) !== null) {
            leagues.push(match[1].trim());
        }

        // Padrão para placar ao vivo
        const scorePattern = /class="[^"]*score[^"]*"[^>]*>(\d+\s*[-x]\s*\d+)/gi;
        const scores = [];

        while ((match = scorePattern.exec(html)) !== null) {
            scores.push(match[1].trim());
        }

        // Padrão para minutos ao vivo
        const minutePattern = /class="[^"]*minute[^"]*"[^>]*>(\d+)'/gi;
        const minutes = [];

        while ((match = minutePattern.exec(html)) !== null) {
            minutes.push(parseInt(match[1]));
        }

        // Montar jogos a partir dos dados extraídos
        const numMatches = Math.floor(teams.length / 2);

        for (let i = 0; i < numMatches; i++) {
            const homeTeam = teams[i * 2] || `Time Casa ${i + 1}`;
            const awayTeam = teams[i * 2 + 1] || `Time Fora ${i + 1}`;
            const league = leagues[i] || 'Liga Desconhecida';

            const matchData = {
                id: `betano-${Date.now()}-${i}`,
                homeTeam,
                awayTeam,
                league,
                sport: 'Futebol',
                startTime: new Date().toISOString(),
                isLive,
                minute: minutes[i],
                score: scores[i],
                markets: []
            };

            // Adicionar mercado 1X2 se houver odds suficientes
            if (odds.length >= (i + 1) * 3) {
                matchData.markets.push({
                    id: '1x2',
                    name: 'Resultado Final',
                    selections: [
                        { id: 'home', name: homeTeam, odds: odds[i * 3] || 1.5 },
                        { id: 'draw', name: 'Empate', odds: odds[i * 3 + 1] || 3.0 },
                        { id: 'away', name: awayTeam, odds: odds[i * 3 + 2] || 2.5 },
                    ],
                });
            }

            matches.push(matchData);
        }

        // Se não encontrou jogos via regex, tentar extrair de JSON embutido
        if (matches.length === 0) {
            const jsonPattern = /\{[^{}]*"homeTeam"[^{}]*"awayTeam"[^{}]*\}/g;
            let jsonMatch;

            while ((jsonMatch = jsonPattern.exec(html)) !== null) {
                try {
                    const data = JSON.parse(jsonMatch[0]);
                    matches.push({
                        id: `betano-${Date.now()}-${matches.length}`,
                        homeTeam: data.homeTeam || 'Time Casa',
                        awayTeam: data.awayTeam || 'Time Fora',
                        league: data.league || 'Liga',
                        sport: 'Futebol',
                        startTime: data.startTime || new Date().toISOString(),
                        isLive: data.isLive || false,
                        minute: data.minute,
                        score: data.score,
                        markets: data.markets || []
                    });
                } catch (e) {
                    // Ignorar JSON inválido
                }
            }
        }

    } catch (error) {
        console.error('Erro ao parsear HTML:', error);
    }

    return matches;
}

/**
 * Endpoint para buscar jogos de futebol e raw events
 */
app.get('/api/betano/football', async (req, res) => {
    try {
        const isLive = req.query.live === 'true';
        const matchId = req.query.matchId;

        let url;
        if (matchId) {
            url = `https://www.betano.bet.br/event/${matchId}`;
        } else {
            url = isLive
                ? 'https://www.betano.bet.br/sport/futebol/ao-vivo/'
                : 'https://www.betano.bet.br/sport/futebol/';
        }

        console.log(`[Betano Proxy] Buscando URL: ${url}`);

        const html = await fetchUrl(url);

        // Retorna o HTML bruto para o frontend fazer o parsing via DOMParser
        res.send(html);
    } catch (error) {
        console.error('[Betano Proxy] Erro:', error.message);
        res.status(500).send('Erro ao buscar a pagina: ' + error.message);
    }
});

/**
 * Endpoint para buscar jogos de um esporte específico
 */
app.get('/api/betano/sport/:sport', async (req, res) => {
    try {
        const { sport } = req.params;
        const url = `https://www.betano.bet.br/sport/${sport}/`;

        console.log(`[Betano Proxy] Buscando ${sport}: ${url}`);

        const html = await fetchUrl(url);
        const matches = parseFootballMatches(html, false);

        console.log(`[Betano Proxy] Encontrados ${matches.length} jogos de ${sport}`);

        res.json({
            success: true,
            matches,
            timestamp: new Date().toISOString(),
            source: 'betano-proxy'
        });
    } catch (error) {
        console.error('[Betano Proxy] Erro:', error.message);
        res.status(500).json({
            success: false,
            matches: [],
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Endpoint de health check
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎰 Betano Proxy Server                                  ║
║                                                           ║
║   Servidor rodando na porta ${PORT}                        ║
║   URL: http://localhost:${PORT}                            ║
║                                                           ║
║   Endpoints:                                              ║
║   GET /api/betano/football?live=true  - Jogos ao vivo     ║
║   GET /api/betano/football            - Jogos futuros     ║
║   GET /api/betano/sport/:sport        - Por esporte       ║
║   GET /api/health                     - Health check      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
