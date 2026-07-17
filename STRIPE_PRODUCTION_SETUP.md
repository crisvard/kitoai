# 🚀 Configuração Stripe - Modo Produção

## 📋 Status Atual
- ✅ **Frontend**: Configurado com chave de produção
- ✅ **Chave Publicável**: `pk_live_51SfTiJABFcfGgf231n03PL9pKY6Q98L7CDsKrqcKnGCcYWBVTVBiiUJAPHAR5yhImUCjxnxGjWgFy2WamZTeN4h100UrOFkIte`
- ✅ **Webhook Secret**: `whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB`
- ❌ **Chave Secreta**: Pendente configuração no Supabase

## 🔧 Configuração para Produção

### 1. **Obter Chaves de Produção no Stripe Dashboard**

#### 1.1 Chave Publicável (Publishable Key)
```
Dashboard Stripe → Developers → API Keys
- Copie a chave que começa com: pk_live_...
```

#### 1.2 Chave Secreta (Secret Key)
```
Dashboard Stripe → Developers → API Keys
- Copie a chave que começa com: sk_live_...
```

#### 1.3 Webhook Secret (para webhooks)
```
Dashboard Stripe → Developers → Webhooks
- Crie webhook para: https://your-project.supabase.co/functions/v1/stripe-webhook
- Copie o Signing secret que começa com: whsec_...
```

### 2. **Configurar Variáveis de Ambiente**

#### 2.1 No arquivo `.env` (desenvolvimento local)
```env
# Chave publicável de produção
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. **Configurar no Supabase (Produção)**

#### 2.1 Via Supabase CLI (recomendado)
```bash
# ⚠️ IMPORTANTE: Substitua pela sua chave secreta real (sk_live_...)
supabase secrets set STRIPE_SECRET_KEY=sk_live_51SfTiJABFcfGgf23XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Webhook secret (já fornecido)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB
```

#### 2.2 Verificar configuração
```bash
# Listar secrets configurados
supabase secrets list
```

#### 2.3 Ou via Dashboard Supabase
1. Acesse: Project Settings → Edge Functions → Environment variables
2. Adicione:
   - `STRIPE_SECRET_KEY`: `sk_live_...` (sua chave secreta real)
   - `STRIPE_WEBHOOK_SECRET`: `whsec_2jJPED4hKGOMfFmU96IdFghL23QJf6fB`

### 3. **Configurações do Stripe Dashboard**

#### 3.1 Webhooks
- **URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Eventos**: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### 3.2 Configurações Gerais
- **Modo**: Live (produção)
- **Moeda**: BRL (Real brasileiro)
- **País**: Brazil

### 4. **Script de Configuração Automática**
```bash
# Execute o script fornecido (após editar com sua chave secreta real)
./setup_stripe_production.sh
```

## 📊 Checklist Final

### ✅ Configurado
- [x] Chave publicável de produção no `.env`
- [x] Webhook secret identificado
- [x] Frontend usando variável de ambiente
- [x] Build testado com sucesso

### 🔄 Pendente
- [ ] Configurar chave secreta no Supabase
- [ ] Executar script de configuração
- [ ] Testar pagamento real
- [ ] Verificar webhook funcionando

## 🎯 Status Atual

**Frontend**: ✅ **CONFIGURADO PARA PRODUÇÃO**
**Backend**: 🔄 **AGUARDANDO CHAVE SECRETA**

---

**Próximo passo**: Configure a chave secreta real no Supabase e teste!</content>
<parameter name="filePath">/workspaces/kitoai/STRIPE_PRODUCTION_SETUP.md