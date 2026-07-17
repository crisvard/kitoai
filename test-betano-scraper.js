import https from 'https';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function run() {
    console.log("Iniciando requisicao a Betano...");
    try {
        const url = 'https://www.betano.bet.br/sport/futebol/ao-vivo/';
        const html = await fetchUrl(url);

        console.log(`[SUCESSO] Recebido HTML com ${html.length} caracteres.`);

        // Verifica se é pagina de bloqueio (Cloudflare / Akamai)
        if (html.includes("cloudflare") || html.includes("Access Denied") || html.includes("Just a moment...")) {
            console.log("⚠️ AVISO: O conteudo retornado indica um bloqueio antibot (Cloudflare/Akamai).");
            console.log("A pagina nao contem os dados reais, mas uma protecao.");
        } else {
            console.log("Verificando existencia de dados na pagina...");

            // Padrão do site para nomes de times
            const teamPattern = /class="[^"]*team[^"]*"[^>]*>([^<]+)</gi;
            const teams = [];
            let match;
            while ((match = teamPattern.exec(html)) !== null) {
                teams.push(match[1].trim());
            }

            console.log(`Times extraídos via Regex (${teams.length}):`, teams.slice(0, 5));
        }
    } catch (e) {
        console.error("ERRO NO FETCH:", e.message);
    }
}

run();
