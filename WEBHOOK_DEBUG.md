# Teste do Webhook Stripe

## Problema Identificado
O usuário diz que os dados chegam no Stripe mas as tabelas do Supabase não são atualizadas.

## Possíveis Causas
1. **Webhook não configurado** no Stripe Dashboard
2. **URL do webhook** incorreta
3. **Segredo do webhook** não configurado
4. **Função webhook** não implantada no Supabase
5. **Tabela payments** não existe

## Soluções

### 1. Verificar se a função está implantada
```bash
# Testar função webhook diretamente
curl -X POST 'https://hedxxbsieoazrmbayzab.supabase.co/functions/v1/stripe-webhook' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 2. Configurar webhook no Stripe Dashboard
**URL do Webhook**: `https://hedxxbsieoazrmbayzab.supabase.co/functions/v1/stripe-webhook`

**Eventos a selecionar**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### 3. Verificar variáveis de ambiente
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Verificar se tabela payments existe
```sql
SELECT * FROM payments LIMIT 5;
```

### 5. Criar tabela payments se não existir
```sql
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan_id TEXT,
  amount DECIMAL(10,2),
  status TEXT,
  payment_date TIMESTAMPTZ,
  plan_type TEXT,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  is_renewal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. Teste manual do webhook
```javascript
// Simular evento webhook
const testEvent = {
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123',
      amount: 9700,
      metadata: {
        userId: 'test-user-id',
        planId: 'plan-agendamentos'
      },
      customer: 'cus_test_123'
    }
  }
};
```

## Status Atual
✅ Função `create-stripe-payment-intent` funcionando
✅ Metadados sendo passados corretamente
✅ Frontend funcionando
❓ Webhook precisa ser configurado/testado