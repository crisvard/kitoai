import React from 'react';
import { Pause, Play, Square, Settings, Trash2, PhoneCall, Clock, Zap, AlertTriangle, ChevronDown, Loader } from 'lucide-react';
import { Agent } from '../../hooks/useAgents';
import { PhoneNumber } from '../../hooks/usePhoneNumbers';

interface AgentCardProps {
  agent: Agent;
  onStart: () => any;
  onPause: () => any;
  onStop: () => any;
  onConfigure: () => void;
  onDelete: () => void;
  phoneNumbers: PhoneNumber[];
  onPhoneChange: (vapiPhoneId: string | null, displayNumber: string | null) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onStart,
  onPause,
  onStop,
  onConfigure,
  onDelete,
  phoneNumbers,
  onPhoneChange,
}) => {
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await onStart();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActionLoading(true);
    try {
      await onStop();
    } finally {
      setIsActionLoading(false);
    }
  };

  // Calcular porcentagem de uso diário
  const usagePercentage = (agent.minutes_used_today / agent.daily_minutes_limit) * 100;

  // Cor do status
  const getStatusColor = () => {
    switch (agent.status) {
      case 'calling': return 'bg-red-500';
      case 'idle': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'disabled': return 'bg-gray-500';
      case 'error': return 'bg-orange-500';
      case 'scheduled': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (agent.status) {
      case 'calling': return 'Ligando';
      case 'idle': return 'Ocioso';
      case 'paused': return 'Pausado';
      case 'disabled': return 'Desativado';
      case 'error': return 'Erro';
      case 'scheduled': return 'Agendado';
      default: return agent.status;
    }
  };

  // Cor da barra de progresso baseada no uso
  const getProgressBarColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-[#c4d82e]';
  };

  return (
    <div
      className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all duration-300"
      style={{ borderColor: agent.agent_color ? `${agent.agent_color}20` : undefined }}
    >
      {/* Top-right: status + configure */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={onConfigure}
          title="Configurar agente"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
      </div>

      {/* Avatar e Nome */}
      <div className="flex flex-col items-center mb-4">
        {agent.agent_avatar ? (
          <img
            src={agent.agent_avatar}
            alt={agent.agent_name}
            className="w-16 h-16 rounded-full mb-3 border-2"
            style={{ borderColor: agent.agent_color }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full mb-3 flex items-center justify-center text-2xl font-bold text-black"
            style={{ backgroundColor: agent.agent_color }}
          >
            {agent.agent_name.charAt(0).toUpperCase()}
          </div>
        )}

        <h3 className="font-bold text-white text-lg text-center">{agent.agent_name}</h3>
        <span className="text-xs text-gray-400">{getStatusLabel()}</span>
      </div>

      {/* Seletor de Número */}
      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1">
          <PhoneCall className="w-3 h-3" /> Número de telefone
        </label>
        <div className="relative">
          <select
            value={agent.phone_number_provider_id ?? ''}
            onChange={e => {
              const selected = phoneNumbers.find(p => p.vapi_phone_number_id === e.target.value);
              onPhoneChange(selected?.vapi_phone_number_id ?? null, selected?.phone_number ?? null);
            }}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-8 text-sm text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent cursor-pointer"
          >
            <option value="" className="bg-[#2a2a2a] text-gray-400">— Selecionar número —</option>
            {phoneNumbers
              .filter(pn => pn.provider !== 'telnyx')
              .map(pn => {
                const usedByOther = pn.usedByAgentId && pn.usedByAgentId !== agent.id;
                return (
                  <option
                    key={pn.vapi_phone_number_id}
                    value={pn.vapi_phone_number_id}
                    disabled={!!usedByOther}
                    className="bg-[#2a2a2a]"
                  >
                    {pn.phone_number}{pn.nickname ? ` (${pn.nickname})` : ''}{usedByOther ? ` — em uso por ${pn.usedByAgentName}` : ''}
                  </option>
                );
              })}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {!agent.phone_number_provider_id && (
          <p className="flex items-center gap-1 text-xs text-yellow-400 mt-1.5">
            <AlertTriangle className="w-3 h-3" /> Configure um número para iniciar ligações
          </p>
        )}
      </div>

      {/* Estatísticas */}
      <div className="space-y-3 mb-4">
        {/* Minutos Usados */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c4d82e]" />
              <span className="text-sm text-gray-300">Minutos Hoje</span>
            </div>
            <span className="text-sm font-bold text-white">
              {Math.round(agent.minutes_used_today)}/{agent.daily_minutes_limit}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`${getProgressBarColor()} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Ligações Feitas */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Ligações</span>
            </div>
            <span className="text-sm font-bold text-white">
              {agent.calls_made_today}
            </span>
          </div>
        </div>

        {/* Saldo Alocado Restante */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Saldo Agente</span>
            </div>
            <span className={`text-sm font-bold ${agent.allocated_credits > 0 ? 'text-white' : 'text-red-400'}`}>
              {Number(agent.allocated_credits ?? 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Taxa de Sucesso */}
        {agent.total_calls_made > 0 && (
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Taxa Sucesso</span>
              <span className="text-sm font-bold text-green-400">
                {agent.success_rate.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Controle */}
      <div className="flex gap-2 mb-3">
        {(agent.status !== 'calling' && agent.status !== 'scheduled') ? (
          <button
            onClick={handleStart}
            disabled={(Number(agent.allocated_credits) || 0) <= 0 || agent.minutes_used_today >= agent.daily_minutes_limit || !agent.phone_number_provider_id || isActionLoading}
            title={!agent.phone_number_provider_id ? 'Configure um número de telefone primeiro' : (Number(agent.allocated_credits) || 0) <= 0 ? 'Agente sem saldo de créditos' : undefined}
            className="w-full flex items-center justify-center gap-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed py-2.5 px-3 rounded-xl transition-all text-sm font-semibold"
          >
            {isActionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isActionLoading ? 'Iniciando...' : 'Iniciar Ligações'}
          </button>
        ) : null}

        {agent.status === 'scheduled' ? (
          <div className="w-full text-center py-2.5 px-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-semibold flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {agent.scheduled_at ? `Agendado para ${new Date(agent.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Agendado'}
          </div>
        ) : null}

        {agent.status === 'calling' ? (
          <button
            onClick={handleStop}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-3 rounded-xl transition-all text-sm font-semibold"
          >
            {isActionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            {isActionLoading ? 'Parando...' : 'Parar Ligações'}
          </button>
        ) : null}
      </div>

      {/* Botões de Ação — só Delete */}
      <div className="flex justify-end mt-3">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 px-3 rounded-lg transition-all text-xs"
        >
          <Trash2 className="w-3 h-3" />
          Deletar
        </button>
      </div>

      {/* Alertas */}
      {agent.allocated_credits <= 0 ? (
        <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded-xl p-2">
          <p className="text-xs text-red-400 text-center font-semibold">
            ⚠️ Agente sem saldo! Recarregue.
          </p>
        </div>
      ) : agent.minutes_used_today >= agent.daily_minutes_limit ? (
        <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded-xl p-2">
          <p className="text-xs text-red-400 text-center font-semibold">
            ⚠️ Limite diário atingido!
          </p>
        </div>
      ) : null}

      {/* Indicador de Limite Próximo */}
      {usagePercentage >= 80 && usagePercentage < 100 && (
        <div className="mt-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-2">
          <p className="text-xs text-yellow-400 text-center font-semibold">
            ⚡ Próximo do limite diário
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentCard;
