# InvestHub - Plataforma de Investimentos Multi-Ativos

Uma plataforma completa para gerenciar investimentos em múltiplos mercados financeiros.

## 🚀 Recursos

### 3 Abas Principais

#### 1. Criptomoedas
- **Dashboard**: Visão geral do portfólio de criptomoedas
- **Portfólio**: Gestão detalhada de ativos digitais
- **Negociar**: Interface de compra/venda de cryptos
- **Exchanges**: Conexão com Binance, OKEx, Bitso, Toro, Gate.io, Bybit, MEXC
- **Histórico**: Registro completo de transações

#### 2. Broker (Ações)
- **Dashboard**: Visão geral do patrimônio em ações
- **Portfólio**: Gestão de posições na bolsa brasileira
- **Operar**: Compra e venda de ações (PETR4, VALE3, WEGE3, etc.)
- **Corretoras**: Conexão com Rico, XP, Clear, Itaú, Bradesco
- **Histórico**: Registro de operações na bolsa

#### 3. Casas de Apostas
- **Dashboard**: Acompanhamento de bankroll e resultados
- **Minhas Apostas**: Gestão de apostas esportivas
- **Análise**: Estatísticas por esporte e mercado
- **Casas de Aposta**: Conexão com Bet365, Betano, Stake, etc.
- **Estatísticas**: Métricas detalhadas e conquistas

## 🛠️ Tecnologias

- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Supabase** para banco de dados e autenticação
- **Lucide React** para ícones
- **Vite** para build rápido

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Layout.tsx          # Layout principal com 3 abas
│   ├── Dashboard.tsx       # Dashboard Criptomoedas
│   ├── Portfolio.tsx       # Portfólio Criptomoedas
│   ├── Trading.tsx         # Trading Criptomoedas
│   ├── Exchanges.tsx       # Gerenciamento de Exchanges
│   ├── Transactions.tsx    # Histórico Criptomoedas
│   ├── BrokerDashboard.tsx
│   ├── BrokerPortfolio.tsx
│   ├── BrokerTrading.tsx
│   ├── BrokerBrokers.tsx
│   ├── BrokerTransactions.tsx
│   ├── BettingDashboard.tsx
│   ├── BettingBets.tsx
│   ├── BettingAnalysis.tsx
│   ├── BettingBookmakers.tsx
│   └── BettingStats.tsx
├── services/
│   └── exchange-api.ts     # Clientes de API das exchanges
└── types/
    └── index.ts            # Definições de tipos
```

## ⚙️ Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env`
   - Adicione suas credenciais do Supabase

4. Execute o projeto:
   ```bash
   npm run dev
   ```

## 📊 Integração com APIs

### Exchanges de Criptomoedas
O sistema suporta integração com:
- **Binance** - Maior exchange de criptos
- **OKEx** - Exchange internacional
- **Bitso** - Exchange LATAM
- **Toro** - Plataforma brasileira
- **Gate.io** - Exchange internacional
- **Bybit** - Exchange focada em derivativos
- **MEXC** - Exchange internacional

### Corretoras de Ações
- **Rico** - Corretora brasileira
- **XP Investimentos** - Maior corretora do Brasil
- **Clear** - Corretora com taxa zero
- **Itaú** - Corretora Itaú
- **Bradesco** - Corretora Bradesco

### Casas de Apostas
- **Bet365** - Maior casa do mundo
- **Betano** - Casa popular no Brasil
- **Stake** - Casa focada em crypto
- **1xBet** - Casa com muitos mercados
- **Parimatch** - Casa internacional
- **Blaze** - Casa de crash games

## 🔐 Segurança

- **Row Level Security (RLS)** em todas as tabelas
- Isolamento completo de dados entre usuários
- Credenciais armazenadas de forma segura

## 📈 Roadmap

- [x] Interface com 3 abas (Crypto, Broker, Apostas)
- [x] Dashboard para cada seção
- [ ] Integração real com APIs
- [ ] Sincronização automática de saldos
- [ ] Notificações em tempo real
- [ ] Relatórios exportáveis
