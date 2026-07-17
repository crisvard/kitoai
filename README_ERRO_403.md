# 🔧 FIX: Erro 403 ao Atualizar Agendamentos (Confirmar, Concluir, Cancelar, Reagendar, Excluir)

## 📌 Situação Atual

**Problema:** Franqueados recebem erro `HTTP 403 Forbidden` ao tentar qualquer operação em agendamentos.

**Sintomas:**
```
Failed to load resource: the server responded with a status of 403
GET hedxxbsieoazrmbayzab.supabase.co/rest/v1/appointments?id=eq.a10ea206...
```

**Operações Bloqueadas:**
- ❌ Confirmar agendamento
- ❌ Concluir agendamento  
- ❌ Cancelar agendamento
- ❌ Reagendar agendamento
- ❌ Excluir agendamento

---

## 🎯 Solução (Implementar AGORA)

### Arquivo Principal: `COPIAR_COLAR_SQL.sql`

Este arquivo contém **TODO o SQL necessário** para corrigir o problema.

### Instruções de Implementação:

1. **Abra Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Projeto: Kito Expert

2. **Vá para SQL Editor:**
   - Menu esquerdo → SQL Editor
   - Clique em "New Query"

3. **Copie TODO o conteúdo:**
   - Arquivo: `/Kito Expert - Dashboard/COPIAR_COLAR_SQL.sql`
   - Copiar: Ctrl+A, Ctrl+C

4. **Cole no Supabase:**
   - Colar no editor: Ctrl+V

5. **Execute:**
   - Clique em "Run" (ou Cmd+Enter)

6. **Resultado esperado:**
   - ✅ Nenhuma mensagem de erro
   - ✅ 3 mensagens: "CREATE POLICY"

---

## ✅ Verificação Pós-Implementação

### Teste 1: Verificar se Policies Foram Criadas

No SQL Editor, execute:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'appointments' ORDER BY policyname;
```

**Deve retornar 3 policies:**
- Admin full access to appointments
- Customer own appointments  
- Professional manage franchise appointments

### Teste 2: Limpar Cache e Testar

1. **Limpe o cache do navegador:**
   - Windows: Ctrl+Shift+Delete
   - Mac: Cmd+Shift+Delete

2. **Faça logout** (se estiver logado)

3. **Faça login** novamente com conta de franqueado

4. **Teste confirmar um agendamento:**
   - Deve funcionar ✅

---

## 🔍 Se Ainda Tiver 403 Após Implementação

### Checklist de Diagnóstico:

1. **Verifique se o professional existe:**
```sql
SELECT id, name, role, franchise_id, active 
FROM professionals 
WHERE role = 'professional' AND active = true
LIMIT 5;
```

**Deve retornar:** Pelo menos um professional com `role='professional'` e `active=true`

2. **Verifique se agendamento existe:**
```sql
SELECT id, customer_name, franchise_id 
FROM appointments 
WHERE id = 'a10ea206-a52a-4883-b6a8-8c817ba12ee4';
```

**Deve retornar:** Um agendamento com franchise_id preenchido

3. **Verifique se franchise existe:**
```sql
SELECT id, name FROM franchises LIMIT 3;
```

4. **Verifique o professional do usuário logado:**
```sql
-- Execute após fazer login
SELECT auth.uid() as seu_user_id;

-- Depois use este user_id para procurar:
SELECT * FROM professionals WHERE user_id = 'SEU_USER_ID_AQUI';
```

---

## 📚 Documentação Complementar

### Arquivo: `GUIA_CORRECAO_ERRO_403.md`
Guia completo com instruções passo-a-passo, verificações e troubleshooting.

### Arquivo: `RESUMO_ERRO_403.md`
Resumo visual da causa, solução e implementação.

### Arquivo: `FIX_RLS_USING_PROFESSIONALS_TABLE.sql`
Script completo com comentários detalhados.

### Arquivo: `UPDATE_JWT_WITH_ROLE_AND_FRANCHISE.sql`
Solução alternativa/futura para preencher JWT (opcional).

---

## 🔐 Como Funciona a Solução

### Problema Original
RLS Policies tentavam verificar `auth.jwt() -> 'user_metadata'`, mas o JWT não estava preenchido com `role` e `franchise_id`.

### Solução Implementada
As new RLS Policies verificam a tabela `professionals` em vez do JWT:

```sql
-- Em vez de:
WHERE (auth.jwt() -> 'user_metadata' ->> 'role') = 'professional'

