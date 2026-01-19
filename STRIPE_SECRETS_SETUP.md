# Configuração das Secrets do Stripe no Supabase

# Configuração das Secrets do Stripe no Supabase

## Secrets que precisam ser configuradas:

### 1. `STRIPE_PUBLISHABLE_KEY`
```
pk_live_51SfTiJABFcfGgf231n03PL9pKY6Q98L7CDsKrqcKnGCcYWBVTVBiiUJAPHAR5yhImUCjxnxGjWgFy2WamZTeN4h100UrOFkIte
```
**⚠️ IMPORTANTE:** Substitua pela sua chave publicável real do Stripe

### 2. `STRIPE_WEBHOOK_SECRET`
```
whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB
```
**⚠️ IMPORTANTE:** Substitua pela sua chave de webhook real do Stripe

### 3. `STRIPE_SECRET_KEY` (IMPORTANTE!)
```
sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Esta chave é necessária para as Edge Functions funcionarem!**
**⚠️ IMPORTANTE:** Substitua pela sua chave secreta real do Stripe (sk_live_...)

## Como configurar:

1. Acesse o painel do Supabase
2. Vá para: **Settings → Edge Functions → Environment Variables**
3. Adicione cada secret com os valores acima
4. Reinicie as Edge Functions se necessário

## Status:
- ✅ Frontend busca chaves das secrets via Edge Function
- ✅ Lógica original do Stripe mantida intacta
- ✅ Arquivo .env removido (chaves vêm das secrets)
- ✅ Build funcionando perfeitamente