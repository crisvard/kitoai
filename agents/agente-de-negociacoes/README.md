# CryptoHub - Gestão de Investimentos em Criptomoedas

Uma interface moderna e intuitiva para gerenciar seus investimentos em múltiplas exchanges de criptomoedas.

## Recursos

- **Dashboard Completo**: Visualize o valor total do seu portfólio, retornos e operações ativas
- **Portfólio Detalhado**: Acompanhe todos os seus ativos com informações de lucro/prejuízo em tempo real
- **Interface de Negociação**: Compre e venda criptomoedas diretamente pela plataforma
- **Gerenciamento de Exchanges**: Conecte e gerencie múltiplas exchanges (Binance, OKEx, Bitso, Toro)
- **Histórico de Transações**: Visualize e filtre todas as suas operações
- **Design Moderno**: Interface elegante com animações suaves e design responsivo

## Tecnologias

- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Supabase** para banco de dados e autenticação
- **Lucide React** para ícones
- **Vite** para build rápido

## Configuração

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

## Estrutura do Banco de Dados

O projeto utiliza três tabelas principais:

- **exchanges**: Armazena as exchanges conectadas
- **portfolio**: Mantém registro de todos os ativos
- **transactions**: Histórico completo de transações

Todas as tabelas possuem Row Level Security (RLS) habilitado para máxima segurança.

## Próximos Passos

Para integrar com as APIs reais das exchanges, você precisará:

1. Obter API keys de cada exchange que deseja conectar
2. Implementar a lógica de sincronização com as APIs
3. Adicionar autenticação de usuários
4. Implementar atualizações de preços em tempo real
