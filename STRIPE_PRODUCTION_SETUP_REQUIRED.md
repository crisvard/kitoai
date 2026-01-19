# 🚨 CONFIGURAÇÃO OBRIGATÓRIA - STRIPE PRODUCTION KEYS

## ⚠️ IMPORTANTE: Configure estas secrets no Supabase ANTES de usar o sistema!

### No painel do Supabase, vá para:
**Settings → Edge Functions → Environment Variables**

### Adicione estas 3 secrets com suas chaves de PRODUÇÃO:

#### 1. `STRIPE_PUBLISHABLE_KEY`
```
pk_live_SEU_PUBLISHABLE_KEY_AQUI
```
**Substitua pela sua chave publicável real do Stripe (pk_live_...)**

#### 2. `STRIPE_WEBHOOK_SECRET`
```
whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB
```

#### 3. `STRIPE_SECRET_KEY` (OBRIGATÓRIA!)
```
sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Esta é a chave secreta REAL do Stripe (sk_live_...) - ESSENCIAL para as Edge Functions!**

## 🔍 Como verificar se está funcionando:

1. Abra o console do navegador (F12)
2. Procure por: `🔧 [STRIPE-KEYS] Using PRODUCTION mode`
3. Se aparecer `🔧 [STRIPE-CONFIG] Production keys loaded successfully` = ✅ OK

## ❌ Se não configurar:
- Sistema ficará carregando infinitamente
- Erro: "Stripe publishable key not found in production secrets"
- Pagamentos não funcionarão

## 📝 Status Atual:
- ✅ Edge Function `get-stripe-config` criada
- ✅ Hook `useStripeKeys` criado
- ✅ DirectPaymentPage usa chaves de produção
- ✅ Build funcionando
- ❌ **AGUARDANDO CONFIGURAÇÃO DAS SECRETS NO SUPABASE**