import React, { useState } from 'react';
import { Bot, Save, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { useWhatsAppSetup } from '../../hooks/useWhatsAppSetup';

interface AgentConfig {
  personality: string;
  company_presentation: string;
  company_knowledge: string;
  product_knowledge: string;
}

interface AgentStepProps {
  onComplete: () => void;
}

export const AgentStep: React.FC<AgentStepProps> = ({ onComplete }) => {
  const { saveAgentConfig, loading } = useWhatsAppSetup();
  const [config, setConfig] = useState<AgentConfig>({
    personality: 'Amigável, profissional e prestativo',
    company_presentation: 'Bem-vindo à nossa empresa! Somos especializados em soluções inovadoras.',
    company_knowledge: 'Somos uma empresa dedicada a fornecer soluções de alta qualidade para nossos clientes.',
    product_knowledge: 'Nossos produtos são desenvolvidos com tecnologia de ponta para atender às necessidades do mercado.',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    const result = await saveAgentConfig(config);

    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setSaveStatus('error');
    }
  };

  const updateConfig = (field: keyof AgentConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Bot className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Configuração do Agente IA</h3>
            <p className="text-gray-600">Personalize seu assistente virtual</p>
          </div>
        </div>

        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Sistema Pronto!</p>
              <p className="text-blue-700">
                Sistema de WhatsApp e automação estão configurados. Agora personalize seu agente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-6">
          {/* Personality */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🧠 Personalidade do Agente
            </label>
            <textarea
              value={config.personality}
              onChange={(e) => updateConfig('personality', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Amigável, profissional e prestativo. Sempre busca ajudar o cliente da melhor forma possível."
            />
          </div>

          {/* Company Presentation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👋 Apresentação da Empresa
            </label>
            <textarea
              value={config.company_presentation}
              onChange={(e) => updateConfig('company_presentation', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Bem-vindo à nossa empresa! Somos especializados em soluções inovadoras para seu negócio."
            />
          </div>

          {/* Company Knowledge */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏢 Conhecimento sobre a Empresa
            </label>
            <textarea
              value={config.company_knowledge}
              onChange={(e) => updateConfig('company_knowledge', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Somos uma empresa fundada em 2020, com sede em São Paulo. Atendemos clientes em todo Brasil..."
            />
          </div>

          {/* Product Knowledge */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📦 Conhecimento sobre os Produtos
            </label>
            <textarea
              value={config.product_knowledge}
              onChange={(e) => updateConfig('product_knowledge', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Nossos produtos são desenvolvidos com tecnologia de ponta. Temos soluções para..."
            />
          </div>

          {/* File Upload */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Upload className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Documentos Adicionais (opcional)</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Upload de arquivos PDF, DOC, TXT para enriquecer o conhecimento do agente
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Agente Configurado!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <p className="font-medium text-green-800">Configuração Completa!</p>
              <p className="text-sm text-green-700">
                Seu agente WhatsApp com IA está pronto para uso. As mensagens serão processadas automaticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};