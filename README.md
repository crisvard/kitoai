# Kito Expert Dashboard

Sistema completo de gerenciamento de agências e profissionais, com módulos para marketing digital, WhatsApp, ligações e websites.

## Funcionalidades

- **Marketing Digital**: Agendamento de posts para múltiplas plataformas sociais usando Upload-Post API
- **WhatsApp Business**: Integração com WhatsApp API
- **Ligações**: Sistema de discagem automática
- **Websites**: Criação e gerenciamento de sites

## Configuração da API Upload-Post

1. Obtenha sua API Key em https://docs.upload-post.com/landing
2. Adicione ao arquivo `.env`:
   ```
   VITE_UPLOAD_POST_API_KEY=your_api_key_here
   VITE_UPLOAD_POST_BASE_URL=https://api.upload-post.com
   VITE_USE_MOCK_API=true
   ```
3. As funções de agendamento usarão automaticamente a API para posts reais.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Status da Integração Upload-Post

- ✅ Configuração da API
- ✅ Upload de mídia
- ✅ Agendamento de posts
- ✅ Consulta de status em tempo real
- ✅ UI atualizada com status
- ✅ Armazenamento local (localStorage) para posts
- 🔄 Integração com Supabase (opcional futura)

## Como Testar

1. Configure a API Key no `.env`:
   ```
   VITE_UPLOAD_POST_API_KEY=your_api_key_here
   VITE_USE_MOCK_API=true
   ```

2. Teste a API diretamente: `npm run test-api`

3. Inicie o app: `npm run dev`

4. Acesse Marketing > Criar Post

5. Preencha os dados e agende

6. Veja o status sendo atualizado automaticamente no Dashboard

7. Use Settings > Debug para limpar posts de teste
