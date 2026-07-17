# Sistema Multi-Agente de Telemarketing - Arquitetura Completa

## Visão Geral

Sistema completo de telemarketing com até 12 agentes simultâneos por usuário, cada um operando de forma independente com sua própria fila de contatos, configurações e limites diários.

## Características Principais

- ✅ **12 Posições de Agentes**: Interface estilo "mesa de poker" com 12 slots
- ✅ **Controle Individual**: Cada agente tem seu próprio prompt, voz e configurações
- ✅ **Créditos Compartilhados**: Todos os agentes debitam do mesmo pool de créditos
- ✅ **Limite Diário por Agente**: 150 minutos/dia por agente (configurável)
- ✅ **Real-time Updates**: Status atualizado via Supabase subscriptions
- ✅ **Multi-tenant**: Isolamento completo de dados entre usuários

## Stack Tecnológica

### Backend
- **Banco de Dados**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth
- **Edge Functions**: Deno runtime
- **Real-time**: Supabase Subscriptions

### Serviços de IA
- **Infraestrutura de Voz**: VAPI.ai (R$ 0,25/min)
- **LLM**: Claude 3.5 Sonnet (R$ 0,009/min)
- **Text-to-Speech**: ElevenLabs (R$ 0,15/min)
- **Speech-to-Text**: Deepgram Nova-2 (R$ 0,022/min)
- **Telefonia**: Twilio via VAPI (R$ 0,065/min)

**Custo Total**: R$ 0,50/minuto

### Frontend
- **Framework**: React + TypeScript
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **State Management**: React Hooks + Supabase Client

## Estrutura do Banco de Dados

### Tabela: `user_agents`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- name (text)
- color (text) # Cor visual do card
- position (integer 0-11) # Posição na grade
- system_prompt (text)
- voice_id (text) # ElevenLabs voice ID
- model (text) # claude-3-5-sonnet-20241022
- temperature (numeric)
- vapi_assistant_id (text) # ID do assistente no VAPI
- status (text) # idle | calling | paused
- daily_limit_minutes (integer, default 150)
- created_at, updated_at
```

**RLS**: Usuários só veem/editam seus próprios agentes

### Tabela: `agent_contacts`
```sql
- id (uuid, PK)
- agent_id (uuid, FK → user_agents)
- name (text)
- phone (text)
- data (jsonb) # Dados customizados
- status (text) # pending | calling | completed | failed
- attempt_count (integer)
- last_call_at, last_attempt_at
- created_at, updated_at
```

**RLS**: Acesso via ownership de agent_id

### Tabela: `agent_call_history`
```sql
- id (uuid, PK)
- agent_id (uuid, FK → user_agents)
- contact_id (uuid, FK → agent_contacts)
- vapi_call_id (text) # ID da chamada no VAPI
- phone_number (text)
- status (text) # in-progress | completed | failed | ended
- duration_seconds (integer)
- transcript (text)
- summary (text)
- recording_url (text)
- end_reason (text)
- credits_used (numeric)
- started_at, ended_at, updated_at
```

**RLS**: Acesso via ownership de agent_id

### Tabela: `agent_daily_stats`
```sql
- id (uuid, PK)
- agent_id (uuid, FK → user_agents)
- date (date)
- minutes_used (integer)
- calls_made (integer)
- calls_successful (integer)
- calls_failed (integer)
- credits_spent (numeric)
- daily_limit (integer)
- created_at, updated_at
```

**Constraint**: UNIQUE(agent_id, date)
**RLS**: Acesso via ownership de agent_id

### Função: `reset_agent_daily_stats()`
Executada diariamente às 00:00 via cron job para resetar os limites.

## Componentes React

### `TelemarketingDesk.tsx`
**Responsabilidade**: Interface principal com grid 12 posições

**Features**:
- Header com estatísticas globais (créditos, agentes ativos, minutos usados)
- Grid 4x3 responsivo
- Botões "Adicionar Agente" em posições vazias
- Modal de criação e configuração

**Hooks utilizados**:
- `useAgents()`: Gerenciamento de agentes
- `useCredits()`: Saldo de créditos do usuário
- `useAuth()`: Dados do usuário autenticado

### `AgentCard.tsx`
**Responsabilidade**: Card individual de cada agente

**Elementos visuais**:
- Avatar circular com cor customizável
- Badge de status (calling/idle/paused)
- Métricas em tempo real (minutos, ligações, créditos)
- Barra de progresso do limite diário
- Botões de ação (Start/Pause/Stop/Configure/Delete)

**Estados visuais**:
- Verde: < 70% do limite
- Amarelo: 70-90% do limite
- Vermelho: > 90% do limite

### `CreateAgentModal.tsx`
**Responsabilidade**: Modal de criação de novo agente

**Campos**:
- Nome do agente
- Cor visual (10 presets + picker)
- System prompt (textarea expansível)
- Voice ID (dropdown com vozes ElevenLabs)
- Modelo LLM (dropdown)
- Temperature (slider 0-1)
- Limite diário (input numérico, default 150min)

**Validações**:
- Nome obrigatório (min 3 caracteres)
- Prompt obrigatório (min 20 caracteres)
- Limite entre 30-500 minutos

### `ConfigureAgentModal.tsx`
**Responsabilidade**: Modal de edição de agente existente

**Features adicionais**:
- Mostra estatísticas atuais (total calls, success rate)
- Todos os campos editáveis
- Botão "Salvar" sincroniza com VAPI

## Hooks Customizados

### `useAgents()`
**Métodos**:
```typescript
const {
  agents,           // Array de agentes do usuário
  loading,          // Estado de carregamento
  createAgent,      // Criar novo agente
  updateAgent,      // Atualizar agente
  deleteAgent,      // Deletar agente
  startAgent,       // Iniciar ligações
  pauseAgent,       // Pausar agente
  stopAgent,        // Parar ligações
  getAgentStats,    // Buscar estatísticas
  moveAgent,        // Mover posição na grid
} = useAgents();
```

**Subscription**:
Escuta mudanças em `user_agents` e atualiza automaticamente o estado.

## Edge Functions

### 1. `create-vapi-agent`
**Input**: agentId, name, systemPrompt, voiceId, model, temperature
**Output**: assistantId do VAPI

**Fluxo**:
1. Valida autenticação
2. Cria configuração VAPI com Claude + ElevenLabs
3. POST para `https://api.vapi.ai/assistant`
4. Atualiza `user_agents.vapi_assistant_id`
5. Retorna sucesso

