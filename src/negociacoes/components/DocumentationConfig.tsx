import { useState } from 'react';
import { FileText, Book, Code, HelpCircle, ExternalLink, Search, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Copy, Check, Download, Upload, Edit, Trash2, Plus, Save, X, Settings, Activity, Target, Zap, Clock, Globe, Lock, Unlock, Shield, Key, Eye, EyeOff, RefreshCw, BarChart3, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize, Minimize, Move, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, ArrowUpCircle, ArrowDownCircle, ArrowLeftCircle, ArrowRightCircle, ArrowUpSquare, ArrowDownSquare, ArrowLeftSquare, ArrowRightSquare, ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUpFromLine, ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromDot, ArrowDownFromDot, ArrowLeftFromDot, ArrowRightFromDot, ArrowUpFromLine as ArrowUpFromLineIcon, ArrowDownFromLine as ArrowDownFromLineIcon, ArrowLeftFromLine as ArrowLeftFromLineIcon, ArrowRightFromLine as ArrowRightFromLineIcon, ArrowUpFromDot as ArrowUpFromDotIcon, ArrowDownFromDot as ArrowDownFromDotIcon, ArrowLeftFromDot as ArrowLeftFromDotIcon, ArrowRightFromDot as ArrowRightFromDotIcon, ArrowUpToLine as ArrowUpToLineIcon, ArrowDownToLine as ArrowDownToLineIcon, ArrowLeftToLine as ArrowLeftToLineIcon, ArrowRightToLine as ArrowRightToLineIcon, ArrowUpSquare as ArrowUpSquareIcon, ArrowDownSquare as ArrowDownSquareIcon, ArrowLeftSquare as ArrowLeftSquareIcon, ArrowRightSquare as ArrowRightSquareIcon, ArrowUpCircle as ArrowUpCircleIcon, ArrowDownCircle as ArrowDownCircleIcon, ArrowLeftCircle as ArrowLeftCircleIcon, ArrowRightCircle as ArrowRightCircleIcon, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, ArrowUpDown, ArrowLeftRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUpLeftSquare, ArrowUpRightSquare, ArrowDownLeftSquare, ArrowDownRightSquare, ArrowUpLeftCircle, ArrowUpRightCircle, ArrowDownLeftCircle, ArrowDownRightCircle, ArrowUpLeftToLine, ArrowUpRightToLine, ArrowDownLeftToLine, ArrowDownRightToLine, ArrowUpLeftFromLine, ArrowUpRightFromLine, ArrowDownLeftFromLine, ArrowDownRightFromLine, ArrowUpLeftFromDot, ArrowUpRightFromDot, ArrowDownLeftFromDot, ArrowDownRightFromDot, ArrowUpLeftSquare as ArrowUpLeftSquareIcon, ArrowUpRightSquare as ArrowUpRightSquareIcon, ArrowDownLeftSquare as ArrowDownLeftSquareIcon, ArrowDownRightSquare as ArrowDownRightSquareIcon, ArrowUpLeftCircle as ArrowUpLeftCircleIcon, ArrowUpRightCircle as ArrowUpRightCircleIcon, ArrowDownLeftCircle as ArrowDownLeftCircleIcon, ArrowDownRightCircle as ArrowDownRightCircleIcon, ArrowUpLeftToLine as ArrowUpLeftToLineIcon, ArrowUpRightToLine as ArrowUpRightToLineIcon, ArrowDownLeftToLine as ArrowDownLeftToLineIcon, ArrowDownRightToLine as ArrowDownRightToLineIcon, ArrowUpLeftFromLine as ArrowUpLeftFromLineIcon, ArrowUpRightFromLine as ArrowUpRightFromLineIcon, ArrowDownLeftFromLine as ArrowDownLeftFromLineIcon, ArrowDownRightFromLine as ArrowDownRightFromLineIcon, ArrowUpLeftFromDot as ArrowUpLeftFromDotIcon, ArrowUpRightFromDot as ArrowUpRightFromDotIcon, ArrowDownLeftFromDot as ArrowDownLeftFromDotIcon, ArrowDownRightFromDot as ArrowDownRightFromDotIcon, ArrowUpDown as ArrowUpDownIcon, ArrowLeftRight as ArrowLeftRightIcon, ArrowUpLeft as ArrowUpLeftIcon, ArrowUpRight as ArrowUpRightIcon, ArrowDownLeft as ArrowDownLeftIcon, ArrowDownRight as ArrowDownRightIcon } from 'lucide-react';

interface DocumentationSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: string;
    subsections?: DocumentationSection[];
}

