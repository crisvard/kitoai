import { useState } from 'react';
import { Target, Calendar, Trophy, Percent } from 'lucide-react';
import BetGenerator from './BetGenerator';

export default function BettingDashboard() {
  const [savedBets, setSavedBets] = useState<any[]>([]);

  // Carrega as apostas do localStorage quando monta
  useState(() => {
    try {
      const stored = localStorage.getItem('@kito:savedBets');
      if (stored) setSavedBets(JSON.parse(stored));
    } catch (e) { }
  });

  const handleSaveBet = (bet: any) => {
    const newSaved = [bet, ...savedBets];
    setSavedBets(newSaved);
    localStorage.setItem('@kito:savedBets', JSON.stringify(newSaved));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Centro de Oportunidades Sportmonks</h2>
        <p className="text-gray-400">Gere e salve bilhetes embasados em dados reais por casa de câmbio</p>
      </div>

      {/* O Gerador Centralizado */}
      <BetGenerator onSaveBet={handleSaveBet} />

      {/* Últimas Apostas Salvas (Quick View) */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-[#c4d82e]" /> Últimas Seleções Salvas
          </h3>
          <span className="text-gray-400 text-sm">Mostrando as {savedBets.slice(0, 3).length} mais recentes</span>
        </div>

        {savedBets.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Nenhuma aposta salva. Use o gerador acima!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedBets.slice(0, 3).map((bet) => (
              <div key={bet.id} className="p-4 bg-black/40 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-1 bg-[#c4d82e]/20 text-[#c4d82e] text-xs rounded uppercase font-bold">
                    {bet.type}
                  </span>
                  <span className="text-[#c4d82e] font-bold">{bet.totalOdds.toFixed(2)}x</span>
                </div>

                <div className="space-y-2 mb-3">
                  {bet.selections.map((sel: any, idx: number) => (
                    <div key={idx} className="flex flex-col border-l-2 border-[#c4d82e]/30 pl-2">
                      <span className="text-white text-sm truncate">{sel.match}</span>
                      <span className="text-gray-400 text-xs">{sel.market} - <span className="text-white">{sel.selection}</span></span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-2 flex justify-between items-center mt-2">
                  <span className="text-green-400 text-xs font-semibold flex items-center">
                    <Percent size={12} /> {bet.accuracyPred}% Prev.
                  </span>
                  <button className="text-xs text-blue-400 hover:underline">Ver Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
