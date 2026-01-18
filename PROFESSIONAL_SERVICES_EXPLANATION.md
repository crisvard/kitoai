# Solução: Atribuição de Serviços a Múltiplos Profissionais

## Problema
Você tem múltiplos profissionais e cada um pode ter múltiplos serviços. Um serviço também pode ser atribuído a vários profissionais.

**Exemplo:**
- Profissional A: [Corte, Barba, Tintura]
- Profissional B: [Corte, Manicure]
- Profissional C: [Barba, Pedicure]

## Solução: Tabela Junction (Many-to-Many)

### Estrutura de Banco de Dados

```
┌─────────────────┐
│  professionals  │
├─────────────────┤
│ id (uuid)       │
│ name            │
│ specialty       │
│ user_id         │
└────────┬────────┘
         │
         │ (muitos para muitos)
         │
    ┌────┴─────────┐
    │ JUNCTION     │
    │ TABLE        │
    └────┬─────────┘
         │
┌────────┴─────────┐
│    services      │
├──────────────────┤
│ id (uuid)        │
│ name             │
│ price            │
│ user_id          │
└──────────────────┘
```

### Tabela Junction: `professional_services`

```sql
CREATE TABLE professional_services (
  id uuid PRIMARY KEY,
  professional_id uuid REFERENCES professionals(id),
  service_id uuid REFERENCES services(id),
  created_at timestamptz,
  UNIQUE(professional_id, service_id)  -- Evita duplicatas
);
```

## Como Funciona

### 1. Carregar Serviços de um Profissional

```typescript
// Busca: "Quais serviços o profissional X tem?"
SELECT service_id FROM professional_services 
WHERE professional_id = 'profissional-uuid'
// Resultado: ['serviço1-uuid', 'serviço2-uuid', 'serviço3-uuid']
```

### 2. Atribuir Serviços a um Profissional

```typescript
// 1º: Deleta TODAS as atribuições antigas
DELETE FROM professional_services 
WHERE professional_id = 'profissional-uuid'

// 2º: Insere as novas atribuições
INSERT INTO professional_services (professional_id, service_id)
VALUES 
  ('profissional-uuid', 'corte-uuid'),
  ('profissional-uuid', 'barba-uuid'),
  ('profissional-uuid', 'tintura-uuid')
```

### 3. Um Serviço Pode Estar em Múltiplos Profissionais

```
Serviço: "Corte"
├── Profissional A ✓
├── Profissional B ✓
└── Profissional C ✓

Profissional A pode ter:
├── Corte
├── Barba
└── Tintura

Profissional B pode ter:
├── Corte
└── Manicure
```

## RLS (Row Level Security)

As políticas garantem que:
- Apenas o proprietário (user) pode ver/modificar os serviços de seus profissionais
- Um usuário não pode atribuir serviços de outro usuário

## Exemplo Prático

**Dados:**
```
Usuário: kitoaiagency@gmail.com
├── Profissional 1: João (Cabeleireiro)
│   └── Serviços: Corte, Barba
├── Profissional 2: Maria (Manicure)
│   └── Serviços: Manicure, Pedicure
└── Profissional 3: Pedro (Barbeiro)
    └── Serviços: Corte, Barba
```

**Tabela `professional_services`:**
```
professional_id      | service_id
─────────────────────┼──────────────────
joão-uuid            | corte-uuid
joão-uuid            | barba-uuid
maria-uuid           | manicure-uuid
maria-uuid           | pedicure-uuid
pedro-uuid           | corte-uuid
pedro-uuid           | barba-uuid
```

Note como:
- "Corte" está atribuído a João e Pedro
- "Barba" está atribuído a João e Pedro
- "Manicure" só está com Maria
- "Pedicure" só está com Maria

## Execução

1. Execute o SQL: `create_professional_services_junction.sql` no Supabase
2. O código automaticamente irá:
   - Carregar os serviços do profissional
   - Permitir atribuir múltiplos serviços
   - Permitir compartilhar serviços entre profissionais

Pronto! Agora você tem uma solução profissional e escalável! 🎯
