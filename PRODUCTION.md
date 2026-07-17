# 🚀 Production Scraper - Guia de Deploy

## Visão Geral

Sistema de coleta de odds esportivas em produção, usando abordagem **API-first** para máxima performance e confiabilidade.

## Arquitetura

### Componentes Principais

1. **`api_scraper.py`** - Scraper principal em produção
   - HTTP assíncrono com aiohttp
   - Rotação de proxies e user-agents
   - Retry logic com exponential backoff
   - Processamento concurrente

2. **`betano_api_scraper.py`** - Scraper Betano específico (API)
   - Endpoints diretos da Betano
   - Parse de respostas JSON
   - Sem dependência de DOM

3. **`betano_scraper.py`** - Fallback DOM (legado)
   - Usado apenas se API falhar
   - Playwright para renderização

4. **`base_scraper.py`** - Classe base
   - Gerenciamento de banco (Supabase)
   - Operações CRUD
   - Conexão com browser

### Fluxo de Dados

```
Bookmakers (Betano/Bet365)
        ↓
    [API REST] ← Scraper (aiohttp)
        ↓
   Supabase (PostgreSQL)
        ↓
   Frontend (React/Nuxt)
        ↓
    Usuários
```

## Pré-requisitos

- Python 3.9+
- Supabase (URL + Service Role Key)
- Dependências: `aiohttp`, `playwright`, `supabase`

## Configuração

### 1. Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```bash
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Permissões Supabase

Execute no SQL Editor do Supabase:

```sql
-- Criar tabela
CREATE TABLE IF NOT EXISTS public.betting_odds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport TEXT NOT NULL,
    league TEXT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    home_odds NUMERIC NOT NULL,
    draw_odds NUMERIC,
    away_odds NUMERIC NOT NULL,
    bookmaker TEXT NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.betting_odds ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Allow authenticated read" ON public.betting_odds
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service_role manage" ON public.betting_odds
    FOR ALL TO service_role USING (true);

-- Índice
CREATE INDEX idx_betting_odds_last_update ON public.betting_odds(last_update DESC);
```

## Uso

### Modo Produção (Recomendado)

```bash
cd scraper
./run_production.sh
```

O script:
- Verifica variáveis de ambiente
- Executa com retry automático (5 tentativas)
- Logs detalhados em `logs/`
- Screenshots de debug em `screenshots/`

### Modo Manual

```bash
# API Scraper (rápido)
python3 api_scraper.py

# API Scraper Betano
python3 betano_api_scraper.py

# Fallback DOM (lento)
python3 betano_scraper.py

# Orquestrador
python3 main.py
```

### Scraper Customizado

```python
from api_scraper import ProductionAPIScraper
import asyncio

async def main():
    scraper = ProductionAPIScraper()
    
    # Modo API
    matches = await scraper.scrape_football_production()
    print(f"Found {len(matches)} matches")
    
    # Com fallback
    # matches = await scraper.scrape_with_fallback()
    
    await scraper.close()

asyncio.run(main())
```

## Performance

| Métrica | API | DOM Fallback |
|---------|-----|-------------|
| Tempo médio | 2-5s | 30-60s |
| Matches/minuto | 1000+ | 50-100 |
| Uso CPU | 10-20% | 40-60% |
| Uso RAM | 50-100MB | 150-300MB |

## Recuperação de Falhas

### Problemas Comuns

1. **Rate Limiting (429)**
   - Sistema faz retry com backoff exponencial
   - Rotaciona user-agents
   - Adicione proxies se persistir

2. **Timeout**
   - Timeout configurado em 30s
   - Retry automático
   - Verifique conectividade

3. **Ban de IP**
   - Adicione proxies em `PROXY_POOL`
   - Formato: `"http://user:pass@ip:port"`
   - Use VPN como alternativa

4. **Empty Results**
   - Verifique credenciais Supabase
   - Check se bookmaker mudou API
   - Consulte logs em `logs/`

## Monitoramento

### Logs

```bash
# Últimas execuções
tail -f logs/production_scraper_*.log

# Erros recentes
grep -i error logs/production_scraper_*.log | tail -20

# Performance
awk '/Found/ || /Saved/' logs/production_scraper_*.log
```

### Banco de Dados

```sql
-- últimas odds
SELECT * FROM betting_odds 
ORDER BY last_update DESC 
LIMIT 10;

-- contagem por bookmaker
SELECT bookmaker, COUNT(*) 
FROM betting_odds 
GROUP BY bookmaker;

-- partidas ao vivo
SELECT * FROM betting_odds 
WHERE is_live = TRUE 
ORDER BY league;

-- limpeza (mantém últimos 7 dias)
DELETE FROM betting_odds 
WHERE last_update < NOW() - INTERVAL '7 days';
```

## Escalabilidade

### Múltiplos Bookmakers

Adicione em `api_scraper.py`:

```python
async def scrape_bet365_api(self):
    endpoint = "https://api.bet365.com/..."
    data = await self._fetch_events(endpoint)
    return self._parse_events(data)
```

### Multi-threading

```python
# Em main.py
scrapers = [ProductionAPIScraper() for _ in range(3)]
tasks = [s.scrape_football_production() for s in scrapers]
results = await asyncio.gather(*tasks)
```

### Cloud Deployment

- **AWS**: Lambda (15min timeout) ou ECS
- **GCP**: Cloud Run ou Cloud Functions  
- **DigitalOcean**: Droplets + Cron
- **Cron**: `*/5 * * * *` (a cada 5 min)

## Segurança

```bash
# Nunca commit .env
git rm --cached .env
echo ".env" >> .gitignore

# Permissões restritas
chmod 600 .env
chmod 700 run_production.sh
```

## Troubleshooting

```bash
# Teste de conexão
python3 -c "
import asyncio
from api_scraper import ProductionAPIScraper
asyncio.run(ProductionAPIScraper().scrape_football_production())
"

# Verifica dependências
python3 -c "import aiohttp, supabase, playwright; print('OK')"

# Modo debug (mais verbose)
export DEBUG=1
python3 api_scraper.py
```

## Suporte

Para issues:
1. Verifique logs recentes
2. Consulte error messages
3. Teste endpoints manualmente
4. Verifique credenciais

## Licença

MIT - Uso livre para fins educacionais/comerciais
