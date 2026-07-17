#!/bin/bash

# Comandos rápidos para configurar Stripe Secrets
# Execute cada comando manualmente ou todo o script de uma vez

# ==================================================
# PASSO 1: Login no Supabase (se necessário)
# ==================================================
npx supabase login

# ==================================================
# PASSO 2: Link do projeto
# ==================================================
npx supabase link --project-ref hedxxbsieoazrmbayzab

# ==================================================
# PASSO 3: Configurar Secrets
# ==================================================

# ⚠️ IMPORTANTE: Revogue a chave antiga e gere uma NOVA no Stripe Dashboard!
# https://dashboard.stripe.com/apikeys

# Chave Publicável (produção)
npx supabase secrets set STRIPE_PUBLISHABLE_KEY="pk_live_51SfTiJABFcfGgf231n03PL9pKY6Q98L7CDsKrqcKnGCcYWBVTVBiiUJAPHAR5yhImUCjxnxGjWgFy2WamZTeN4h100UrOFkIte"

# Chave Secreta (⚠️ COLOQUE A NOVA CHAVE AQUI)
npx supabase secrets set STRIPE_SECRET_KEY="sk_live_COLE_A_NOVA_CHAVE_AQUI"

# Webhook Secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB"

# ==================================================
# PASSO 4: Verificar secrets
# ==================================================
npx supabase secrets list

# ==================================================
# PASSO 5: Deploy das Edge Functions
# ==================================================
npx supabase functions deploy create-stripe-payment-intent
npx supabase functions deploy activate-stripe-plan
npx supabase functions deploy activate-stripe-ligacoes
npx supabase functions deploy stripe-webhook
npx supabase functions deploy get-stripe-config

echo "✅ Configuração completa!"
echo "Teste fazendo um pagamento no frontend"