-- Agora:
WHERE EXISTS (
  SELECT 1 FROM professionals
  WHERE professionals.user_id = auth.uid()
  AND professionals.role = 'professional'
  AND professionals.franchise_id = appointments.franchise_id
  AND professionals.active = true
)
```

**Vantagens:**
- ✅ Funciona imediatamente
- ✅ Usa dados do banco (mais seguro)
- ✅ Sem dependência do JWT
- ✅ Compatível com código existente

---

## 🧪 Testes Recomendados

### Teste 1: Como Admin
1. Faça login com admin
2. Escolha um agendamento
3. Clique em "Confirmar"
4. ✅ Deve atualizar sem erro

### Teste 2: Como Franqueado  
1. Faça login com profissional
2. Escolha um agendamento da sua franquia
3. Teste cada operação:
   - Confirmar ✅
   - Concluir ✅
   - Cancelar ✅
   - Reagendar ✅
   - Excluir ✅

### Teste 3: Isolamento
1. Franqueado A tenta atualizar agendamento de Franquia B
2. ✅ Deve ser bloqueado (RLS funcionando)

---

## 🚀 Roadmap Futuro

### Fase 1: Implementação (AGORA)
- [x] Identificar causa: JWT não preenchido
- [x] Criar solução: RLS usando tabela professionals
- [x] Documentar: Guias e scripts
- [ ] Você executar: COPIAR_COLAR_SQL.sql

### Fase 2: Validação (Hoje)
- [ ] Testar com franqueados
- [ ] Testar isolamento entre franquias
- [ ] Verificar logs

### Fase 3: Otimização (Próxima semana)
- [ ] Implementar atualização automática de JWT (opcional)
- [ ] Adicionar logs de auditoria
- [ ] Implementar retry automático

---

## 📊 Comparativo

| Aspecto | Antes (COM BUG) | Depois (CORRIGIDO) |
|---------|-----------------|------------------|
| RLS verifica | JWT metadata | Tabela professionals |
| Role definido | ❌ Não | ✅ Sim |
| Franchise_id | ❌ Não | ✅ Sim |
| Confirmar agendamento | ❌ 403 | ✅ OK |
| Concluir agendamento | ❌ 403 | ✅ OK |
| Cancelar agendamento | ❌ 403 | ✅ OK |
| Reagendar agendamento | ❌ 403 | ✅ OK |
| Excluir agendamento | ❌ 403 | ✅ OK |

---

## 🎓 O Que Aprendemos

### Problema Identificado
JWT em Supabase precisa ser preenchido manualmente com `user_metadata` contendo `role` e `franchise_id`.

### Melhor Prática
Usar tabelas do banco como fonte de verdade para permissões em vez de confiar apenas no JWT.

### Implementação
RLS Policies podem usar subconsultas para verificar dados em outras tabelas.

---

## 💡 Dicas

1. **Cache do Navegador:** Se ainda ver erro após implementação, limpe cache (Ctrl+Shift+Delete) e faça login novamente

2. **Múltiplas Franquias:** A RLS verifica `franchise_id`, então cada franquado vê apenas seus agendamentos ✅

3. **Admin:** Admin tem acesso a TODOS os agendamentos, sem restrição de franquia ✅

4. **Performance:** Subquery em RLS pode ser lenta com muitos records. Monitor se necessário otimizar com índices.

---

## 🆘 Precisa de Ajuda?

### 1. Erro durante execução do SQL
- Copie o arquivo inteiro novamente
- Verifique se não há quebras de linha estranhas
- Execute tudo de uma vez, não line-by-line

### 2. Ainda recebe 403 após implementação
- Execute: `SELECT * FROM professionals WHERE active = true;`
- Verifique se há profissionais ativos
- Verifique se franchise_id está preenchido
- Limpe cache do navegador
- Faça logout/login

### 3. RLS não foi criada
- Vá para: Auth > Policies > Appointments table
- Você deve ver 3 policies listadas
- Se não ver, reexecute o SQL

---

## ✨ Resumo Executivo

**Problema:** Erro 403 ao atualizar agendamentos  
**Causa:** RLS verificando JWT não preenchido  
**Solução:** Alterar RLS para verificar tabela professionals  
**Implementação:** 2 minutos (copiar + colar + run)  
**Impacto:** Confirmar, concluir, cancelar, reagendar, excluir agendamentos funcionarão ✅  

---

## 📋 Checklist de Conclusão

- [ ] Copiei o arquivo `COPIAR_COLAR_SQL.sql`
- [ ] Criei um New Query no Supabase SQL Editor
- [ ] Colei o SQL completo
- [ ] Cliquei em Run
- [ ] Nenhum erro apareceu ✅
- [ ] Fiz logout e login novamente
- [ ] Limpei cache do navegador (Ctrl+Shift+Delete)
- [ ] Testei confirmar um agendamento como franqueado ✅
- [ ] ✨ **PROBLEMA RESOLVIDO!**

---

**Versão:** 1.0  
**Data:** 2025-12-06  
**Status:** ✅ Pronto para Implementação  
**Tempo de Implementação:** ~5 minutos  
**Risco:** Baixo (apenas RLS policies)  
**Rollback:** Possível em qualquer momento (restore backup ou reexecutar policies antigas)

