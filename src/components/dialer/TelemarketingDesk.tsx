import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Zap, TrendingUp, Phone, Clock, ArrowLeft, PhoneCall, LayoutGrid, CreditCard, CheckCircle, Lock, Search, Building2, Eye, EyeOff, Download, RefreshCw, Loader } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { useUserProfile } from '../../hooks/useUserProfile';
import { usePhoneNumbers } from '../../hooks/usePhoneNumbers';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AgentCard from './AgentCard';
import CreateAgentModal from './CreateAgentModal';
import ConfigureAgentModal from './ConfigureAgentModal';
import PhoneNumberModal from './PhoneNumberModal';
import DialerCreditCheckoutModal from './DialerCreditCheckoutModal';

interface TelemarketingDeskProps {
  onBack?: () => void;
}

const TelemarketingDesk: React.FC<TelemarketingDeskProps> = ({ onBack }) => {
  const { agents, loading, startAgent, pauseAgent, stopAgent, deleteAgent, updateAgent } = useAgents();
  const { profile, refreshProfile } = useUserProfile();
  const { phoneNumbers } = usePhoneNumbers();
  const { user } = useAuth();
  const creditsBalance = profile?.credits ?? 0;

  const [activeTab, setActiveTab] = useState<'mesa' | 'creditos'>('mesa');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [configureAgentId, setConfigureAgentId] = useState<string | null>(null);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(false);
  const [checkoutPackage, setCheckoutPackage] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ agentId: string; agentName: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteLogs, setDeleteLogs] = useState<string[]>([]);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Estados para compra de créditos
  const [packages, setPackages] = useState<any[]>([]);

  // Criar array de 12 posições (mesa completa)
  const tablePositions = Array.from({ length: 12 }, (_, i) => i);

  // Mapear agentes por posição
  const agentsByPosition = agents.reduce((acc, agent) => {
    acc[agent.table_position] = agent;
    return acc;
  }, {} as Record<number, typeof agents[number]>);

  // Estado de contatos por agente (para refresh mesmo com modal fechado)
  const [contactsByAgent, setContactsByAgent] = useState<Record<string, any[]>>({});

  // Refresh global de contatos: escuta kito_refresh_contacts e atualiza mesmo fora do modal
  const refreshContactsForCallingAgents = useCallback(async () => {
    const callingAgents = agents.filter(a => a.status === 'calling');
    if (callingAgents.length === 0) return;

    const { data } = await supabase
      .from('agent_contacts')
      .select('id, agent_id, status, name, last_call_at, last_call_status')
      .in('agent_id', callingAgents.map(a => a.id));

    if (data) {
      const grouped: Record<string, any[]> = {};
      data.forEach(c => {
        if (!grouped[c.agent_id]) grouped[c.agent_id] = [];
        grouped[c.agent_id].push(c);
      });
      setContactsByAgent(grouped);
    }

    // Também atualiza agentes para capturar mudança de idle
    window.dispatchEvent(new Event('kito_refresh_agents'));
  }, [agents]);

  useEffect(() => {
    const handler = () => refreshContactsForCallingAgents();
    window.addEventListener('kito_refresh_contacts', handler);
    return () => window.removeEventListener('kito_refresh_contacts', handler);
  }, [refreshContactsForCallingAgents]);

  useEffect(() => {
    const saved = localStorage.getItem('dialer_access_unlocked');
    if (saved === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUnlockError(null);
    if (!unlockPassword.trim()) {
      setUnlockError('Digite a senha para liberar o agente.');
      return;
    }

    setUnlockLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('validate-dialer-password', {
        body: { password: unlockPassword.trim() },
      });

      if (functionError) throw functionError;
      if (!data?.success) {
        setUnlockError(data?.error || 'Senha incorreta. Tente novamente.');
        return;
      }

      setIsUnlocked(true);
      localStorage.setItem('dialer_access_unlocked', 'true');
      setUnlockError(null);
    } catch (error: any) {
      setUnlockError(error?.message || 'Erro ao validar senha.');
    } finally {
      setUnlockLoading(false);
    }
  };

  // Estatísticas globais
  const totalAgentsActive = agents.filter(a => a.status === 'calling').length;
  const totalMinutesUsedToday = agents.reduce((sum, a) => sum + a.minutes_used_today, 0);
  const totalCallsToday = agents.reduce((sum, a) => sum + a.calls_made_today, 0);

  const handleStartAgent = async (agentId: string) => {
    try {
      // Verificar créditos suficientes
      if (creditsBalance < 10) {
        alert('Créditos insuficientes! Você precisa de pelo menos 10 créditos para iniciar.');
        return;
      }

      // Verificar se o agente tem número de telefone configurado
      const agent = agents.find(a => a.id === agentId);
      if (!agent?.phone_number_provider_id) {
        alert(
          'Este agente não tem número de telefone configurado.\n\n' +
          '1. Clique em "Números" no topo para cadastrar um número.\n' +
          '2. Depois abra as Configurações do agente e selecione o número.'
        );
        return;
      }

      // Verificar se há contatos pendentes
      const { count } = await supabase
        .from('agent_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'pending');

      if (!count || count === 0) {
        alert(
          'Este agente não tem contatos pendentes para ligar.\n\n' +
          'Abra as Configurações do agente, vá na aba "Lista de Contatos" e adicione contatos manualmente ou via CSV antes de iniciar.'
        );
        return;
      }

      await startAgent(agentId);
    } catch (error: any) {
      alert(`Erro ao iniciar agente: ${error.message}`);
    }
  };

  const handlePhoneChange = async (agentId: string, vapiPhoneId: string | null, displayNumber: string | null) => {
    try {
      await updateAgent(agentId, {
        phone_number_provider_id: vapiPhoneId ?? undefined,
        phone_number: displayNumber ?? undefined,
      });
    } catch (error: any) {
      alert(`Erro ao atualizar número: ${error.message}`);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setDeleteLogs([]);
    setDeleteConfirm({ agentId, agentName: agent?.agent_name ?? 'Agente' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    const log = (msg: string) => {
      console.log('[DELETE]', msg);
      setDeleteLogs(prev => [...prev, msg]);
    };
    try {
      log(`Iniciando exclusão do agente: ${deleteConfirm.agentName} (${deleteConfirm.agentId})`);
      await deleteAgent(deleteConfirm.agentId);
      log('✅ Agente excluído com sucesso!');
      window.dispatchEvent(new Event('kito_refresh_agents'));
      setTimeout(() => {
        setDeleteConfirm(null);
        setDeleteLoading(false);
        setDeleteLogs([]);
      }, 800);
    } catch (error: any) {
      log(`❌ Erro: ${error.message}`);
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'creditos') {
      const fetchPackages = async () => {
        const { data } = await supabase
          .from('plans')
          .select('*')
          .like('id', 'credits_%')
          .eq('is_active', true);

        if (data) {
          // Transform plans into the expected format for the UI
          const formattedPackages = data.map(plan => ({
            id: plan.id,
            name: plan.name,
            price: plan.price || plan.monthly_price || 0,
            credits_amount: plan.features?.credits_amount || 0
          })).sort((a, b) => a.credits_amount - b.credits_amount);

          setPackages(formattedPackages);
        }
      };

      fetchPackages();

      const subscription = supabase
        .channel('plans_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'plans' },
          () => {
            fetchPackages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [activeTab]);

  const handlePurchaseCredits = (pkg: any) => {
    setCheckoutPackage(pkg);
  };

  const handleCreditPurchaseSuccess = () => {
    setCheckoutPackage(null);
    refreshProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Carregando agentes...</div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#1f1f1f] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#c4d82e]/10 flex items-center justify-center text-[#c4d82e]">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
              <p className="text-gray-400 mt-2">Digite a senha para liberar o agente de ligações.</p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4d82e]/70"
                placeholder="Digite a senha do agente"
                autoFocus
              />
            </div>

            {unlockError && (
              <p className="text-sm text-red-400">{unlockError}</p>
            )}

            <button
              type="submit"
              disabled={unlockLoading}
              className="w-full bg-[#c4d82e] hover:bg-[#b3c62e] text-black py-3 rounded-2xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {unlockLoading ? 'Validando...' : 'Desbloquear Agente'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Central de Ligações</h1>
                  <p className="text-sm text-gray-400">Gerencie seus agentes de IA</p>
                </div>
              </div>
            </div>

            {/* Stats Globais */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPhoneNumbers(true)}
                className="flex items-center gap-2 bg-[#c4d82e]/10 hover:bg-[#c4d82e]/20 border border-[#c4d82e]/30 text-[#c4d82e] px-4 py-3 rounded-2xl font-semibold transition-all"
              >
                <PhoneCall className="w-5 h-5" />
                <span className="hidden md:inline">Números</span>
              </button>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[#c4d82e]" />
                  <div>
                    <p className="text-xs text-gray-400">Créditos</p>
                    <p className="text-xl font-bold text-white">{creditsBalance.toFixed(0)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Ativos</p>
                    <p className="text-xl font-bold text-white">{totalAgentsActive}/{agents.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Ligações Hoje</p>
                    <p className="text-xl font-bold text-white">{totalCallsToday}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Min. Hoje</p>
                    <p className="text-xl font-bold text-white">{Math.round(totalMinutesUsedToday)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveTab('mesa')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'mesa'
                ? 'bg-[#c4d82e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Agentes
            </button>
            <button
              onClick={() => setActiveTab('creditos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'creditos'
                ? 'bg-[#c4d82e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <CreditCard className="w-4 h-4" />
              Comprar Créditos
            </button>
          </div>
        </div>
      </header>

      {/* ======================= ABA: MESA ======================= */}
      {activeTab === 'mesa' && (
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Mesa de Operação</h2>
            <p className="text-gray-400">Gerencie até 12 agentes simultâneos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tablePositions.map(position => {
              const agent = agentsByPosition[position];

              if (agent) {
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    phoneNumbers={phoneNumbers}
                    onPhoneChange={(vapiId, displayNum) => handlePhoneChange(agent.id, vapiId, displayNum)}
                    onStart={() => handleStartAgent(agent.id)}
                    onPause={async () => {
                      try { await pauseAgent(agent.id); }
                      catch (e: any) { alert(`Erro ao pausar: ${e.message}`); }
                    }}
                    onStop={async () => {
                      try { await stopAgent(agent.id); }
                      catch (e: any) { alert(`Erro ao parar: ${e.message}`); }
                    }}
                    onConfigure={() => setConfigureAgentId(agent.id)}
                    onDelete={() => handleDeleteAgent(agent.id)}
                  />
                );
              }

              return (
                <button
                  key={`empty-${position}`}
                  onClick={() => setShowCreateModal(true)}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border-2 border-dashed border-white/10 hover:border-[#c4d82e]/50 rounded-3xl p-6 transition-all duration-300 hover:scale-105 min-h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-[#c4d82e]/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#c4d82e]/30 transition-all">
                    <Plus className="w-8 h-8 text-[#c4d82e]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 group-hover:text-white transition-colors">
                    Adicionar Agente
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">Posição {position + 1}</p>
                </button>
              );
            })}
          </div>

          {creditsBalance < 100 && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="font-bold text-red-400 mb-1">Créditos Baixos!</h3>
                  <p className="text-sm text-gray-400">Você tem apenas {creditsBalance.toFixed(0)} créditos. Recarregue para continuar operando.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ======================= ABA: CRÉDITOS ======================= */}
      {activeTab === 'creditos' && (
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Comprar Créditos</h2>
            <p className="text-gray-400">Adicione créditos para fazer ligações com seus agentes</p>
          </div>

          {/* Card de Saldo Atual */}
          <div className="bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/5 border border-[#c4d82e]/30 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Seu saldo atual</p>
                <p className="text-4xl font-bold text-white">{creditsBalance.toFixed(0)} <span className="text-lg text-gray-400">créditos</span></p>
                <p className="text-sm text-gray-400 mt-2">Consulte os custos na configuração do agente</p>
              </div>
              <div className="w-20 h-20 bg-[#c4d82e]/20 rounded-full flex items-center justify-center">
                <Zap className="w-10 h-10 text-[#c4d82e]" />
              </div>
            </div>
          </div>

          {/* Lista de Pacotes */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-6">Adquirir Créditos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:border-[#c4d82e]/30 transition-all group"
                >
                  <div className="w-14 h-14 bg-[#c4d82e]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-[#c4d82e]" />
                  </div>
                  <h4 className="font-bold text-white mb-1">{pkg.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">{pkg.credits_amount} créditos para ligações</p>

                  <div className="mt-auto w-full">
                    <p className="text-2xl font-bold text-white mb-4">R$ {pkg.price.toFixed(2)}</p>
                    <button
                      onClick={() => handlePurchaseCredits(pkg)}
                      className="w-full bg-[#c4d82e] hover:bg-[#b3c62a] text-black py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Comprar agora
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {packages.length === 0 && !loading && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-gray-400">Nenhum pacote disponível no momento.</p>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Informações</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Os créditos são debitados por minuto de ligação</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Os créditos são debitados automaticamente após cada ligação</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Você pode definir limites diários por agente</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Créditos não utilizados não expiram</span>
              </li>
            </ul>
          </div>
        </main>
      )}

      {/* Modais */}
      {
        showCreateModal && (
          <CreateAgentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              window.location.reload();
            }}
          />
        )
      }

      {
        configureAgentId && (
          <ConfigureAgentModal
            agentId={configureAgentId}
            onClose={() => setConfigureAgentId(null)}
            onSuccess={() => setConfigureAgentId(null)}
          />
        )
      }

      {
        showPhoneNumbers && (
          <PhoneNumberModal onClose={() => setShowPhoneNumbers(false)} />
        )
      }

      <DialerCreditCheckoutModal
        isOpen={!!checkoutPackage}
        onClose={() => setCheckoutPackage(null)}
        packageItem={checkoutPackage}
        onSuccess={handleCreditPurchaseSuccess}
      />

      {/* Modal de Confirmação de Exclusão */}
      {
        deleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Excluir Agente</h3>
              <p className="text-gray-400 text-sm mb-1">
                Tem certeza que deseja excluir o agente:
              </p>
              <p className="text-white font-semibold text-lg mb-4">"{deleteConfirm.agentName}"</p>
              <p className="text-red-400 text-xs mb-6">⚠️ Esta ação não pode ser desfeita. Todos os contatos e histórico serão apagados.</p>

              {/* Logs */}
              {deleteLogs.length > 0 && (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-4 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {deleteLogs.map((log, i) => (
                    <p key={i} className={log.startsWith('✅') ? 'text-green-400' : log.startsWith('❌') ? 'text-red-400' : 'text-gray-300'}>
                      {log}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteConfirm(null); setDeleteLogs([]); }}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Excluindo...</>
                  ) : (
                    'Confirmar Exclusão'
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default TelemarketingDesk;