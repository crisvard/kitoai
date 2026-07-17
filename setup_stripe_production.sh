#!/bin/bash

# Script para configurar chaves do Stripe no Supabase
# Execute: bash setup_stripe_production.sh

echo "🚀 Configurando Stripe para Produção"
echo "===================================="

# ⚠️ IMPORTANTE: Substitua pela sua chave secreta real
STRIPE_SECRET_KEY="sk_live_51SfTiJABFcfGgf23XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

echo "📋 Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale primeiro:"
    echo "npm install -g supabase"
    exit 1
fi

echo "🔑 Configurando STRIPE_SECRET_KEY..."
supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

echo "🔐 Configurando STRIPE_WEBHOOK_SECRET..."
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB"

echo "📋 Verificando configuração..."
supabase secrets list

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Verifique se a STRIPE_SECRET_KEY está correta (sk_live_...)"
echo "2. Teste um pagamento para confirmar"
echo "3. Monitore os logs das Edge Functions"
echo ""
echo "📖 Documentação: STRIPE_PRODUCTION_SETUP.md"