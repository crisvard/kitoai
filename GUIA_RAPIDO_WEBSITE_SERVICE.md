# 🚀 GUIA RÁPIDO - Implementar Website Service

## ⏱️ Tempo Estimado: 2 minutos

### Passo 1: Executar SQL no Supabase (1 min)

1. Vá para: `https://app.supabase.com`
2. Selecione seu projeto
3. Clique em **SQL Editor** → **New Query**
4. **Cole** o arquivo: `create_website_services_table.sql`
5. Clique **Run** (ou Ctrl+Enter)

---

### Passo 2: Executar SQL de Profile (30 seg)

1. **Nova Query** (Next Query button)
2. **Cole** o arquivo: `add_website_fields_to_profile.sql`
3. Clique **Run**

---

### Passo 3: Recarregar App (30 seg)

1. Volte para o seu dashboard
2. **Recarregue** a página: `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
3. Pronto! 🎉

---

## ✅ Resultado Esperado

Você verá na dashboard:
- ✅ Nova seção "Serviços de Website"
- ✅ Um card com ícone de globo
- ✅ Botão "Contratar" ou "Gerenciar Sites"

---

## 📍 Onde Está?

| Elemento | Localização |
|----------|------------|
| **Card** | Dashboard → Seção "Serviços de Website" |
| **Página** | `/websites` |
| **Plano** | Dashboard → Planos Disponíveis (R$ 149/mês) |
| **Dados** | Supabase → `website_services` table |

---

## 🧪 Teste Rápido

1. Clique no card "Desenvolvimento de Sites"
2. Clique em "Contratar" (se necessário)
3. Clique em "Gerenciar Sites"
4. Clique em "+ Novo Website"
5. Preencha "Meu Site Legal"
6. Clique em "Adicionar Website"
7. Explore as 4 abas! ✨

---

## 📞 Precisa de Ajuda?

**Erro ao executar SQL?**
- Verifique se tem o banco "Kito Expert" selecionado
- Tente copiar/colar do arquivo `.sql` novamente
- Procure por mensagens de erro em vermelho

**Card não aparece?**
- Recarregue com `Ctrl+F5` (força reload)
- Verifique se tem internet
- Cheque no console (F12) se há erros

**Dados não salvam?**
- Verifique se está autenticado
- Cheque se tem conexão com Supabase
- Tente abrir a aba de Developer (F12) → Console

---

## 📊 O que Você Consegue Fazer

### Aba "Meus Sites"
- ➕ Adicionar novo website
- 🔍 Ver lista com cards
- ✏️ Editar website
- 🗑️ Deletar website

### Aba "Estatísticas"
- 📈 Ver quantos sites você tem
- ✅ Quantos estão ativos
- 🔐 Quantos têm credenciais
- 🔗 Quantos têm GitHub

### Aba "Detalhes"
- 📝 Editar todas as informações
- 🔑 Gerenciar credenciais
- 🏠 Dados de hospedagem
- 💾 Salvar alterações

### Aba "Notas"
- 📱 Adicionar links de redes sociais
- 📸 Adicionar fotos do site
- 📋 Escrever anotações gerais

---

## 🎯 Campos Disponíveis

```
✅ Nome do Website (obrigatório)
✅ Link do Site (https://...)
✅ Email/Login (domínio)
✅ Senha (com botão de mostrar/ocultar)
✅ GitHub (link do repositório)
✅ Hospedagem (provedor, host, plano, conta)
✅ Redes Sociais (múltiplas plataformas)
✅ Fotos do Site (múltiplas imagens)
✅ Notas Gerais (texto livre)
```

---

## 💡 Dicas

- **Senhas**: Não são mostradas por padrão (clique no ícone de olho)
- **Deletar**: Pede confirmação antes de deletar
- **Múltiplos Itens**: Pode adicionar vários em "Redes Sociais" e "Fotos"
- **Editar**: Clique no lápis no card, depois na aba "Detalhes"
- **Salvar**: Botão "Salvar Alterações" em cada aba

---

## 🔐 Dados Protegidos

Todos os seus websites são **100% privados**:
- Ninguém além de você pode ver seus dados
- RLS (Row Level Security) ativo no banco
- Senhas não são visíveis por padrão

---

**Pronto? Vamos lá! 🚀**

Execute as 2 migrations SQL e aproveite!
