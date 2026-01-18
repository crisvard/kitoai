import React, { useState } from 'react';
import { Phone, Users, Clock, Settings as SettingsIcon, ArrowLeft, Play, Square } from 'lucide-react';
import Dashboard from '../dialer/components/Dashboard';
import ContactsTable from '../dialer/components/ContactsTable';
import Settings from '../dialer/components/Settings';
import CallHistory from '../dialer/components/CallHistory';
import { DialerProvider, useDialer } from '../dialer/contexts/DialerContext';
import { useUserProfile } from '../hooks/useUserProfile';

interface DialerPageProps {
  onBack: () => void;
}

type Tab = 'dashboard' | 'contacts' | 'history' | 'settings';

const DialerContent: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { state, startCampaign, stopCampaign } = useDialer();
  const { profile } = useUserProfile();

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: Phone },
    { id: 'contacts' as Tab, label: 'Contatos', icon: Users },
    { id: 'history' as Tab, label: 'Histórico', icon: Clock },
    { id: 'settings' as Tab, label: 'Configurações', icon: SettingsIcon },
  ];

  const getStatusIndicator = () => {
    if (state.isRunning) {
      return { color: 'bg-green-500', text: 'Campanha Ativa', icon: Play };
    } else if (state.currentCampaign?.status === 'paused') {
      return { color: 'bg-yellow-500', text: 'Campanha Pausada', icon: Square };
    } else if (state.currentCampaign?.status === 'running') {
      return { color: 'bg-blue-500', text: 'Campanha Executando', icon: Play };
    } else {
      return { color: 'bg-gray-400', text: 'Inativo', icon: Square };
    }
  };

  const status = getStatusIndicator();
  const StatusIcon = status.icon;

  const handleToggleCampaign = () => {
    if (state.isRunning) {
      stopCampaign();
    } else if (state.currentCampaign) {
      startCampaign(state.currentCampaign.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color} animate-pulse`} />
                  <StatusIcon className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {status.text}
                </span>
              </div>

              {/* Campaign Control Button */}
              {state.currentCampaign && (
                <button
                  onClick={handleToggleCampaign}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95
                    ${state.isRunning 
                      ? 'bg-red-600/90 hover:bg-red-600 text-white hover:shadow-red-500/20'
                      : 'bg-[#c4d82e] hover:bg-[#b5c928] disabled:bg-gray-600 disabled:text-gray-400 text-black hover:shadow-[#c4d82e]/30'
                    }
                  `}
                >
                  {state.isRunning ? (
                    <>
                      <Square className="w-4 h-4" />
                      Parar Campanha
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Iniciar Campanha
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner de Trial Ativo - Ligações */}
      {profile?.trial_ligacoes_active && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Trial Ativo - Agente de Ligações</h3>
                  <p className="text-gray-300">
                    Expira em {profile.trial_ligacoes_end_date ? new Date(profile.trial_ligacoes_end_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-400 font-medium">Acesso Liberado</div>
                <div className="text-xs text-gray-400 mt-1">Durante o período de teste</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#c4d82e]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Agente de Ligações</h1>
                  <p className="text-gray-400">Sistema inteligente de discagem automática</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-6">
              <div className="border-b border-white/10">
                <nav className="flex">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex-1 py-6 px-8 font-semibold text-sm transition-all duration-300 relative
                          ${activeTab === tab.id
                            ? 'text-[#c4d82e] bg-[#c4d82e]/10'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Icon className="w-5 h-5" />
                          {tab.label}
                        </div>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c4d82e]" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-8">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'contacts' && <ContactsTable />}
                {activeTab === 'history' && <CallHistory />}
                {activeTab === 'settings' && <Settings />}
              </div>
            </div>
          </div>

          {/* Sidebar - Campaign Stats */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl sticky top-8 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#c4d82e]" />
                  </div>
                  <h3 className="font-bold text-white">Campanha Atual</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {state.currentCampaign ? (
                  <>
                    {/* Campaign Name */}
                    <div className="bg-gradient-to-br from-[#c4d82e]/10 to-[#c4d82e]/5 border border-[#c4d82e]/20 rounded-2xl p-4">
                      <h4 className="text-sm font-semibold text-[#c4d82e] mb-2">Nome da Campanha</h4>
                      <p className="text-white font-medium">{state.currentCampaign.name}</p>
                    </div>

                    {/* Campaign Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Total de Contatos</span>
                        <span className="text-white font-semibold">{state.currentCampaign.totalCalls}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Concluídas</span>
                        <span className="text-green-400 font-semibold">{state.currentCampaign.completedCalls}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Falhas</span>
                        <span className="text-red-400 font-semibold">{state.currentCampaign.failedCalls}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Progresso</span>
                        <span>{Math.round((state.currentCampaign.completedCalls + state.currentCampaign.failedCalls) / state.currentCampaign.totalCalls * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[#c4d82e] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(state.currentCampaign.completedCalls + state.currentCampaign.failedCalls) / state.currentCampaign.totalCalls * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Campaign Status */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          state.currentCampaign.status === 'running' ? 'bg-green-500' :
                          state.currentCampaign.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-semibold text-gray-300">Status</span>
                      </div>
                      <p className="text-white capitalize">{state.currentCampaign.status}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                      Nenhuma campanha ativa
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                      Configure uma campanha para começar
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const DialerPage: React.FC<DialerPageProps> = ({ onBack }) => {
  return (
    <DialerProvider>
      <DialerContent onBack={onBack} />
    </DialerProvider>
  );
};

export default DialerPage;
