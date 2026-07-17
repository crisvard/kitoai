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

## Configuração do Supabase

1. Crie um arquivo `.env.local` (ou `.env`) na raiz do projeto.
2. Copie os valores a partir de `.env.example` e preencha com os seus dados do Supabase:

```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

3. Reinicie o servidor de desenvolvimento (`npm run dev`).

Observação: o projeto usa `import.meta.env.VITE_*`, portanto é necessário reiniciar o dev server após alterar variáveis de ambiente.

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
