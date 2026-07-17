import { useState, useEffect } from 'react';
import { Filter, Trash2, Percent } from 'lucide-react';

export default function BettingBets() {
  const [savedBets, setSavedBets] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('@kito:savedBets');
      if (stored) setSavedBets(JSON.parse(stored));
    } catch (e) { }
  }, []);

  const handleDelete = (id: string) => {
    const updated = savedBets.filter(b => b.id !== id);
    setSavedBets(updated);
    localStorage.setItem('@kito:savedBets', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Apostas Salvas</h2>
        <p className="text-gray-400">Lista dos bilhetes gerados pela IA e salvos para execução manual nas Casas de Câmbio.</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">

        {savedBets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Nenhum bilhete salvo ainda.</p>
            <p className="text-gray-500 text-sm mt-2">Vá ao Dashboard e use o Gerador Sportmonks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedBets.map((bet) => (
              <div
                key={bet.id}
                className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#c4d82e]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#c4d82e]/20 text-[#c4d82e] rounded text-sm font-bold uppercase tracking-wider">{bet.type === 'single' ? 'Simples' : 'Múltipla'}</span>
                    <span className="text-gray-400 text-xs">Salvo recentemente</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-green-400 text-sm font-bold flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                      <Percent size={14} /> {bet.accuracyPred}% de Certeza Algorítmica
                    </span>
                    <button
                      onClick={() => handleDelete(bet.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Seleções do Bilhete</h4>
                    {bet.selections.map((sel: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                        <div>
                          <p className="text-white font-medium">{sel.match}</p>
                          <p className="text-gray-400 text-sm">{sel.market} - <strong className="text-white">{sel.selection}</strong></p>
                        </div>
                        <div className="text-right">
                          <span className="bg-white/10 text-white px-3 py-1.5 rounded text-sm font-mono border border-white/10">@{sel.odd}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 border border-white/5 flex flex-col justify-center items-center">
                    <p className="text-gray-400 text-sm mb-1">Odd Total Final</p>
                    <p className="text-5xl font-black text-[#c4d82e]">{bet.totalOdds.toFixed(2)}x</p>
                    <div className="mt-6 w-full max-w-[200px]">
                      <button className="w-full mb-2 bg-[#c4d82e]/10 text-[#c4d82e] border border-[#c4d82e]/20 py-2 rounded font-semibold text-sm hover:bg-[#c4d82e]/20 transition-colors">
                        Copiar Detalhes
                      </button>
                      <button className="w-full text-xs text-white bg-green-600/20 border border-green-600/30 hover:bg-green-600/40 py-2 rounded transition-colors text-green-400">
                        Marcar Executado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