export default function DocumentationConfigComponent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<string[]>(['overview', 'installation']);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const sections: DocumentationSection[] = [
        {
            id: 'overview',
            title: 'Visão Geral',
            icon: <Book size={20} />,
            content: `O Sistema de Espelhamento de Casas de Apostas é uma solução completa para monitorar e comparar odds de múltiplas casas de apostas em tempo real.

**Principais Funcionalidades:**
- Espelhamento de odds de 11 casas de apostas brasileiras
- Comparação em tempo real de odds entre diferentes casas
- Suporte a odds ao vivo e futuras
- Scraping sem uso de APIs de terceiros
- Cache inteligente para melhor performance
- Sistema de proxy para evitar bloqueios
- Monitoramento e alertas em tempo real`,
            subsections: [
                {
                    id: 'features',
                    title: 'Funcionalidades',
                    icon: <Zap size={16} />,
                    content: `**Espelhamento de Odds:**
- Coleta de odds de múltiplas casas de apostas
- Atualização automática a cada 30 segundos
- Suporte a odds ao vivo e futuras

**Comparação de Odds:**
- Comparação lado a lado de odds entre casas
- Destaque das melhores odds
- Cálculo de ROI e lucro potencial

**Sistema de Scraping:**
- Scrapers específicos para cada casa de apostas
- Suporte a Playwright e Puppeteer
- Tratamento de erros e retry automático

**Cache e Performance:**
- Cache de odds para evitar requisições desnecessárias
- Estratégias LRU, FIFO e LFU
- Limpeza automática de cache antigo`,
                },
                {
                    id: 'architecture',
                    title: 'Arquitetura',
                    icon: <Code size={16} />,
                    content: `**Componentes Principais:**

1. **Hook useBookmakerOdds**
   - Gerencia estado das odds
   - Coordena scrapers
   - Fornece funções de comparação

2. **Componentes de UI**
   - BookmakerMirror: Espelhamento principal
   - OddsComparison: Comparação de odds
   - LiveOdds: Odds ao vivo
   - BettingAnalytics: Estatísticas

3. **Serviços de Scraping**
   - BaseBookmakerScraper: Classe base
   - BetanoScraper: Scraper específico Betano
   - ScraperFactory: Factory para criar scrapers

4. **Configurações**
   - ProxyConfig: Configuração de proxy
   - CacheConfig: Configuração de cache
   - RateLimitConfig: Rate limiting
   - MonitoringConfig: Monitoramento`,
                },
            ],
        },
        {
            id: 'installation',
            title: 'Instalação',
            icon: <Download size={20} />,
            content: `**Pré-requisitos:**
- Node.js 18+
- npm ou yarn
- Playwright (para scraping)

**Passos de Instalação:**

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-repo/mirrorhub.git
cd mirrorhub
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Instale o Playwright:
\`\`\`bash
npx playwright install chromium
\`\`\`

4. Configure as variáveis de ambiente:
\`\`\`bash
cp .env.example .env
\`\`\`

5. Inicie o servidor de desenvolvimento:
\`\`\`bash
npm run dev
\`\`\``,
            subsections: [
                {
                    id: 'dependencies',
                    title: 'Dependências',
                    icon: <Code size={16} />,
                    content: `**Dependências Principais:**
- react: ^18.2.0
- lucide-react: ^0.263.1
- playwright: ^1.36.0

**Dependências de Desenvolvimento:**
- typescript: ^5.0.0
- vite: ^4.4.0
- tailwindcss: ^3.3.0

**Instalação Completa:**
\`\`\`bash
npm install react lucide-react playwright
npm install -D typescript vite tailwindcss
\`\`\``,
                },
                {
                    id: 'configuration',
                    title: 'Configuração',
                    icon: <Settings size={16} />,
                    content: `**Variáveis de Ambiente (.env):**

\`\`\`env
# API Keys (opcional para modo real)
VITE_ODDS_API_KEY=sua_chave_api

# Configurações de Proxy
VITE_PROXY_ENABLED=true
VITE_PROXY_ROTATION_INTERVAL=60

# Configurações de Cache
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=30
VITE_CACHE_MAX_SIZE=100

# Configurações de Rate Limiting
VITE_RATE_LIMIT_ENABLED=true
VITE_RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Configurações de Monitoramento
VITE_MONITORING_ENABLED=true
VITE_ALERT_EMAIL=admin@exemplo.com
\`\`\``,
                },
            ],
        },
        {
            id: 'usage',
            title: 'Uso',
            icon: <HelpCircle size={20} />,
            content: `**Como Usar o Sistema:**

1. **Acesse o Dashboard:**
   - Navegue para a aba "Casas de Apostas"
   - Selecione "Espelhamento" no menu lateral

2. **Selecione Casas de Apostas:**
   - Clique nas casas de apostas para habilitar/desabilitar
   - O sistema começará a coletar odds automaticamente

3. **Visualize Odds:**
   - Use a aba "Comparação" para ver odds lado a lado
   - Use a aba "Ao Vivo" para ver apenas eventos ao vivo

4. **Analise Estatísticas:**
   - Use a aba "Análise" para ver estatísticas detalhadas
   - Compare performance entre casas de apostas`,
            subsections: [
                {
                    id: 'bookmakers',
                    title: 'Casas de Apostas Suportadas',
                    icon: <Globe size={16} />,
                    content: `**Casas de Apostas Disponíveis:**

1. **Betano** - Dificuldade: Média
   - URL: https://www.betano.bet.br
   - Features: Ao Vivo, Cash Out, Pix

2. **Bet365** - Dificuldade: Alta
   - URL: https://www.bet365.com.br
   - Features: Ao Vivo, Cash Out, Streaming

3. **Stake** - Dificuldade: Média
   - URL: https://stake.com
   - Features: Crypto, Ao Vivo, Altas Odds

4. **1xBet** - Dificuldade: Baixa
   - URL: https://1xbet.com.br
   - Features: Ao Vivo, Cash Out, Pix

5. **Parimatch** - Dificuldade: Média
   - URL: https://parimatch.com.br
   - Features: Ao Vivo, Cash Out, Pix

6. **Blaze** - Dificuldade: Média
   - URL: https://blaze.com
   - Features: Ao Vivo, Cash Out, Pix

7. **Betfair** - Dificuldade: Alta
   - URL: https://betfair.com.br
   - Features: Exchange, Ao Vivo, Cash Out

8. **Sportingbet** - Dificuldade: Média
   - URL: https://sportingbet.com.br
   - Features: Ao Vivo, Cash Out, Pix

9. **Betway** - Dificuldade: Média
   - URL: https://betway.com.br
   - Features: Ao Vivo, Cash Out, Pix

10. **Rivalo** - Dificuldade: Baixa
    - URL: https://rivalo.com.br
    - Features: Ao Vivo, Cash Out, Pix

11. **Betsson** - Dificuldade: Média
    - URL: https://betsson.com.br
    - Features: Ao Vivo, Cash Out, Pix`,
                },
                {
                    id: 'api',
                    title: 'API Reference',
                    icon: <Code size={16} />,
                    content: `**Hook useBookmakerOdds:**

\`\`\`typescript
const {
  odds,           // Lista de eventos com odds
  loading,        // Estado de carregamento
  error,          // Mensagem de erro
  scraperStatuses, // Status dos scrapers
  stats,          // Estatísticas gerais
  refresh,        // Função para atualizar odds
  compareOdds,    // Função para comparar odds
  toggleBookmaker, // Função para habilitar/desabilitar casa
  getBookmakerOdds, // Função para obter odds de uma casa
  getLiveOdds,    // Função para obter odds ao vivo
  getUpcomingOdds, // Função para obter odds futuras
} = useBookmakerOdds(['Betano', 'Bet365', 'Stake']);
\`\`\`

**Tipos TypeScript:**

\`\`\`typescript
interface BookmakerEvent {
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

interface OddsComparison {
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
\`\`\``,
                },
            ],
        },
        {
            id: 'troubleshooting',
            title: 'Solução de Problemas',
            icon: <HelpCircle size={20} />,
            content: `**Problemas Comuns:**

1. **Scraper não está coletando odds:**
   - Verifique se a casa de apostas está habilitada
   - Verifique se o proxy está funcionando
   - Verifique os logs de erro

2. **Odds não estão sendo atualizadas:**
   - Verifique se o cache está habilitado
   - Verifique o intervalo de atualização
   - Verifique a conexão com a internet

3. **Rate limit atingido:**
   - Ajuste o rate limit nas configurações
   - Use proxy rotativo
   - Reduza a frequência de requisições

4. **Erros de CORS:**
   - Use proxy para evitar CORS
   - Configure o proxy corretamente
   - Verifique as configurações de CORS`,
            subsections: [
                {
                    id: 'errors',
                    title: 'Erros Comuns',
                    icon: <XCircle size={16} />,
                    content: `**Erro: "Timeout ao conectar"**
- Causa: Conexão lenta ou instável
- Solução: Aumente o timeout ou use proxy

**Erro: "Rate limit atingido"**
- Causa: Muitas requisições em pouco tempo
- Solução: Ajuste o rate limit ou use proxy rotativo

**Erro: "Seletor não encontrado"**
- Causa: Site mudou a estrutura HTML
- Solução: Atualize o scraper

**Erro: "Proxy não disponível"**
- Causa: Proxy offline ou bloqueado
- Solução: Use proxy diferente ou desabilite proxy`,
                },
                {
                    id: 'performance',
                    title: 'Otimização de Performance',
                    icon: <Zap size={16} />,
                    content: `**Dicas de Performance:**

1. **Use Cache:**
   - Habilite cache para evitar requisições desnecessárias
   - Configure TTL apropriado (30s recomendado)

2. **Use Proxy Rotativo:**
   - Configure múltiplos proxies
   - Use rotação round-robin ou aleatória

3. **Ajuste Rate Limiting:**
   - Configure rate limit baseado na capacidade
   - Use burst limit para picos de tráfego

4. **Otimize Scrapers:**
   - Use headless browser
   - Implemente lazy loading
   - Use compression

5. **Monitore Performance:**
   - Use logs detalhados
   - Monitore métricas de performance
   - Configure alertas para problemas`,
                },
            ],
        },
    ];

    const toggleSection = (id: string) => {
        setExpandedSections(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Documentação</h2>
                <p className="text-gray-400">Guia completo do Sistema de Espelhamento de Casas de Apostas</p>
            </div>

            {/* Busca */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        placeholder="Buscar na documentação..."
                    />
                </div>
            </div>

            {/* Seções */}
            <div className="space-y-4">
                {filteredSections.map(section => (
                    <div key={section.id} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-[#c4d82e]">{section.icon}</div>
                                <h3 className="text-xl font-bold text-white">{section.title}</h3>
                            </div>
                            {expandedSections.includes(section.id) ? (
                                <ChevronUp className="text-gray-400" size={20} />
                            ) : (
                                <ChevronDown className="text-gray-400" size={20} />
                            )}
                        </button>

                        {expandedSections.includes(section.id) && (
                            <div className="px-6 pb-6">
                                <div className="prose prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                                        {section.content}
                                    </div>
                                </div>

                                {section.subsections && (
                                    <div className="mt-6 space-y-4">
                                        {section.subsections.map(subsection => (
                                            <div key={subsection.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                <button
                                                    onClick={() => toggleSection(subsection.id)}
                                                    className="w-full flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[#c4d82e]">{subsection.icon}</div>
                                                        <h4 className="text-white font-medium">{subsection.title}</h4>
                                                    </div>
                                                    {expandedSections.includes(subsection.id) ? (
                                                        <ChevronUp className="text-gray-400" size={16} />
                                                    ) : (
                                                        <ChevronDown className="text-gray-400" size={16} />
                                                    )}
                                                </button>

                                                {expandedSections.includes(subsection.id) && (
                                                    <div className="mt-4 prose prose-invert max-w-none">
                                                        <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                                                            {subsection.content}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Links Úteis */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Links Úteis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                        href="https://playwright.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
                    >
                        <Code className="text-[#c4d82e]" size={20} />
                        <div>
                            <p className="text-white font-medium">Playwright</p>
                            <p className="text-gray-400 text-sm">Automação de navegador</p>
                        </div>
                        <ExternalLink className="text-gray-400 ml-auto" size={16} />
                    </a>
                    <a
                        href="https://pptr.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
                    >
                        <Code className="text-[#c4d82e]" size={20} />
                        <div>
                            <p className="text-white font-medium">Puppeteer</p>
                            <p className="text-gray-400 text-sm">Automação de navegador</p>
                        </div>
                        <ExternalLink className="text-gray-400 ml-auto" size={16} />
                    </a>
                    <a
                        href="https://react.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
                    >
                        <Code className="text-[#c4d82e]" size={20} />
                        <div>
                            <p className="text-white font-medium">React</p>
                            <p className="text-gray-400 text-sm">Biblioteca de UI</p>
                        </div>
                        <ExternalLink className="text-gray-400 ml-auto" size={16} />
                    </a>
                    <a
                        href="https://tailwindcss.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
                    >
                        <Code className="text-[#c4d82e]" size={20} />
                        <div>
                            <p className="text-white font-medium">Tailwind CSS</p>
                            <p className="text-gray-400 text-sm">Framework de CSS</p>
                        </div>
                        <ExternalLink className="text-gray-400 ml-auto" size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
}