### 2. `update-vapi-agent`
**Input**: agentId, vapiAssistantId, campos para atualizar
**Output**: sucesso/erro

**Fluxo**:
1. Valida ownership
2. PATCH para `https://api.vapi.ai/assistant/{id}`
3. Retorna sucesso

### 3. `delete-vapi-agent`
**Input**: agentId, vapiAssistantId
**Output**: sucesso/erro

**Fluxo**:
1. DELETE no VAPI
2. DELETE em `user_agents` (cascade para contacts/history)
3. Retorna sucesso

### 4. `start-agent-calls`
**Input**: agentId, vapiAssistantId, maxConcurrent
**Output**: array de resultados por contato

**Fluxo**:
1. Verifica se agente já está calling
2. Verifica limite diário
3. Busca contatos pendentes
4. Para cada contato:
   - POST `https://api.vapi.ai/call/phone`
   - Cria registro em `agent_call_history`
5. Atualiza status do agente para 'calling'
6. Retorna resultados

### 5. `stop-agent-calls`
**Input**: agentId
**Output**: array de chamadas encerradas

**Fluxo**:
1. Busca chamadas ativas do agente
2. Para cada chamada:
   - DELETE `https://api.vapi.ai/call/{id}`
   - Atualiza status para 'ended'
3. Atualiza agente para 'idle'
4. Reseta contatos 'calling' para 'pending'

### 6. `vapi-webhook`
**Input**: Eventos do VAPI (status-update, end-of-call-report, transcript)
**Output**: ACK

**Fluxo no `end-of-call-report`**:
1. Atualiza `agent_call_history` (transcript, summary, recording)
2. Calcula créditos (durationMinutes * 0.50)
3. Debita de `profiles.ligacoes_credits`
4. Atualiza `agent_daily_stats`
5. Verifica se atingiu limite diário → para agente
6. Verifica se há mais contatos + créditos → continua ou para

## Fluxos de Uso

### Criar e Configurar Agente
```
1. Usuário clica em slot vazio
2. Abre CreateAgentModal
3. Preenche configurações
4. Clica "Criar"
5. Hook chama createAgent()
6. Frontend POST → create-vapi-agent
7. Edge Function cria assistente no VAPI
8. Retorna assistantId
9. Salva no banco
10. Subscription atualiza UI
11. AgentCard aparece na posição
```

### Iniciar Campanha de Ligações
```
1. Usuário clica "Start" em AgentCard
2. Hook valida créditos
3. Hook chama startAgent(agentId)
4. Frontend POST → start-agent-calls
5. Edge Function busca contatos pendentes
6. Para cada contato, cria chamada no VAPI
7. Status do agente muda para 'calling'
8. AgentCard mostra badge "Em Ligação"
9. Webhook recebe eventos em tempo real
10. Ao final da chamada:
    - Debita créditos
    - Atualiza estatísticas
    - Inicia próxima chamada (se houver)
```

