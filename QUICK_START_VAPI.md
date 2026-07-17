# 🚀 QUICK START: Teste VAPI em 5 Minutos

## ⚡ TL;DR

Para fazer uma chamada de teste com VAPI no KitoAI:

```bash
# 1. Configurar chave VAPI
export VAPI_API_KEY=sk_live_sua_chave

# 2. Executar script de teste
node teste-vapi-chamada.mjs

# 3. Monitorar webhook
SELECT * FROM vapi_webhook_logs ORDER BY received_at DESC;
```

---

## 📋 CHECKLIST RÁPIDO

- [ ] Tenho VAPI_API_KEY válida? → [Obter em dashboard.vapi.ai](https://dashboard.vapi.ai)
- [ ] Tenho Supabase SERVICE_ROLE_KEY? → [Supabase Dashboard → Settings → API](https://app.supabase.io)
- [ ] Tenho número de telefone para testar? → Use Twilio ou VAPI
- [ ] Edge functions deployadas? → `supabase functions deploy`

---

## 📞 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```bash
# OBRIGATÓRIO
export VAPI_API_KEY=sk_live_xxxxxxxx
export SUPABASE_URL=https://seu-projeto.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# OPCIONAL (para script de teste)
export TEST_USER_ID=seu-user-uuid
export TEST_PHONE=+55199999999      # Seu número (deve ser real)
export CONTACT_PHONE=+55199888888   # Número a chamar
```

---

## 🎯 3 FORMAS DE TESTAR

### Forma 1: Script Automatizado ⭐ RECOMENDADO
```bash
node teste-vapi-chamada.mjs
```
- Cria agente, contato e prepara chamada
- Mostra payload esperado
- Pronto para integração

### Forma 2: cURL Manual
```bash
# Criar agente VAPI
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "name": "Meu Agente",
  "model": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }
}
EOF
```

### Forma 3: Código TypeScript (Edge Function)
```typescript
// Dentro de uma edge function Supabase
const response = await fetch('https://api.vapi.ai/assistant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('VAPI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Agente Teste',
    // ... resto da config
  }),
});
```

---

## 📊 CUSTO DO TESTE

- Chamada de 1 min = **0.5 créditos**
- Chamada de 5 min = **2.5 créditos**
- Crédito de teste é gratuito no VAPI (primeiros 100)

---

## 🔗 LINKS ESSENCIAIS

| Link | Descrição |
|------|-----------|
| [VAPI Dashboard](https://dashboard.vapi.ai) | Para obter API_KEY |
| [VAPI Docs](https://docs.vapi.ai) | Documentação oficial |
| [Supabase Dashboard](https://app.supabase.io) | Para configurar secrets |
| [Docs Guia Completo](./GUIA_TESTE_VAPI.md) | Guia detalhado |
| [Docs Resumo Arquivos](./RESUMO_ARQUIVOS_VAPI.md) | Todos os arquivos relevantes |

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Erro | Solução |
|------|---------|
| `VAPI_API_KEY não configurada` | `supabase secrets set VAPI_API_KEY=sk_live_...` |
| `Agent without phone number` | Adicione número com `manage-vapi-phone-numbers` |
| `No pending contacts` | Insira contato com `status = 'pending'` |
| `Insufficient credits` | `UPDATE user_agents SET allocated_credits = 1000` |
| `Connection timeout` | Verifique internet e VPN/firewall |

---

## 📈 PRÓXIMAS ETAPAS

1. **Teste básico** → Execute `teste-vapi-chamada.mjs`
2. **Veja logs** → Check [CALLING_AGENT_ANALYSIS.md](CALLING_AGENT_ANALYSIS.md)
3. **Customize** → Modifique systemPrompt e voiceId
4. **Produção** → Configure webhook seguro e alertas

---

## 📞 NÚMEROS DE TESTE

| Número | Função | Provider |
|--------|--------|----------|
| +5519999999999 | Seu número (de entrada) | Qualquer |
| +5511988776655 | Número a chamar | Qualquer |

**⚠️ Nota**: Use números reais! Números fictícios não funcionam com provedores reais.

---

## 🎓 ARQUIVOS DE APRENDIZADO

### Iniciante 👶
1. [GUIA_TESTE_VAPI.md](./GUIA_TESTE_VAPI.md) - Passo a passo

### Intermediário 👨‍💼
1. [EDGE_FUNCTIONS_CONFIG.md](./EDGE_FUNCTIONS_CONFIG.md) - Como deployer
2. [CALLING_AGENT_ANALYSIS.md](./CALLING_AGENT_ANALYSIS.md) - Arquitetura

### Avançado 🚀
1. [supabase/functions/start-agent-calls/index.ts](./supabase/functions/start-agent-calls/index.ts) - Código
2. [supabase/functions/vapi-webhook/index.ts](./supabase/functions/vapi-webhook/index.ts) - Webhook

---

## ✅ VALIDAÇÃO

```bash
# Validar setup completo
bash validate-multi-agent.sh

# Verificar banco de dados
node check-db.js

# Listar functions deployadas
supabase functions list
```

---

## 💡 DICAS

- 🎤 Use voz **Rachel** (21m00Tcm4TlvDq8ikWAM) para testes em português
- 🌍 Configure idioma **pt-BR** no transcriber Deepgram
- 🔔 Ative **recording** para analisar chamadas depois
- ⏱️ Configure **daily_minutes_limit** para proteção

---

## 📞 CONTATO / SUPORTE

- VAPI Docs: https://docs.vapi.ai
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Veja repositório do projeto

---

**Última Atualização**: 2026-04-30  
**Status**: ✅ Pronto para Produção  
**Versão**: 1.0
