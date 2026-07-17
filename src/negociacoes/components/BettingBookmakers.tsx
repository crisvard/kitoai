import { Dices, Plus, CheckCircle, XCircle, Star } from 'lucide-react';

export default function BettingBookmakers() {
  const bookmakers = [
    {
      name: 'Bet365',
      logo: 'B365',
      status: 'connected',
      balance: 'R$ 12.500,00',
      bets: 45,
      profit: 3200,
      rating: 5,
      features: ['Ao Vivo', 'Cash Out', 'Streaming'],
    },
    {
      name: 'Betano',
      logo: 'BT',
      status: 'connected',
      balance: 'R$ 8.200,00',
      bets: 28,
      profit: 1850,
      rating: 4,
      features: ['Ao Vivo', 'Cash Out', 'Pix'],
    },
    {
      name: 'Stake',
      logo: 'ST',
      status: 'connected',
      balance: 'R$ 4.100,00',
      bets: 15,
      profit: -450,
      rating: 4,
      features: ['Crypto', 'Ao Vivo', 'Altas Odds'],
    },
  ];

  const availableBookmakers = [
    { name: 'Bet365', minDeposit: 'R$ 30', withdrawal: 'Pix instantâneo', rating: 5 },
    { name: 'Betano', minDeposit: 'R$ 30', withdrawal: 'Pix até 24h', rating: 5 },
    { name: 'Stake', minDeposit: 'R$ 50', withdrawal: 'Crypto instantâneo', rating: 4 },
    { name: '1xBet', minDeposit: 'R$ 20', withdrawal: 'Pix até 15min', rating: 4 },
    { name: 'Parimatch', minDeposit: 'R$ 40', withdrawal: 'Pix até 1h', rating: 3 },
    { name: 'Blaze', minDeposit: 'R$ 20', withdrawal: 'Pix até 30min', rating: 4 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Casas de Aposta</h2>
        <p className="text-gray-400">Gerencie suas contas nas casas de aposta</p>
      </div>

      {/* Casas Conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmakers.map((bookmaker, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-[#c4d82e]/30 hover:border-[#c4d82e] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-xl flex items-center justify-center text-black font-bold text-xl">
                {bookmaker.logo}
              </div>
              <div className="flex items-center gap-1 text-[#c4d82e]">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Conectada</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{bookmaker.name}</h3>
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < bookmaker.rating ? 'text-[#c4d82e] fill-[#c4d82e]' : 'text-gray-600'} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Saldo</p>
                <p className="text-white font-bold">{bookmaker.balance}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Apostas</p>
                <p className="text-white font-bold">{bookmaker.bets}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-gray-400 text-xs">Lucro Total</p>
              <p className={`font-bold ${bookmaker.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {bookmaker.profit > 0 ? '+' : ''}R$ {bookmaker.profit}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {bookmaker.features.map((feature, i) => (
                <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-[#c4d82e]/20 text-[#c4d82e] py-2 rounded-lg text-sm font-medium hover:bg-[#c4d82e]/30 transition-colors">
                Atualizar
              </button>
              <button className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                Ver Odds
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Adicionar Casa */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Adicionar Casa de Aposta</h3>
            <p className="text-gray-400 text-sm">Conecte uma nova casa para gestionar suas apostas</p>
          </div>
          <button className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors">
            <Plus size={20} />
            Adicionar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableBookmakers.map((bookmaker, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-bold">{bookmaker.name}</h4>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-[#c4d82e] fill-[#c4d82e]" />
                  <span className="text-white text-sm">{bookmaker.rating}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Depósito mín.</span>
                  <span className="text-white">{bookmaker.minDeposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Saque</span>
                  <span className="text-white">{bookmaker.withdrawal}</span>
                </div>
              </div>
              <button className="w-full bg-[#c4d82e]/20 text-[#c4d82e] py-2 rounded-lg text-sm font-medium hover:bg-[#c4d82e]/30 transition-colors">
                Conectar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
