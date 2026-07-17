# Guia de Configuração de APIs das Exchanges

Este guia explica como obter as credenciais de API para cada exchange suportada.

## 🔐 Segurança Importante

**NUNCA**:
- Compartilhe suas API keys ou secrets
- Use permissões de saque/withdraw nas suas API keys
- Armazene suas credenciais em locais públicos

**SEMPRE**:
- Use apenas permissões de leitura (Read) e negociação (Trade)
- Configure whitelist de IPs quando disponível
- Ative autenticação de dois fatores (2FA) na sua conta
- Monitore regularmente o uso das suas API keys

---

## 1. 🟡 Binance

### Como obter:

1. Acesse [Binance](https://www.binance.com) e faça login
2. Vá para: **Perfil** → **API Management**
3. Clique em **Create API** ou **Criar Chave API**
4. Digite um nome para a API (ex: "Kito AI Negociações")
5. Complete a verificação de segurança (2FA, email, etc)

### Permissões necessárias:
- ✅ **Enable Reading** (Ativar Leitura)
- ✅ **Enable Spot & Margin Trading** (Ativar Negociação Spot)
- ❌ **Enable Withdrawals** (NÃO ativar saques)

### Dicas:
- Configure IP whitelist se possível
- A Binance exige verificação de identidade (KYC)

**Documentação**: https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072

---

## 2. ⚪ OKEx (OKX)

### Como obter:

1. Acesse [OKX](https://www.okx.com) e faça login
2. Vá para: **Perfil** → **API** → **Create API Key**
3. Digite um nome (ex: "Kito AI")
4. Complete a verificação de segurança

### Permissões necessárias:
- ✅ **Read** (Leitura)
- ✅ **Trade** (Negociação)
- ❌ **Withdraw** (NÃO ativar)

### Dicas:
- OKX permite configurar IP whitelist
- API keys expiram após 90 dias de inatividade

**Documentação**: https://www.okx.com/help-center/changes-to-v5-api-key-creation

---

## 3. 🔵 Bitso

### Como obter:

1. Acesse [Bitso](https://bitso.com) e faça login
2. Vá para: **Configurações** → **API** → **Criar Nova API Key**
3. Digite um nome descritivo
4. Selecione as permissões necessárias

### Permissões necessárias:
- ✅ **Ver Informações da Conta** (View Account Info)
- ✅ **Executar Operações** (Trade)
- ❌ **Retiradas** (NÃO ativar)

### Dicas:
- Bitso é focada em América Latina
- Interface em português disponível
- Requer verificação de identidade

**Documentação**: https://bitso.com/api_info

---

## 4. 🟢 Toro

### Como obter:

1. Acesse [Toro](https://www.toroinvestimentos.com.br) e faça login
2. Vá para: **Configurações** → **Integrações** → **API**
3. Crie uma nova chave de API

### Permissões necessárias:
- ✅ **Leitura de Saldo**
- ✅ **Negociação**
- ❌ **Saque/Transferência** (NÃO ativar)

### Dicas:
- Plataforma brasileira regulamentada pela CVM
- Suporte em português
- KYC obrigatório

**Documentação**: https://developers.toroinvestimentos.com.br

---

## 5. 🟦 Gate.io

### Como obter:

1. Acesse [Gate.io](https://www.gate.io) e faça login
2. Vá para: **API Management** no menu do usuário
3. Clique em **Create API Key**
4. Configure nome e permissões

### Permissões necessárias:
- ✅ **Read Only** (Somente Leitura)
- ✅ **Spot Trading** (Negociação Spot)
- ❌ **Withdrawal** (NÃO ativar)

### Dicas:
- Suporta IP whitelist
- API v4 é a versão recomendada

**Documentação**: https://www.gate.io/docs/developers/apiv4/

---

## 6. 🟨 Bybit

### Como obter:

1. Acesse [Bybit](https://www.bybit.com) e faça login
2. Vá para: **API** → **Create New Key**
3. Escolha tipo: **System-generated API Keys**
4. Configure permissões

### Permissões necessárias:
- ✅ **Read-Write** para Orders
- ✅ **Read-only** para Position e Account
- ❌ **Não ativar Withdraw**

### Dicas:
- Bybit é especializada em derivativos
- Configure IP whitelist obrigatório

**Documentação**: https://bybit-exchange.github.io/docs/

---

## 7. 🔶 MEXC

### Como obter:

1. Acesse [MEXC](https://www.mexc.com) e faça login
2. Vá para: **API Management**
3. Clique em **Create New API**

### Permissões necessárias:
- ✅ **Spot Account Read**
- ✅ **Spot Account Trade**
- ❌ **Withdraw** (NÃO ativar)

### Dicas:
- MEXC lista muitos projetos novos
- API rate limits generosos

**Documentação**: https://mex-spot-api-docs.readthedocs.io/

---

## ⚙️ Testando suas Credenciais

Após obter suas credenciais:

1. Cole a **API Key** no primeiro campo
2. Cole o **API Secret** no segundo campo
3. Clique em **Testar Conexão** para validar
4. Se o teste passar, clique em **Conectar Exchange**

### O que o teste valida:
- ✅ Formato correto das credenciais
- ✅ Conectividade com a exchange
- ✅ Permissões adequadas
- ✅ Autenticação bem-sucedida

---

## 🔒 Armazenamento Seguro

Suas credenciais são:
- **Criptografadas** antes de serem armazenadas
- **Protegidas** por Row Level Security no Supabase
- **Acessíveis** apenas por você através de autenticação
- **Nunca** compartilhadas ou expostas em logs

---

## 🚨 Em Caso de Problemas

### API Key inválida
- Verifique se copiou toda a chave (sem espaços extras)
- Confirme que a API não foi revogada na exchange
- Verifique se o IP está na whitelist (se configurada)

### Erro de permissões
- Confirme que ativou as permissões corretas
- Algumas exchanges levam alguns minutos para ativar novas APIs

### Erro de conexão
- Verifique sua conexão com internet
- Algumas exchanges podem estar em manutenção
- Rate limits podem estar sendo excedidos

---

## 📚 Recursos Adicionais

- [Documentação da Binance API](https://binance-docs.github.io/apidocs/)
- [Documentação da OKX API](https://www.okx.com/docs-v5/)
- [Documentação da Gate.io API](https://www.gate.io/docs/developers/apiv4/)
- [Documentação da Bybit API](https://bybit-exchange.github.io/docs/)

---

**Última atualização**: Fevereiro 2026
