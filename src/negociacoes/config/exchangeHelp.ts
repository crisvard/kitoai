export const EXCHANGE_HELP = {
  Binance: {
    steps: [
      'Acesse Binance.com e faça login',
      'Vá para: Perfil → API Management',
      'Clique em "Create API" ou "Criar Chave API"',
      'Digite um nome (ex: "Kito AI")',
      'Complete a verificação de segurança (2FA)',
      'Ative: Enable Reading + Enable Spot Trading',
      'NÃO ative: Enable Withdrawals',
    ],
    permissions: [
      { name: 'Enable Reading', required: true },
      { name: 'Enable Spot & Margin Trading', required: true },
      { name: 'Enable Withdrawals', required: false },
    ],
    docs: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072',
  },
  OKEx: {
    steps: [
      'Acesse OKX.com e faça login',
      'Vá para: Perfil → API → Create API Key',
      'Digite um nome descritivo',
      'Complete a verificação de segurança',
      'Selecione permissões: Read + Trade',
      'NÃO ative: Withdraw',
    ],
    permissions: [
      { name: 'Read', required: true },
      { name: 'Trade', required: true },
      { name: 'Withdraw', required: false },
    ],
    docs: 'https://www.okx.com/help-center/changes-to-v5-api-key-creation',
  },
  Bitso: {
    steps: [
      'Acesse Bitso.com e faça login',
      'Vá para: Configurações → API',
      'Clique em "Criar Nova API Key"',
      'Digite um nome descritivo',
      'Selecione permissões necessárias',
      'NÃO ative: Retiradas',
    ],
    permissions: [
      { name: 'Ver Informações da Conta', required: true },
      { name: 'Executar Operações', required: true },
      { name: 'Retiradas', required: false },
    ],
    docs: 'https://bitso.com/api_info',
  },
  Toro: {
    steps: [
      'Acesse Toro Investimentos e faça login',
      'Vá para: Configurações → Integrações → API',
      'Crie uma nova chave de API',
      'Configure permissões de leitura e negociação',
      'NÃO ative: Saque/Transferência',
    ],
    permissions: [
      { name: 'Leitura de Saldo', required: true },
      { name: 'Negociação', required: true },
      { name: 'Saque/Transferência', required: false },
    ],
    docs: 'https://developers.toroinvestimentos.com.br',
  },
  'Gate.io': {
    steps: [
      'Acesse Gate.io e faça login',
      'Vá para: API Management',
      'Clique em "Create API Key"',
      'Configure nome e permissões',
      'Ative: Read Only + Spot Trading',
      'NÃO ative: Withdrawal',
    ],
    permissions: [
      { name: 'Read Only', required: true },
      { name: 'Spot Trading', required: true },
      { name: 'Withdrawal', required: false },
    ],
    docs: 'https://www.gate.io/docs/developers/apiv4/',
  },
  Bybit: {
    steps: [
      'Acesse Bybit.com e faça login',
      'Vá para: API → Create New Key',
      'Escolha "System-generated API Keys"',
      'Configure permissões',
      'Ative: Read-Write para Orders',
      'NÃO ative: Withdraw',
      'Configure IP whitelist (obrigatório)',
    ],
    permissions: [
      { name: 'Read-Write Orders', required: true },
      { name: 'Read-only Position/Account', required: true },
      { name: 'Withdraw', required: false },
    ],
    docs: 'https://bybit-exchange.github.io/docs/',
  },
  MEXC: {
    steps: [
      'Acesse MEXC.com e faça login',
      'Vá para: API Management',
      'Clique em "Create New API"',
      'Configure nome e permissões',
      'Ative: Spot Account Read + Trade',
      'NÃO ative: Withdraw',
    ],
    permissions: [
      { name: 'Spot Account Read', required: true },
      { name: 'Spot Account Trade', required: true },
      { name: 'Withdraw', required: false },
    ],
    docs: 'https://mex-spot-api-docs.readthedocs.io/',
  },
};

export function getExchangeHelp(exchangeName: string) {
  return EXCHANGE_HELP[exchangeName as keyof typeof EXCHANGE_HELP] || null;
}
