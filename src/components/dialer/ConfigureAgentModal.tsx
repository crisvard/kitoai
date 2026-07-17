import React, { useState, useEffect } from 'react';
import { X, Loader, Save, Phone, ExternalLink, AlertCircle, RefreshCw, CheckCircle, ListTodo, Settings } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { usePhoneNumbers } from '../../hooks/usePhoneNumbers';
import { useUserProfile } from '../../hooks/useUserProfile';
import AgentContactsPanel from './AgentContactsPanel';

interface ConfigureAgentModalProps {
  agentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ConfigureAgentModal: React.FC<ConfigureAgentModalProps> = ({ agentId, onClose, onSuccess }) => {
  const { agents, updateAgent, startAgent, stopAgent, allocateCredits } = useAgents();
  const { phoneNumbers, getUsedPhoneIds, fetchVapiNumbers, importVapiNumber, loadPhoneNumbers } = usePhoneNumbers();
  const { profile, refreshProfile } = useUserProfile();
  const userCredits = profile?.credits ?? 0;

  // IDs já usados por OUTROS agentes (excluindo o atual)
  const usedPhoneIds = getUsedPhoneIds(agentId);
  const [activeTab, setActiveTab] = useState<'config' | 'contacts'>('config');
  const [loading, setLoading] = useState(false);
  const [syncingVapi, setSyncingVapi] = useState(false);
  const [settingUpCalcom, setSettingUpCalcom] = useState(false);
  const [calcomLogs, setCalcomLogs] = useState<{ time: string; type: 'info' | 'ok' | 'error'; msg: string }[]>([]);
  const [addingCredits, setAddingCredits] = useState(false);
  const [additionalCredits, setAdditionalCredits] = useState(10);
  const [syncingNumbers, setSyncingNumbers] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_color: '#c4d82e',
    first_message: '',
    system_prompt: '',
    voice_id: '',
    llm_model: '',
    temperature: 0.7,
    daily_minutes_limit: 150,
    phone_number: '',
    phone_number_provider_id: '',
  });

  const agent = agents.find(a => a.id === agentId);

  useEffect(() => {
    if (agent) {
      setFormData({
        agent_name: agent.agent_name,
        agent_color: agent.agent_color,
        first_message: agent.first_message ?? 'Olá! Aqui é o Kito, agente de IA da Kito Expert. Com quem eu tenho o prazer de falar?',
        system_prompt: agent.system_prompt,
        voice_id: agent.voice_id,
        llm_model: agent.llm_model,
        temperature: agent.temperature,
        daily_minutes_limit: agent.daily_minutes_limit,
        phone_number: agent.phone_number ?? '',
        phone_number_provider_id: agent.phone_number_provider_id ?? '',
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateAgent(agentId, formData);
      onSuccess();
    } catch (error: any) {
      alert(`Erro ao atualizar agente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Busca números direto da VAPI — limpa lista local e reimporta tudo
  const syncNumbersFromVapi = async () => {
    setSyncingNumbers(true);
    try {
      // 1. Limpar todos os números locais deste usuário
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('user_phone_numbers')
          .delete()
          .eq('user_id', session.user.id);
      }
      // Limpar seleção atual do form
      setFormData(f => ({ ...f, phone_number_provider_id: '', phone_number: '' }));

      // 2. Buscar todos os números da VAPI e importar
      const vapiNumbers = await fetchVapiNumbers();
      for (const num of vapiNumbers) {
        await importVapiNumber(num);
      }
      await loadPhoneNumbers();
      alert(`${vapiNumbers.length} número(s) sincronizado(s) da VAPI!`);
    } catch (err: any) {
      alert(`Erro ao buscar números da VAPI: ${err.message}`);
    } finally {
      setSyncingNumbers(false);
    }
  };

  const forceVapiSync = async () => {
    if (!agent) return;
    setSyncingVapi(true);
    try {
      // Forcing update with current data to trigger edge function sync and repair
      await updateAgent(agentId, formData);
      alert('Sincronização com VAPI concluída com sucesso!');
    } catch (err: any) {
      alert(`Falha ao sincronizar com VAPI: ${err.message}`);
    } finally {
      setSyncingVapi(false);
    }
  };

  const setupCalcomTools = async () => {
    if (!agent?.agent_provider_id) {
      setCalcomLogs([{ time: now(), type: 'error', msg: 'Agente não sincronizado com VAPI. Salve as configurações primeiro.' }]);
      return;
    }
    const log = (type: 'info' | 'ok' | 'error', msg: string) => {
      setCalcomLogs(prev => [...prev, { time: now(), type, msg }]);
    };
    setCalcomLogs([]);
    setSettingUpCalcom(true);
    try {
      log('info', `Iniciando configuração Cal.com para agente VAPI: ${agent.agent_provider_id}`);
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hedxxbsieoazrmbayzab.supabase.co';
      log('info', `Chamando Edge Function: setup-calcom-tools`);
      log('info', `Payload: { agentId: "${agentId}" }`);

      const res = await fetch(`${supabaseUrl}/functions/v1/setup-calcom-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ agentId })
      });

      log('info', `HTTP Status: ${res.status}`);
      const data = await res.json();
      console.log('[setup-calcom-tools] Response:', data);

      if (!res.ok || !data.success) {
        const errMsg = data.details || data.error || JSON.stringify(data);
        log('error', `Falhou: ${errMsg}`);
        return;
      }

      // Show registered tool IDs
      if (data.toolIds) {
        log('ok', `check_availability toolId: ${data.toolIds.checkAvailability || 'N/A'}`);
        log('ok', `book_appointment toolId:   ${data.toolIds.bookAppointment || 'N/A'}`);
      }
      if (data.patch) {
        const patch = data.patch;
        log('info', `VAPI PATCH status: ${patch.status}`);
        const modelIds = patch.result?.model?.toolIds || patch.result?.toolIds || [];
        if (modelIds.length > 0) {
          log('ok', `toolIds aplicados no assistente: [${modelIds.join(', ')}]`);
        } else {
          log('info', 'toolIds: não retornados na resposta do PATCH');
        }
        if (patch.promptUpdated) {
          log('ok', `System prompt atualizado com data: ${new Date().toLocaleDateString('pt-BR')}`);
        }
        if (patch.serverMessagesUpdated) {
          log('ok', 'serverMessages configurados (inclui tool-calls)');
        }
      }
      log('ok', '✅ Cal.com configurado! O agente já pode agendar.');
    } catch (err: any) {
      setCalcomLogs(prev => [...prev, { time: now(), type: 'error', msg: `Exceção: ${err.message}` }]);
    } finally {
      setSettingUpCalcom(false);
    }
  };

  const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (!agent) {
    return null;
  }

  const predefinedColors = [
    '#c4d82e', '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Configurar Agente</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-400">{agent.agent_name}</p>
              {agent.agent_provider_id ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg border bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle className="w-3 h-3" />
                  VAPI Sincronizado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded-lg border border-red-500/20">
                  <AlertCircle className="w-3 h-3" /> VAPI Não Sincronizado
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'config'
              ? 'border-[#c4d82e] text-[#c4d82e]'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Settings className="w-4 h-4" /> Configurações Gerais
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'contacts'
              ? 'border-[#c4d82e] text-[#c4d82e]'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <ListTodo className="w-4 h-4" /> Lista de Contatos
          </button>
        </div>

        {/* Form Configurações */}
        {activeTab === 'config' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Estatísticas Atuais */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Total Ligações</p>
                <p className="text-lg font-bold text-white">{agent.total_calls_made}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Minutos Totais</p>
                <p className="text-lg font-bold text-white">{Math.round(agent.total_minutes_used)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Taxa Sucesso</p>
                <p className="text-lg font-bold text-green-400">{agent.success_rate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Créditos Gastos</p>
                <p className="text-lg font-bold text-yellow-400">{Math.round(agent.total_credits_spent)}</p>
              </div>
            </div>

            {/* Nome do Agente */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Agente *
              </label>
              <input
                type="text"
                value={formData.agent_name}
                onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
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

            {/* Primeira Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primeira Mensagem (o que o agente fala ao atender)
              </label>
              <textarea
                value={formData.first_message}
                onChange={(e) => setFormData({ ...formData, first_message: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent resize-none"
                placeholder="Ex: Olá! Aqui é o Kito, agente de IA da Kito Expert. Com quem falo?"
              />
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
                required
              />
            </div>

            {/* Configurações de Voz e LLM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voz do Agente (ElevenLabs)
                </label>
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
                    {formData.voice_id && !['21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlS6', 'jsCqWAovK2LkecY7zXl4', 'jBpfuIE2acCO8z3wKNLl', 'EXAVITQu4vr4xnSDxMaL', 'GBv7mTt0atIp3Br8iCZE', 'pNInz6obpgDQGcFmaJgB', 'ErXwobaYiN019PkySvjV', 'custom'].includes(formData.voice_id) && (
                      <option value={formData.voice_id}>{formData.voice_id} (Atual)</option>
                    )}
                  </optgroup>
                </select>
                {(formData.voice_id === 'custom' || (formData.voice_id && !['21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlS6', 'jsCqWAovK2LkecY7zXl4', 'jBpfuIE2acCO8z3wKNLl', 'EXAVITQu4vr4xnSDxMaL', 'GBv7mTt0atIp3Br8iCZE', 'pNInz6obpgDQGcFmaJgB', 'ErXwobaYiN019PkySvjV'].includes(formData.voice_id))) && (
                  <input
                    type="text"
                    value={formData.voice_id === 'custom' ? '' : formData.voice_id}
                    placeholder="Cole o Voice ID do ElevenLabs"
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                    onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  />
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  Padrão: Rachel (ID: 21m00Tcm4TlvDq8ikWAM). Mais no <a href="https://elevenlabs.io/voice-lab" target="_blank" rel="noreferrer" className="underline">ElevenLabs Voice Lab</a>
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
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperatura: {formData.temperature}
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
            </div>

            {/* Créditos e Limites */}
            <div className="bg-[#1a1a1a]/50 p-4 border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">
                  Créditos e Limites
                </label>
                <div className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 flex items-center gap-1 pr-3">
                  Seu Saldo Global: <span className="font-bold text-white">{userCredits}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Saldo Isolado do Agente */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Saldo Atual do Agente</p>
                  <p className="text-2xl font-bold text-[#c4d82e] mb-3">{Number(agent.allocated_credits ?? 0).toFixed(1)} <span className="text-sm text-gray-400">créditos</span></p>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max={userCredits}
                      value={additionalCredits}
                      onChange={(e) => setAdditionalCredits(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-[#c4d82e]"
                    />
                    <button
                      type="button"
                      disabled={addingCredits || additionalCredits <= 0 || additionalCredits > userCredits}
                      onClick={async () => {
                        try {
                          setAddingCredits(true);
                          await allocateCredits(agentId, additionalCredits);
                          refreshProfile();
                          window.dispatchEvent(new Event('kito_refresh_agents'));
                          alert('Créditos transferidos com sucesso!');
                        } catch (e: any) {
                          alert(`Erro: ${e.message}`);
                        } finally {
                          setAddingCredits(false);
                        }
                      }}
                      className="whitespace-nowrap px-3 py-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black text-sm font-bold rounded-lg disabled:opacity-50 flex items-center gap-1"
                    >
                      {addingCredits ? <Loader className="w-3 h-3 animate-spin" /> : 'Recarregar'}
                    </button>
                  </div>
                </div>

                {/* Limite Diário */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-center">
                  <label className="text-xs text-gray-400 mb-1">Limite Diário Físico (Minutos)</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={formData.daily_minutes_limit}
                    onChange={(e) => setFormData({ ...formData, daily_minutes_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-[#c4d82e]"
                  />
                  <p className="text-[10px] text-gray-500 mt-3">Gasto Hoje: {Math.round(agent.minutes_used_today)} / {agent.daily_minutes_limit} min</p>
                </div>
              </div>
            </div>

            {/* Número de Telefone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#c4d82e]" />
                  Número de Telefone
                </label>
                <button
                  type="button"
                  onClick={syncNumbersFromVapi}
                  disabled={syncingNumbers}
                  title="Buscar números da conta VAPI"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingNumbers ? 'animate-spin' : ''}`} />
                  {syncingNumbers ? 'Buscando...' : 'Buscar da VAPI'}
                </button>
              </div>

              {phoneNumbers.length === 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-300 font-medium">Nenhum número cadastrado</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Cadastre um número de telefone na tela principal da Central de Ligações (botão "Números") para poder iniciar chamadas.
                    </p>
                    <a
                      href="https://dashboard.vapi.ai/phone-numbers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#c4d82e] underline inline-flex items-center gap-1 mt-2"
                    >
                      Ver números no VAPI <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    value={formData.phone_number_provider_id}
                    onChange={e => {
                      const selected = phoneNumbers.find(p => p.vapi_phone_number_id === e.target.value);
                      setFormData(f => ({
                        ...f,
                        phone_number_provider_id: e.target.value,
                        phone_number: selected?.phone_number ?? '',
                      }));
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  >
                    <option value="">— Sem número configurado —</option>
                    {phoneNumbers
                      .filter(pn => pn.provider !== 'telnyx')
                      .map(pn => {
                        const inUse = usedPhoneIds.has(pn.vapi_phone_number_id);
                        return (
                          <option
                            key={pn.id}
                            value={pn.vapi_phone_number_id}
                            disabled={inUse}
                          >
                            {pn.phone_number}{pn.nickname ? ` — ${pn.nickname}` : ''} ({pn.provider}){inUse ? ` ✗ Em uso por ${pn.usedByAgentName ?? 'outro agente'}` : ''}
                          </option>
                        );
                      })}
                  </select>
                  {!formData.phone_number_provider_id && (
                    <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Sem número, este agente não conseguirá fazer ligações outbound.
                    </p>
                  )}
                  {formData.phone_number_provider_id && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ Cada agente precisa de um número exclusivo. Este número ficará reservado para este agente.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* VAPI Troubleshooting & Repair */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${agent.agent_provider_id ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'}`}>
              <div>
                <p className={`text-sm font-bold flex items-center gap-2 ${agent.agent_provider_id ? 'text-gray-300' : 'text-red-400'}`}>
                  {agent.agent_provider_id ? <CheckCircle className="w-4 h-4 text-[#c4d82e]" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                  {agent.agent_provider_id ? 'Configuração VAPI Ativa' : 'Falha de Sincronização VAPI'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {agent.agent_provider_id
                    ? 'Se o agente não estiver respondendo, use o botão de reparo para restaurar as configurações.'
                    : 'Este agente não foi registrado com sucesso na VAPI e não vai funcionar.'}
                </p>
              </div>
              <button
                type="button"
                onClick={forceVapiSync}
                disabled={syncingVapi}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-lg text-xs flex gap-2 items-center transition-all"
              >
                {syncingVapi ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {agent.agent_provider_id ? 'Reparar Configurações' : 'Tentar Sincronizar'}
              </button>
            </div>

            {/* Cal.com + Action Buttons */}
            <div className="pt-4 border-t border-white/10 mt-6 space-y-3">
              {/* Cal.com setup button */}
              {agent?.agent_provider_id && (
                <button
                  type="button"
                  onClick={setupCalcomTools}
                  disabled={settingUpCalcom}
                  className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {settingUpCalcom ? (
                    <><Loader className="w-5 h-5 animate-spin" />Configurando Cal.com...</>
                  ) : (
                    <><RefreshCw className="w-5 h-5" />Configurar Cal.com no Agente</>
                  )}
                </button>
              )}

              {/* Cal.com Logs Panel */}
              {calcomLogs.length > 0 && (
                <div className="mt-3 bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono max-h-48 overflow-y-auto space-y-1">
                  <div className="text-white/40 mb-2 text-[10px] uppercase tracking-wider">Log de configuração Cal.com</div>
                  {calcomLogs.map((l, i) => (
                    <div key={i} className={`flex gap-2 ${l.type === 'ok' ? 'text-green-400' : l.type === 'error' ? 'text-red-400' : 'text-white/60'}`}>
                      <span className="text-white/30 shrink-0">{l.time}</span>
                      <span>{l.type === 'ok' ? '✓' : l.type === 'error' ? '✗' : '›'}</span>
                      <span className="break-all">{l.msg}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cancelar + Salvar */}
              <div className="flex gap-3">
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
                  className="flex-1 px-6 py-3 bg-[#c4d82e] hover:bg-[#b5c928] text-black rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader className="w-5 h-5 animate-spin" />Salvando...</>
                  ) : (
                    <><Save className="w-5 h-5" />Salvar Alterações</>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Lista de Contatos */}
        {activeTab === 'contacts' && (
          <div className="p-6">
            <AgentContactsPanel
              agentId={agentId}
              agentStatus={agent?.status}
              scheduledAt={agent?.scheduled_at}
              onStart={async () => {
                if (agent) {
                  await startAgent(agentId);
                }
              }}
              onStop={async () => {
                if (agent) {
                  await stopAgent(agentId);
                }
              }}
              onSchedule={async (dateTime) => {
                if (agent) {
                  await updateAgent(agentId, { status: 'scheduled', scheduled_at: dateTime });
                  window.dispatchEvent(new Event('kito_refresh_agents'));
                }
              }}
              onCancelSchedule={async () => {
                if (agent) {
                  await updateAgent(agentId, { status: 'idle', scheduled_at: undefined });
                  window.dispatchEvent(new Event('kito_refresh_agents'));
                }
              }}
            />
          </div>
        )}
      </div>
    </div >
  );
};

export default ConfigureAgentModal;