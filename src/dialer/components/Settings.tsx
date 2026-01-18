import React, { useState } from 'react';
import { Save, Eye, EyeOff, Key, Phone } from 'lucide-react';
import { useDialer } from '../contexts/DialerContext';

const Settings: React.FC = () => {
  const { state, dispatch, clearCache } = useDialer();
  const [showApiKeys, setShowApiKeys] = useState({
    bland: false,
    google: false,
  });
  const [formData, setFormData] = useState({
    blandApiKey: state.settings.blandApiKey || '',
    googleSheetsId: state.settings.googleSheetsId || '',
    googleApiKey: state.settings.googleApiKey || '',
    callInterval: state.currentCampaign?.settings.callInterval || 5,
    maxConcurrentCalls: state.currentCampaign?.settings.maxConcurrentCalls || 1,
    retryAttempts: state.currentCampaign?.settings.retryAttempts || 3,
  });

  const handleInputChange = (field: string, value: string | number) => {
    if (typeof value === 'string' && ['callInterval', 'maxConcurrentCalls', 'retryAttempts'].includes(field)) {
      const numValue = parseInt(value);
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveSettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: {
        blandApiKey: formData.blandApiKey,
        googleSheetsId: formData.googleSheetsId,
        googleApiKey: formData.googleApiKey,
      },
    });

    // Create or update campaign with new settings
    const campaignId = 'default-campaign';
    dispatch({
      type: 'ADD_CAMPAIGN',
      campaign: {
        id: campaignId,
        name: 'Campanha Principal',
        status: 'stopped',
        contacts: [],
        completedCalls: 0,
        failedCalls: 0,
        totalCalls: 0,
        settings: {
          callInterval: formData.callInterval,
          maxConcurrentCalls: formData.maxConcurrentCalls,
          retryAttempts: formData.retryAttempts,
        },
      },
    });

    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* API Keys Section */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="w-6 h-6 text-[#c4d82e]" />
          <h2 className="text-xl font-semibold text-white">Chaves de API</h2>
        </div>

        <div className="space-y-6">
          {/* Bland API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key do Bland
            </label>
            <div className="relative">
              <input
                type={showApiKeys.bland ? 'text' : 'password'}
                value={formData.blandApiKey}
                onChange={(e) => handleInputChange('blandApiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys(prev => ({ ...prev, bland: !prev.bland }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showApiKeys.bland ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Google API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key do Google Sheets
            </label>
            <div className="relative">
              <input
                type={showApiKeys.google ? 'text' : 'password'}
                value={formData.googleApiKey}
                onChange={(e) => handleInputChange('googleApiKey', e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys(prev => ({ ...prev, google: !prev.google }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showApiKeys.google ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Google Sheets ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID da Planilha Google Sheets
            </label>
            <input
              type="text"
              value={formData.googleSheetsId}
              onChange={(e) => handleInputChange('googleSheetsId', e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Copie o ID da URL da planilha: https://docs.google.com/spreadsheets/d/[ID_DA_PLANILHA]/edit
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Settings */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Phone className="w-6 h-6 text-[#c4d82e]" />
          <h2 className="text-xl font-semibold text-white">Configurações da Campanha</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Intervalo entre Ligações (segundos)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.callInterval || ''}
              onChange={(e) => handleInputChange('callInterval', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Máximo de Ligações Simultâneas
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxConcurrentCalls || ''}
              onChange={(e) => handleInputChange('maxConcurrentCalls', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tentativas de Ligação
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.retryAttempts || ''}
              onChange={(e) => handleInputChange('retryAttempts', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-3xl p-8">
        <h3 className="text-lg font-medium text-blue-300 mb-3">Instruções de Configuração</h3>
        <div className="space-y-3 text-sm text-blue-200">
          <div>
            <h4 className="font-medium">1. API Key do Bland:</h4>
            <p>Acesse <a href="https://app.bland.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">app.bland.ai</a> → Configurações → API Keys.</p>
            <p className="text-xs mt-1">A API key começa com "sk-" e é usada para autenticação.</p>
          </div>
          <div>
            <h4 className="font-medium">2. Google Sheets API:</h4>
            <p>Ative a Google Sheets API no Google Cloud Console e gere uma API key.</p>
          </div>
          <div>
            <h4 className="font-medium">3. Planilha do Google:</h4>
            <p>Crie uma planilha com as colunas: Nome/Contato, Empresa, Telefone, Setor (opcional), Status (opcional).</p>
            <p className="text-xs mt-1">Importante: A coluna do telefone deve conter apenas números, como: 5519995126321 (o sistema adiciona o + automaticamente)</p>
            <p className="text-xs mt-1">💡 O sistema é inteligente e reconhece variações como "Contato" ou "Nome", "Empresa" ou "Company", etc.</p>
            <p className="text-xs mt-1 font-semibold text-red-400">⚠️ CRUCIAL: Configure a planilha como pública:</p>
            <ol className="text-xs mt-1 text-red-400 list-decimal list-inside">
              <li>Clique em "Compartilhar" (canto superior direito)</li>
              <li>Selecione "Qualquer pessoa com o link pode visualizar"</li>
              <li>Clique em "Copiar link" e depois "Concluído"</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium">4. Configuração da Agente:</h4>
            <p>O sistema está configurado para usar a agente <strong>Isa da K-ZAP</strong> com comportamento específico para vendas de automação de agendamentos.</p>
            <p className="text-xs mt-1 font-semibold text-blue-300">💡 A agente fala em português brasileiro, usa voz feminina (June), e segue um script personalizado para ligações frias focadas em agendamentos via WhatsApp.</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-3xl p-8">
        <h3 className="text-lg font-medium text-white mb-4">Gerenciamento de Dados</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              if (!formData.blandApiKey) {
                alert('Configure a API key do Bland primeiro.');
                return;
              }

              try {
                // Test with a minimal call request to validate API key
                const blandResponse = await fetch('https://api.bland.ai/call', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${formData.blandApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    phone_number: 'invalid', // This will fail but validate the API key
                    agent_id: 'test',
                  }),
                });

                if (blandResponse.status === 400) {
                  // 400 means API key is valid but request data is invalid (expected)
                  alert('✅ Conexão Bland AI bem-sucedida!\nAPI key válida.');
                } else if (blandResponse.status === 401) {
                  throw new Error('API key inválida');
                } else {
                  throw new Error(`Erro ${blandResponse.status}`);
                }
              } catch (error) {
                alert(`❌ Erro na conexão Bland AI: ${error instanceof Error ? error.message : 'Erro desconhecido'}\nVerifique se a API key está correta.`);
              }
            }}
            className="flex items-center space-x-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#c4d82e]/30"
          >
            <Phone className="w-5 h-5" />
            <span>Testar Bland AI</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja limpar todo o cache? Isso removerá configurações e contatos salvos.')) {
                clearCache();
              }
            }}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            <span>🗑️ Limpar Cache</span>
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-3">
          💾 <strong>Dados salvos automaticamente:</strong> Configurações, contatos e estado da campanha são salvos no navegador.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={async () => {
            if (!formData.googleSheetsId || !formData.googleApiKey) {
              alert('Configure o ID da planilha e a API key primeiro.');
              return;
            }

            try {
              const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${formData.googleSheetsId}?key=${formData.googleApiKey}`;
              const response = await fetch(testUrl);

              if (response.ok) {
                const data = await response.json();
                alert(`✅ Conexão bem-sucedida!\nTítulo da planilha: ${data.properties?.title || 'Desconhecido'}`);
              } else {
                throw new Error(`Erro ${response.status}`);
              }
            } catch (error) {
              alert(`❌ Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}\nVerifique se a planilha está pública e as credenciais estão corretas.`);
            }
          }}
          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
        >
          <Key className="w-5 h-5" />
          <span>Testar Google Sheets</span>
        </button>

        <button
          onClick={handleSaveSettings}
          className="flex items-center space-x-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#c4d82e]/30"
        >
          <Save className="w-5 h-5" />
          <span>Salvar Configurações</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;