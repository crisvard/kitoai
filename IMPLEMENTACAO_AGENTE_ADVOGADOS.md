# 📋 Implementação: Agente de Websites para Advogados

## Resumo Geral

Foi implementado um novo agente de sites (Agente para Advogados) que permite criar websites profissionais para advogados dentro do Código de Ética da OAB (Provimento 205/2021). O agente reutiliza as mesmas functions e secrets do agente de sites padrão, mas oferece planos específicos e customizados.

## 🎯 Características Principais

### ✅ Três Planos de Pagamento para Advogados

1. **Essencial** (R$ 1.800 - valor único)
   - Página única com áreas de atuação, currículo e contato
   - Domínio .adv.br e e-mail profissional
   - WhatsApp e formulário de contato
   - Ficha no Google Meu Negócio
   - Hospedagem + SSL no primeiro ano

2. **Profissional** (R$ 2.500 - valor único)
   - Site multi-página (até 6 páginas)
   - Páginas individuais por área de atuação
   - Biografia dos sócios e equipe
   - Espaço para artigos e publicações
   - Domínio .adv.br, e-mail, WhatsApp, formulário
   - Hospedagem + SSL + suporte por 30 dias

3. **Boutique** (R$ 5.800 - valor único)
   - Tudo do pacote Profissional
   - Criação de identidade visual (marca, paleta, tipografia)
   - Sessão fotográfica orientada (terceirizada)
   - Diagramação de publicações e e-books
   - Hospedagem + SSL + suporte por 90 dias

### ✅ Cliente Isento de Taxas

- ✓ Hospedagem e manutenção **SEM custo mensal/anual**
- ✓ Anuidade do domínio .adv.br cobrada separadamente pelo registrador
- ✓ Sem taxa de hospedagem ou manutenção - apenas o pagamento único do projeto

## 📁 Arquivos Criados/Modificados

### Arquivos Criados

1. **`add_lawyer_plans.sql`**
   - Cria 3 novos planos na tabela `plans`:
     - `website-lawyer-essential`
     - `website-lawyer-professional`
     - `website-lawyer-boutique`
   - Preços em `price_monthly` e `price_yearly` (ambos com mesmo valor = one-time)
   - Classificação como `plan_type = 'professional'`

2. **`add_website_type_column.sql`**
   - Adiciona coluna `website_type` à tabela `user_websites`
   - Valores: `'standard'` (padrão) ou `'lawyer'` (para advogados)
   - Criação de índice para queries rápidas

3. **`src/pages/LawyerWebsitePage.tsx`**
   - Página para seleção de planos de advogado
   - Interface visual com cards de planos
   - Permite seleção e redirecionamento para pagamento
   - Componentes: Cards com features, preços, recomendações
   - Integração com sistema de planos do sistema

### Arquivos Modificados

1. **`src/hooks/usePlans.ts`**
   - Atualizado método `classifyPlan` para reconhecer planos de advogado
   - Adiciona categorização `lawyer` para planos com `website-lawyer` no ID

2. **`src/pages/DirectPaymentPage.tsx`**
   - Detecta parâmetro `plan=website-lawyer` nos URL search params
   - Suporta parâmetro adicional `selected` para ID específico do plano
   - Atualizada lógica de detecção de planos de website/advogado
   - Integrada lógica de ativação para planos de advogado

3. **`src/App.tsx`**
   - Importação de `LawyerWebsitePage`
   - Nova rota: `/lawyer-websites` 
   - Wrapper component: `LawyerWebsitePageWrapper()`
   - Protegida por `PrivateRoute` e `FranchiseProvider`

4. **`src/components/Dashboard.tsx`**
   - Importação do ícone `Gavel` para advogados
   - Novo serviço adicionado à lista (id '7'):
     - Nome: "Agente para Advogados"
     - Descrição: "Websites profissionais construídos dentro do Código de Ética da OAB"
     - Icon: `<Gavel />`
   - Handler de configuração para redirecionar a `/lawyer-websites`

5. **`src/hooks/useWebsiteServices.ts`**
   - Adicionado campo `website_type` à interface `WebsiteService`
   - Mapeamento de dados inclui o novo campo
   - Valor padrão: `'standard'`

## 🔗 Fluxo de Uso

