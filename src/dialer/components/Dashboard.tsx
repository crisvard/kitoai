import React from 'react';
import { Play, Pause, Square, Upload, Phone, Users, Clock, TrendingUp } from 'lucide-react';
import { useDialer } from '../contexts/DialerContext';

const Dashboard: React.FC = () => {
  const { state, startCampaign, stopCampaign, pauseCampaign, loadContactsFromSheets } = useDialer();
  const { currentCampaign, isRunning } = state;

  const handleStart = () => {
    if (currentCampaign) {
      startCampaign(currentCampaign.id);
    } else {
      alert('Nenhuma campanha configurada. Vá para Configurações primeiro.');
    }
  };

  const handleStop = () => {
    stopCampaign();
  };

  const handlePause = () => {
    pauseCampaign();
  };

  const stats = [
    {
      label: 'Total de Contatos',
      value: currentCampaign?.totalCalls || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Ligações Realizadas',
      value: currentCampaign?.completedCalls || 0,
      icon: Phone,
      color: 'bg-green-500',
    },
    {
      label: 'Ligações Falharam',
      value: currentCampaign?.failedCalls || 0,
      icon: Clock,
      color: 'bg-red-500',
    },
    {
      label: 'Taxa de Sucesso',
      value: currentCampaign?.totalCalls
        ? `${Math.round(((currentCampaign.completedCalls || 0) / currentCampaign.totalCalls) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Status da Campanha
            </h2>
            <p className="text-gray-400">
              {currentCampaign ? currentCampaign.name : 'Nenhuma campanha ativa'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            isRunning
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : currentCampaign?.status === 'paused'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {isRunning ? 'Executando' : currentCampaign?.status === 'paused' ? 'Pausada' : 'Parada'}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center space-x-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-[#c4d82e]/30"
          >
            <Play className="w-5 h-5" />
            <span>Iniciar</span>
          </button>

          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Pause className="w-5 h-5" />
            <span>Pausar</span>
          </button>

          <button
            onClick={handleStop}
            disabled={!isRunning && currentCampaign?.status !== 'paused'}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Square className="w-5 h-5" />
            <span>Parar</span>
          </button>

          <button
            onClick={loadContactsFromSheets}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
            <span>Carregar Contatos</span>
          </button>
        </div>

        {/* Progress Bar */}
        {currentCampaign && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Progresso</span>
              <span>
                {(currentCampaign.completedCalls || 0) + (currentCampaign.failedCalls || 0)} de {currentCampaign.totalCalls}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-[#c4d82e] h-3 rounded-full transition-all duration-500 shadow-lg shadow-[#c4d82e]/30"
                style={{
                  width: `${
                    currentCampaign.totalCalls > 0
                      ? (((currentCampaign.completedCalls || 0) + (currentCampaign.failedCalls || 0)) / currentCampaign.totalCalls) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      {currentCampaign && currentCampaign.contacts.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl">
          <div className="px-8 py-6 border-b border-white/10">
            <h3 className="text-lg font-medium text-white">Atividade Recente</h3>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {currentCampaign.contacts
                .filter(contact => contact.status !== 'pending')
                .slice(-5)
                .reverse()
                .map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        contact.status === 'completed' ? 'bg-green-500' :
                        contact.status === 'calling' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-white">{contact.name}</p>
                        <p className="text-xs text-gray-400">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        contact.status === 'completed' ? 'text-green-400' :
                        contact.status === 'calling' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {contact.status === 'completed' ? 'Concluída' :
                         contact.status === 'calling' ? 'Chamando' : 'Falhou'}
                      </p>
                      {contact.lastCallTime && (
                        <p className="text-xs text-gray-500">
                          {new Date(contact.lastCallTime).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {!currentCampaign && (
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-3xl p-8 text-center">
          <Phone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-300 mb-2">
            Bem-vindo ao Bland Dialer
          </h3>
          <p className="text-blue-200 mb-4">
            Configure suas API keys e crie sua primeira campanha para começar.
          </p>
          <p className="text-sm text-blue-300">
            Vá para a seção Configurações para começar.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;