### Parar Agente
```
1. Usuário clica "Stop"
2. Hook chama stopAgent(agentId)
3. Frontend POST → stop-agent-calls
4. Edge Function encerra todas chamadas ativas
5. Status do agente volta para 'idle'
6. Contatos voltam para 'pending'
```

## Limites e Regras

### Por Usuário
- **Agentes**: Máximo 12 simultâneos
- **Créditos**: Pool compartilhado entre todos os agentes
- **Sem créditos**: Todos os agentes param automaticamente

### Por Agente
- **Limite Diário**: 150 minutos (padrão, configurável)
- **Concurrent Calls**: 1 por agente (pode ser ajustado)
- **Posições**: 0-11 (unique constraint per user)

### Segurança
- RLS ativo em todas as tabelas
- JWT validation em todas Edge Functions
- Ownership validation (user_id)
- CORS configurado
- Service Role Key nunca exposta

## Custos Detalhados

### Breakdown por Minuto
```
VAPI Infrastructure:  R$ 0,250
Claude 3.5 Sonnet:    R$ 0,009
ElevenLabs TTS:       R$ 0,150
Deepgram STT:         R$ 0,022
Twilio Telephony:     R$ 0,065
-----------------------------------
TOTAL:                R$ 0,496 ≈ R$ 0,50
```

### Exemplo de Uso
- 1 agente ligando 150 min/dia = R$ 75/dia
- 12 agentes ligando 150 min/dia = R$ 900/dia
- 1 agente 1 hora/dia (60 min) = R$ 30/dia

### Sistema de Créditos
```
1 crédito = R$ 1,00 = 2 minutos de ligação
R$ 100 = 200 minutos
R$ 500 = 1000 minutos (16h 40min)
```

## Monitoramento

### Métricas Globais (Dashboard)
- Total de créditos disponíveis
- Agentes ativos no momento
- Total de ligações hoje
- Minutos usados hoje

### Métricas por Agente (AgentCard)
- Minutos usados hoje / Limite
- Ligações realizadas hoje
- Créditos gastos hoje
- Taxa de sucesso (%)

### Logs
```bash
# Ver todos os logs
supabase functions logs --tail

# Logs específicos de uma function
supabase functions logs vapi-webhook --tail

# Filtrar por erro
supabase functions logs vapi-webhook --level error
```

## Deploy e Manutenção

### Checklist de Deploy
- [ ] Aplicar SQL schema (`add_multi_agent_system.sql`)
- [ ] Deploy das 6 Edge Functions
- [ ] Configurar secrets (VAPI_API_KEY)
- [ ] Configurar webhook no VAPI Dashboard
- [ ] Testar criação de agente
- [ ] Testar fluxo completo de chamada
- [ ] Configurar cron job de reset diário

### Backup Diário Recomendado
```bash
# Backup das configurações de agentes
pg_dump --table=user_agents --table=agent_contacts > backup.sql
```

### Manutenção Regular
- Monitorar uso de créditos
- Verificar logs de erros
- Analisar taxa de sucesso das chamadas
- Otimizar system prompts com base em resultados

## Roadmap Futuro

### v1.1 - Melhorias de UX
- [ ] Drag & drop para reordenar agentes
- [ ] Templates de prompts
- [ ] Biblioteca de vozes favoritas
- [ ] Histórico de performance (gráficos)

### v1.2 - Funcionalidades Avançadas
- [ ] A/B testing de prompts
- [ ] Agendamento de campanhas
- [ ] Integração com CRM (Pipedrive, HubSpot)
- [ ] Relatórios exportáveis (PDF/Excel)

### v1.3 - Otimizações
- [ ] Cache de vozes
- [ ] Retry automático de chamadas falhadas
- [ ] Pausar agente automaticamente ao esgotar créditos
- [ ] Notificações por email/SMS

## Suporte Técnico

### Problemas Comuns

**Agente não inicia**
- Verificar saldo de créditos
- Confirmar que há contatos pendentes
- Checar se limite diário não foi atingido

**Chamadas não são debitadas**
- Verificar webhook configurado no VAPI
- Checar logs da function vapi-webhook
- Confirmar que VAPI está enviando end-of-call-report

**UI não atualiza em tempo real**
- Verificar conexão Supabase
- Confirmar que RLS policies estão corretas
- Checar se subscriptions estão ativas no hook

### Contatos
- Documentação VAPI: https://docs.vapi.ai
- Documentação Supabase: https://supabase.com/docs
- Documentação ElevenLabs: https://docs.elevenlabs.io
- Documentação Deepgram: https://developers.deepgram.com

---

**Última atualização**: Sistema totalmente implementado e pronto para deploy 🚀
