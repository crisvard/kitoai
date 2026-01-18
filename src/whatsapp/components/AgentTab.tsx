import React from 'react';
import { Bot, Save, MessageSquare, Settings, Brain, Zap, Thermometer, Building, Package, Mic, MicOff } from 'lucide-react';
import { AIAgent, AppConfig } from '../types';

type AgentType = 'comercial' | 'suporte' | 'cobranca' | 'agendamento';

interface AgentConfig {
  name: string;
  icon: any;
  color: string;
  personality: string;
  company_presentation: string;
  company_knowledge: string;
  product_knowledge: string;
}

interface AgentTabProps {
  config: AppConfig;
  onConfigChange: (updates: Partial<AppConfig>) => void;
  selectedAgent: AgentType;
  agentConfigs: Record<AgentType, AgentConfig>;
}

export const AgentTab: React.FC<AgentTabProps> = ({ config, onConfigChange, selectedAgent, agentConfigs }) => {
  const currentAgentConfig = agentConfigs[selectedAgent];

  const handleAgentChange = (updates: Partial<AIAgent>) => {
    const updatedAgent = { ...config.agent, ...updates };
    onConfigChange({ agent: updatedAgent });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Card - Status and Basic Configuration */}
      <div className="space-y-8">
        {/* Agent Status */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center`}>
              {React.createElement(currentAgentConfig.icon, { className: "w-6 h-6 text-[#c4d82e]" })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Status do Agente - {currentAgentConfig.name}</h3>
              <p className="text-gray-400 text-sm">Configure o agente {currentAgentConfig.name.toLowerCase()} para responder automaticamente</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                config.agent.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`} />
              <span className={`font-semibold ${
                config.agent.enabled ? 'text-green-400' : 'text-gray-400'
              }`}>
                {config.agent.enabled ? 'Ativo' : 'Inativo'}
              </span>
              <span className="text-gray-400 text-sm">
                Modelo: <span className="text-[#c4d82e] font-medium">{config.agent.model}</span>
              </span>
              <span className={`text-sm font-medium ${currentAgentConfig.color}`}>
                Agente: {currentAgentConfig.name}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.agent.enabled}
                onChange={(e) => handleAgentChange({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#c4d82e]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#c4d82e]"></div>
            </label>
          </div>
        </div>

        {/* Basic Configuration */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center`}>
              {React.createElement(currentAgentConfig.icon, { className: "w-6 h-6 text-blue-400" })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Configuração Básica - {currentAgentConfig.name}</h3>
              <p className="text-gray-400 text-sm">Configure as informações específicas do agente {currentAgentConfig.name.toLowerCase()}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Bot className="w-4 h-4" />
                Nome do Agente
              </label>
              <input
                type="text"
                value={config.agent.name}
                onChange={(e) => handleAgentChange({ name: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                placeholder="Nome do seu agente"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Brain className="w-4 h-4" />
                Modelo de IA
              </label>
              <select
                value={config.agent.model}
                onChange={(e) => handleAgentChange({ model: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white focus:border-[#c4d82e] focus:outline-none transition-colors"
              >
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3">Claude-3</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <MessageSquare className="w-4 h-4" />
                Personalidade do Agente
              </label>
              <textarea
                value={config.agent.personality}
                onChange={(e) => handleAgentChange({ personality: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors resize-none"
                placeholder="Ex: Amigável, profissional, paciente..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Card - Advanced Configuration */}
      <div className="space-y-8">
        {/* Advanced Configuration */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl flex items-center justify-center`}>
              {React.createElement(currentAgentConfig.icon, { className: "w-6 h-6 text-purple-400" })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Configuração Avançada - {currentAgentConfig.name}</h3>
              <p className="text-gray-400 text-sm">Ajuste os parâmetros avançados para o agente {currentAgentConfig.name.toLowerCase()}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Apresentação da Empresa */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Building className="w-4 h-4" />
                Apresentação da Empresa
              </label>
              <textarea
                value={config.agent.company_presentation}
                onChange={(e) => handleAgentChange({ company_presentation: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors resize-none"
                placeholder="Ex: Bem-vindo à TechCorp, empresa líder em soluções tecnológicas..."
              />
            </div>

            {/* Conhecimento sobre Empresa */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Building className="w-4 h-4" />
                Conhecimento sobre Empresa
              </label>
              <textarea
                value={config.agent.company_knowledge}
                onChange={(e) => handleAgentChange({ company_knowledge: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors resize-none"
                placeholder="Ex: Somos uma empresa fundada em 2020, especializada em desenvolvimento de software..."
              />
            </div>

            {/* Conhecimento sobre Produto */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Package className="w-4 h-4" />
                Conhecimento sobre Produto
              </label>
              <textarea
                value={config.agent.product_knowledge}
                onChange={(e) => handleAgentChange({ product_knowledge: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors resize-none"
                placeholder="Ex: Nossos produtos incluem aplicações web, mobile e soluções em nuvem..."
              />
            </div>

            {/* Tipo de Resposta */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                {config.agent.response_type === 'voice' ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                Tipo de Resposta
              </label>
              <select
                value={config.agent.response_type}
                onChange={(e) => handleAgentChange({ response_type: e.target.value as 'text' | 'voice' })}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white focus:border-[#c4d82e] focus:outline-none transition-colors"
              >
                <option value="text">Texto</option>
                <option value="voice">Voz (ElevenLabs)</option>
              </select>
            </div>

            {/* API Key ElevenLabs (só mostra se voz estiver selecionado) */}
            {config.agent.response_type === 'voice' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Mic className="w-4 h-4" />
                  API Key ElevenLabs
                </label>
                <input
                  type="password"
                  value={config.agent.elevenlabs_api_key || ''}
                  onChange={(e) => handleAgentChange({ elevenlabs_api_key: e.target.value })}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="Cole sua API key do ElevenLabs"
                />
              </div>
            )}

            {/* Parâmetros de IA */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Thermometer className="w-4 h-4" />
                  Temperatura: <span className="text-[#c4d82e] font-bold">{config.agent.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.agent.temperature}
                  onChange={(e) => handleAgentChange({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mais preciso</span>
                  <span>Mais criativo</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Zap className="w-4 h-4" />
                  Máximo de Tokens
                </label>
                <input
                  type="number"
                  value={config.agent.maxTokens}
                  onChange={(e) => handleAgentChange({ maxTokens: parseInt(e.target.value) })}
                  min="50"
                  max="500"
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white focus:border-[#c4d82e] focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limita o tamanho da resposta
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Configuration */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              // Configurações já são salvas automaticamente via onConfigChange
              // Este botão pode ser usado para feedback visual
            }}
            className="px-8 py-4 bg-[#c4d82e] hover:bg-[#b5c928] text-black font-bold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/30 hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <Save className="w-5 h-5" />
            Salvar Configurações - {currentAgentConfig.name}
          </button>
        </div>
      </div>
    </div>
  );
};
