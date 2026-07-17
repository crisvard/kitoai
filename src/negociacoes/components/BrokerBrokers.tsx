import { Building2, Plus, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function BrokerBrokers() {
  const brokers = [
    {
      name: 'Rico',
      logo: 'R',
      status: 'connected',
      accountType: 'Investidor',
      balance: 'R$ 25.430,00',
      connected: true,
    },
    {
      name: 'XP Investimentos',
      logo: 'XP',
      status: 'connected',
      accountType: 'Trader',
      balance: 'R$ 26.670,00',
      connected: true,
    },
    {
      name: 'Clear',
      logo: 'CL',
      status: 'disconnected',
      accountType: '-',
      balance: '-',
      connected: false,
    },
    {
      name: 'Itaú',
      logo: 'IT',
      status: 'disconnected',
      accountType: '-',
      balance: '-',
      connected: false,
    },
    {
      name: 'Bradesco',
      logo: 'BR',
      status: 'disconnected',
      accountType: '-',
      balance: '-',
      connected: false,
    },
  ];

  const availableBrokers = [
    { name: 'Rico', fee: 'A partir de R$ 4,90', features: ['Ações', 'FIIs', 'ETF', 'Tesouro Direto'] },
    { name: 'XP Investimentos', fee: 'A partir de R$ 8,90', features: ['Ações', 'FIIs', 'ETF', 'Tesouro Direto', 'Forex'] },
    { name: 'Clear', fee: 'Grátis', features: ['Ações', 'FIIs', 'ETF'] },
    { name: 'Modalmais', fee: 'A partir de R$ 6,90', features: ['Ações', 'FIIs', 'ETF', 'Derivativos'] },
    { name: 'uide', fee: 'A partir de R$ 7,50', features: ['Ações', 'FIIs', 'ETF', 'Crypto'] },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Corretoras</h2>
        <p className="text-gray-400">Gerencie suas conexões com corretoras</p>
      </div>

      {/* Corretoras Conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brokers.map((broker, index) => (
          <div
            key={index}
            className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border ${
              broker.connected
                ? 'border-[#c4d82e]/50 hover:border-[#c4d82e]'
                : 'border-white/10 hover:border-white/20'
            } transition-all duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-xl flex items-center justify-center text-black font-bold text-xl">
                {broker.logo}
              </div>
              {broker.connected ? (
                <div className="flex items-center gap-1 text-[#c4d82e]">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Conectada</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <XCircle size={16} />
                  <span className="text-sm font-medium">Desconectada</span>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{broker.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{broker.accountType}</p>

            {broker.connected ? (
              <>
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-gray-400 text-xs">Saldo Total</p>
                  <p className="text-white font-bold">{broker.balance}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#c4d82e]/20 text-[#c4d82e] py-2 rounded-lg text-sm font-medium hover:bg-[#c4d82e]/30 transition-colors">
                    Sincronizar
                  </button>
                  <button className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors">
                    Desconectar
                  </button>
                </div>
              </>
            ) : (
              <button className="w-full bg-[#c4d82e] text-black py-2 rounded-lg text-sm font-medium hover:bg-[#c4d82e]/90 transition-colors">
                Conectar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar Nova Corretora */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Adicionar Corretora</h3>
            <p className="text-gray-400 text-sm">Conecte uma nova corretora à sua conta</p>
          </div>
          <button className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors">
            <Plus size={20} />
            Adicionar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableBrokers.map((broker, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-bold">{broker.name}</h4>
                <span className="text-[#c4d82e] text-sm font-medium">{broker.fee}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {broker.features.map((feature, i) => (
                  <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
