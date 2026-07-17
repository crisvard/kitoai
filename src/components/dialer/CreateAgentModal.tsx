import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { useUserProfile } from '../../hooks/useUserProfile';

interface CreateAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ onClose, onSuccess }) => {
  const { createAgent } = useAgents();
  const { profile } = useUserProfile();
  const userCredits = profile?.credits ?? 0;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_color: '#c4d82e',
    system_prompt: `Você é Isabela, uma agente de vendas simpática e experiente da Agente Zap, especializada em ligações frias para promover nosso agente de atendimento automatizado. Seu objetivo é entender o negócio do prospect, identificar dores com agendamentos manuais, oferecer o Agente Zap de forma personalizada, contornar objeções e fechar vendas ou agendamentos de demonstração.`,
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    llm_model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    daily_minutes_limit: 150,
    initial_credits: 50,
    provider: 'vapi' as 'vapi' | 'telnyx'
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.initial_credits > userCredits) {
      alert(`Você não tem saldo global suficiente! (Seu saldo: ${userCredits})`);
      return;
    }

    setLoading(true);

    try {
      await createAgent(formData);
      onSuccess();
    } catch (error: any) {
      alert(`Erro ao criar agente: ${error.message}`);
      setLoading(false);
    }
  };

  const predefinedColors = [
    '#c4d82e', '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Criar Novo Agente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">


          {/* Nome do Agente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Agente *
            </label>
            <input
              type="text"
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              placeholder="Ex: Isabela, João, Maria..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              required
            />
          </div>

          {/* Cor do Agente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor do Agente
            </label>
            <div className="flex gap-3 flex-wrap">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, agent_color: color })}
                  className={`w-10 h-10 rounded-full transition-all ${formData.agent_color === color ? 'ring-2 ring-white scale-110' : ''
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.agent_color}
                onChange={(e) => setFormData({ ...formData, agent_color: e.target.value })}
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Prompt do Sistema */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prompt do Sistema (Personalidade) *
            </label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent resize-none"
              placeholder="Descreva como o agente deve se comportar..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Defina a personalidade, objetivo e estilo de comunicação do agente
            </p>
          </div>

          {/* Configurações de Voz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {formData.provider === 'telnyx' ? 'Voz (Telnyx)' : 'Voice ID (ElevenLabs)'}
              </label>
              {formData.provider === 'telnyx' ? (
                <select
                  value={formData.voice_id}
                  onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                >
                  <option value="AWS.Polly.Vitoria-Neural">Vitória (PT-BR Feminina)</option>
                  <option value="AWS.Polly.Camila-Neural">Camila (PT-BR Feminina)</option>
                  <option value="AWS.Polly.Ricardo-Neural">Ricardo (PT-BR Masculino)</option>
                  <option value="AWS.Polly.Thiago-Neural">Thiago (PT-BR Masculino)</option>
                </select>
              ) : (
                <div className="space-y-2">
                  <select
                    value={formData.voice_id}
                    onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  >
                    <optgroup label="Femininas (PT-BR)">
                      <option value="21m00Tcm4TlvDq8ikWAM">Isabela (Jovem e Animada)</option>
                      <option value="AZnzlk1XvdvUeBnXmlS6">Maria (Madura e Profissional)</option>
                      <option value="jsCqWAovK2LkecY7zXl4">Camila (Calma e Atenciosa)</option>
                      <option value="jBpfuIE2acCO8z3wKNLl">Letícia (Entusiasmada)</option>
                    </optgroup>
                    <optgroup label="Masculinas (PT-BR)">
                      <option value="EXAVITQu4vr4xnSDxMaL">João (Profissional)</option>
                      <option value="GBv7mTt0atIp3Br8iCZE">Ricardo (Sério e Grave)</option>
                      <option value="pNInz6obpgDQGcFmaJgB">Thiago (Amigável e Direto)</option>
                      <option value="ErXwobaYiN019PkySvjV">Pedro (Jovem e Descontraído)</option>
                    </optgroup>
                    <optgroup label="Outras">
                      <option value="custom">-- Usar ID Customizado --</option>
                    </optgroup>
                  </select>
                  {formData.voice_id === 'custom' && (
                    <input
                      type="text"
                      placeholder="Cole o Voice ID do ElevenLabs"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                      onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                    />
                  )}
                </div>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                {formData.provider === 'telnyx' ? 'Voz nativa Telnyx (latência ultra-baixa)' : 'ID da voz no ElevenLabs (padrão: Rachel ID: 21m00Tcm4TlvDq8ikWAM)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modelo LLM
              </label>
              <select
                value={formData.llm_model}
                onChange={(e) => setFormData({ ...formData, llm_model: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                {formData.provider === 'telnyx' ? (
                  <>
                    <option value="anthropic/claude-haiku-4-5">Claude Haiku 4.5 (Nativo / Mais Barato)</option>
                    <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet (Nativo / Maior QI)</option>
                    <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    <option value="openai/gpt-4o">GPT-4o</option>
                  </>
                ) : (
                  <>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recomendado)</option>
                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Mais Rápido)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperatura (Criatividade): {formData.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Mais preciso</span>
              <span>Mais criativo</span>
            </div>
          </div>

          {/* Limite Diário e Créditos Iniciais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limite Diário de Uso (Min)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={formData.daily_minutes_limit}
                onChange={(e) => setFormData({ ...formData, daily_minutes_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limite físico diário da plataforma.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Créditos Iniciais (Transferir)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max={userCredits}
                  value={formData.initial_credits}
                  onChange={(e) => setFormData({ ...formData, initial_credits: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Desconta do seu saldo global: <strong className="text-white">{userCredits}</strong>
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${formData.provider === 'telnyx'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-[#c4d82e] hover:bg-[#b5c928] text-black'
                }`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                `Criar Agente ${formData.provider === 'telnyx' ? 'Telnyx' : 'VAPI'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgentModal;
