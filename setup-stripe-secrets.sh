#!/bin/bash

# Script para configurar Stripe Secrets no Supabase
# Execute: bash setup-stripe-secrets.sh

echo "🔐 Configuração de Secrets do Stripe"
echo "====================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project ID
PROJECT_REF="hedxxbsieoazrmbayzab"

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "Antes de continuar, você precisa:"
echo "1. Revogar a chave antiga no Stripe Dashboard"
echo "2. Gerar uma NOVA chave secreta"
echo "3. Ter um Access Token do Supabase"
echo ""
read -p "Pressione ENTER para continuar ou CTRL+C para sair..."
echo ""

# Verificar se está logado
echo "🔍 Verificando login no Supabase..."
if ! npx supabase projects list &> /dev/null; then
    echo -e "${YELLOW}Não está logado. Iniciando login...${NC}"
    npx supabase login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro no login. Tente manualmente:${NC}"
        echo "   npx supabase login"
        exit 1
    fi
fi

# Link do projeto
echo ""
echo "🔗 Linkando projeto..."
npx supabase link --project-ref $PROJECT_REF
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao linkar projeto${NC}"
    exit 1
fi

echo ""
echo "✅ Projeto linkado com sucesso!"
echo ""

# Configurar secrets
echo "📝 Digite as chaves do Stripe:"
echo ""

# STRIPE_PUBLISHABLE_KEY
echo -e "${GREEN}1. STRIPE_PUBLISHABLE_KEY${NC}"
echo "   (Chave pública de produção - começa com pk_live_)"
read -p "   Cole aqui: " STRIPE_PUB_KEY

if [ -z "$STRIPE_PUB_KEY" ]; then
    echo -e "${RED}❌ Chave vazia. Abortando.${NC}"
    exit 1
fi

# STRIPE_SECRET_KEY
echo ""
echo -e "${GREEN}2. STRIPE_SECRET_KEY${NC}"
echo "   (⚠️  NOVA chave secreta - começa com sk_live_)"
echo "   Gere em: https://dashboard.stripe.com/apikeys"
read -p "   Cole aqui: " STRIPE_SECRET_KEY

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ Chave vazia. Abortando.${NC}"
    exit 1
fi

# STRIPE_WEBHOOK_SECRET
echo ""
echo -e "${GREEN}3. STRIPE_WEBHOOK_SECRET${NC}"
echo "   (Secret do webhook - começa com whsec_)"
read -p "   Cole aqui [whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB]: " STRIPE_WEBHOOK
STRIPE_WEBHOOK=${STRIPE_WEBHOOK:-whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB}

# Confirmação
echo ""
echo "📋 Resumo das configurações:"
echo "   STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUB_KEY:0:20}..."
echo "   STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:20}..."
echo "   STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK:0:20}..."
echo ""
read -p "Confirma? (s/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado pelo usuário"
    exit 1
fi

# Configurar secrets
echo ""
echo "🔧 Configurando secrets no Supabase..."

echo "   → STRIPE_PUBLISHABLE_KEY..."
npx supabase secrets set STRIPE_PUBLISHABLE_KEY="$STRIPE_PUB_KEY"

echo "   → STRIPE_SECRET_KEY..."
npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

echo "   → STRIPE_WEBHOOK_SECRET..."
npx supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK"

# Verificar
echo ""
echo "🔍 Verificando secrets configuradas..."
npx supabase secrets list

echo ""
echo -e "${GREEN}✅ Secrets configuradas com sucesso!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Deploy das Edge Functions:"
echo "      npx supabase functions deploy create-stripe-payment-intent"
echo "      npx supabase functions deploy activate-stripe-plan"
echo "      npx supabase functions deploy activate-stripe-ligacoes"
echo "      npx supabase functions deploy stripe-webhook"
echo "      npx supabase functions deploy get-stripe-config"
echo ""
echo "   2. Teste um pagamento no frontend"
echo "   3. Verifique os logs: console do navegador"
echo ""
echo -e "${YELLOW}⚠️  LEMBRE-SE:${NC} Revogue a chave antiga no Stripe Dashboard!"
echo "   https://dashboard.stripe.com/apikeys"
echo ""
