# 🔧 Configuração do Webhook Secret - PROBLEMA IDENTIFICADO!

## ❌ Problema Encontrado:
**Webhook signature verification failed** - O `STRIPE_WEBHOOK_SECRET` não está configurado corretamente no Supabase.

## ✅ Solução Simplificada:

### 1. Obter o Webhook Secret no Stripe Dashboard
1. Vá para: https://dashboard.stripe.com/webhooks
2. Encontre o webhook `https://hedxxbsieoazrmbayzab.supabase.co/functions/v1/stripe-webhook`
3. Clique no webhook
4. Copie o **Signing secret** (começa com `whsec_`)

### 2. Configurar no Supabase
```bash
# Via Supabase CLI (se instalado)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_aqui_esta_seu_secret

# Ou via Dashboard Supabase:
# Project Settings > API > Environment variables
# Adicionar: STRIPE_WEBHOOK_SECRET=whsec_aqui_esta_seu_secret
```

### 3. ✅ Função Modificada
A função `stripe-webhook` foi atualizada para aceitar chamadas sem autenticação JWT (similar ao Asaas), eliminando a necessidade de headers customizados.

### 3. Testar o Webhook
```bash
# Testar função diretamente
curl -X POST 'https://hedxxbsieoazrmbayzab.supabase.co/functions/v1/stripe-webhook' \
  -H 'Content-Type: application/json' \
  -H 'stripe-signature: t=1234567890,v1=assinado_por_stripe' \
  -d '{"type": "payment_intent.succeeded"}'
```

### 4. Verificar Logs do Webhook
```bash
# Ver logs da função
supabase functions logs stripe-webhook
```

## 🎯 O que está funcionando:
✅ Frontend: Pagamento processando
✅ PaymentIntent: Criado com metadados corretos
✅ Webhook URL: Configurada no Stripe
❌ Secret: **PRECISA SER CONFIGURADO**

## 🔑 Dados do PaymentIntent Confirmados:
- **PaymentIntent ID**: `pi_3SfZ3fABFcfGgf230dTMp8EK`
- **UserId**: `3e0e2686-8a50-4b5e-baf8-0ed129202c7c`
- **PlanId**: `plan-agendamentos`
- **Amount**: R$ 5,00

## 📋 Próximos Passos:
1. **Obter secret** do Stripe Dashboard
2. **Configurar** no Supabase
3. **Testar** novamente
4. **Verificar** se as tabelas são atualizadas