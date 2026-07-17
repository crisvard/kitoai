# SocialScheduler - Agendador de Redes Sociais (Frontend)

Interface (frontend-only) para criação e visualização de posts agendados.

## 🚀 Funcionalidades

- ✅ **Interface** para criação e organização de posts
- ✅ **Agendamento de posts** com data e hora específicas
- ✅ **Upload de mídia** (imagens e vídeos)
- ✅ **Dashboard** e **Calendário** (UI)
- ✅ **Interface responsiva** em português

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Ícones**: Lucide React
- **Estado**: React Hooks

## 📋 Pré-requisitos

- Node.js 18+

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd kitoai-main
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Execute o projeto
```bash
npm run dev
```

Acesse: http://localhost:5175

## 📱 Funcionalidades do Dashboard

- **Visão geral** (UI) de posts agendados/publicados
- **Calendário visual** (UI)
- **Criação de posts** (UI) com mídia e hashtags

## 🗂️ Estrutura do Projeto

```
src/
├── components/
│   ├── AuthForm.tsx          # Formulário de login/cadastro
│   ├── Dashboard.tsx         # Dashboard principal
│   ├── Settings.tsx          # Configurações e conexões
│   ├── CreatePost.tsx        # Criação de posts
│   ├── Calendar.tsx          # Calendário de agendamentos
│   ├── OAuthCallback.tsx     # Callback OAuth
│   └── Header.tsx            # Cabeçalho da aplicação
├── hooks/
│   ├── useAuth.ts            # Hook de autenticação
│   ├── usePlatformConnections.ts # Hook de conexões sociais
│   └── usePosts.ts           # Hook de gerenciamento de posts
├── lib/
│   └── supabase.ts           # Configuração do Supabase
├── types/
│   └── index.ts              # Definições de tipos
└── utils/
    └── platforms.ts          # Configurações das plataformas
```

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Build para produção
npm run lint     # Executa o linter
npm run preview  # Preview do build
```

## 🚀 Deploy

Para deploy em produção:

1. Build e deploy: `npm run build`

## 📝 Notas Importantes

- Este repositório contém somente o frontend.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de redes sociais**