### Para Usuário Contratar Agente de Advogados

1. **Dashboard** → Clica em "Agente para Advogados"
2. **LawyerWebsitePage** → Seleciona um dos 3 planos (Essencial/Profissional/Boutique)
3. **DirectPaymentPage** → Escolhe método de pagamento (PIX ou Cartão)
4. **Processamento** → Pagamento via Asaas (PIX) ou Stripe (Cartão)
5. **Ativação** → Website criado com `website_type = 'lawyer'`

### URL de Acesso Direto

- Seletor de planos: `/lawyer-websites`
- Pagamento com plano específico: `/direct-payment?plan=website-lawyer&selected=website-lawyer-professional`

## 🔐 Segurança & Configurações

- ✓ Mantém as mesmas functions e secrets do agente de sites padrão
- ✓ RLS (Row Level Security) na tabela `user_websites` filtrado por `user_id`
- ✓ Classificação de planos via `plan_type = 'professional'` e categoria `'lawyer'`
- ✓ Integração com sistema de pagamento existente (Asaas + Stripe)

## 📊 Base de Dados

### Alterações no Supabase

1. **Nova Tabela de Dados**: Adiciona 3 novos registros à tabela `plans`
2. **Alteração em `user_websites`**: Adiciona coluna `website_type` com CHECK constraint
3. **Índices**: Criado índice `idx_user_websites_type` para performance

### SQL de Execução

```bash
# 1. Executar add_lawyer_plans.sql
supabase db push add_lawyer_plans.sql

# 2. Executar add_website_type_column.sql
supabase db push add_website_type_column.sql
```

## 🚀 Deploy & Testes

### Testes Recomendados

1. ✓ Verificar se planos aparecem em `/lawyer-websites`
2. ✓ Testar seleção de cada plano
3. ✓ Verificar redirecionamento para pagamento com parâmetros corretos
4. ✓ Testar fluxo completo de PIX
5. ✓ Testar fluxo completo de Cartão (com parcelamento)
6. ✓ Verificar se website é criado com `website_type = 'lawyer'`
7. ✓ Confirmar que todas as features aparecem no banco

### Checklist de Deployment

- [ ] Executar migration SQL no Supabase
- [ ] Build do frontend: `npm run build`
- [ ] Teste em staging antes de produção
- [ ] Verificar logs de pagamento (Asaas + Stripe)
- [ ] Confirmar ativação de websites na tabela `user_websites`

## 💡 Detalhes de Implementação

### Como Funciona a Diferenciação

O sistema diferencia websites de advogados dos normais através:

1. **ID do Plano**: Começa com `website-lawyer-`
2. **Categoria**: Detectada automáticamente como `'lawyer'` pelo `usePlans`
3. **Campo no BD**: `website_type = 'lawyer'` na tabela `user_websites`

Isso permite:
- Filtrar websites de advogados no futuro
- Criar dashboard customizado para advogados
- Aplicar regras específicas (ex: conformidade OAB)
- Distinguir em relatórios e análises

### Reutilização de Functions

As seguintes functions são compartilhadas:
- `create-asaas-payment` → Cria pagamento PIX
- `verify-payment-status` → Verifica status PIX
- `create-stripe-payment-intent` → Cria PaymentIntent para cartão
- `activate-stripe-plan` → Ativa plano via Stripe
- Edge functions de ativação de websites

**Sem modificações necessárias** - o sistema detecta planos de advogado pelo ID.

## 📝 Próximos Passos (Opcional)

1. **Criar Dashboard Customizado para Advogados** - Interface específica com conformidade OAB
2. **Add Documentos de Conformidade OAB** - Gerar certificados/comprovantes
3. **Integração com Sistema de NF-e** - Para emissão de notas fiscais automáticas
4. **Analytics Específico para Advogados** - Relatórios de conversões, etc
5. **Suporte Dedicated para Advogados** - Atendimento via WhatsApp/email

## ✅ Status: Completo

Toda a estrutura foi implementada e pronta para:
- ✓ Seleção de planos por advogados
- ✓ Processamento de pagamentos (PIX e Cartão)
- ✓ Criação de websites com tipo específico
- ✓ Dashboard integrado

---

**Data de Implementação**: 9 de Junho de 2026  
**Status**: Pronto para Deploy
