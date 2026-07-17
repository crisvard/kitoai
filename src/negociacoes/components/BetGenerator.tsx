import { useState } from 'react';
import { Search, Dices, Hash, Database, Save, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { sportmonksAPI, BOOKMAKERS, type GeneratedBet } from '../services/sportmonks';

export default function BetGenerator({ onSaveBet }: { onSaveBet: (bet: GeneratedBet) => void }) {
    const [bookmaker, setBookmaker] = useState('any');
    const [betType, setBetType] = useState<'single' | 'multiple'>('single');
    const [quantity, setQuantity] = useState(5);
    const [minOdds, setMinOdds] = useState(1.5);
    const [maxOdds, setMaxOdds] = useState(3.0);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBets, setGeneratedBets] = useState<GeneratedBet[]>([]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedBets([]);

        const bm = BOOKMAKERS.find(b => b.value === bookmaker);
        const bookmakerId = bm?.id ?? 0;

        try {
            const results = await sportmonksAPI.generateBets({
                bookmakerId,
                type: betType,
                quantity,
                targetOddsMin: minOdds,
                targetOddsMax: maxOdds,
            });

            setGeneratedBets(results);
        } catch (e) {
            console.error('[BetGenerator]', e);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveToArea = (bet: GeneratedBet) => {
        onSaveBet(bet);
        setGeneratedBets(prev => prev.filter(b => b.id !== bet.id));
    };

    const formatDateTime = (iso?: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-[#c4d82e]/50 shadow-lg shadow-[#c4d82e]/5 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#c4d82e]/20 rounded-lg">
                        <Database className="text-[#c4d82e]" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Gerador Sportmonks</h3>
                        <p className="text-sm text-gray-400">Encontre oportunidades com odds reais por casa de câmbio</p>
                    </div>
                </div>
            </div>

            {/* Formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {/* Bookmaker */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Casa de Câmbio</label>
                    <select
                        value={bookmaker}
                        onChange={e => setBookmaker(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#c4d82e]/50"
                    >
                        {BOOKMAKERS.map(bm => (
                            <option key={bm.value} value={bm.value}>{bm.label}</option>
                        ))}
                    </select>
                </div>

                {/* Tipo de Aposta */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                        <Dices size={15} /> Tipo de Aposta
                    </label>
                    <select
                        value={betType}
                        onChange={e => setBetType(e.target.value as 'single' | 'multiple')}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#c4d82e]/50"
                    >
                        <option value="single">Simples</option>
                        <option value="multiple">Múltipla / Bilhete</option>
                    </select>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                        <Hash size={15} /> Quantidade
                    </label>
                    <input
                        type="number" min={1} max={50}
                        value={quantity}
                        onChange={e => setQuantity(Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#c4d82e]/50"
                    />
                </div>

                {/* Odds */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Faixa de Odds</label>
                    <div className="flex gap-2">
                        <input
                            type="number" min={1.01} step={0.1} placeholder="Min"
                            value={minOdds}
                            onChange={e => setMinOdds(Number(e.target.value))}
                            className="w-1/2 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c4d82e]/50"
                        />
                        <input
                            type="number" min={1.1} step={0.1} placeholder="Max"
                            value={maxOdds}
                            onChange={e => setMaxOdds(Number(e.target.value))}
                            className="w-1/2 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c4d82e]/50"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-4 mt-2">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#aabf24] transition-colors disabled:opacity-60"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    {isGenerating ? 'Buscando oportunidades...' : 'Buscar Oportunidades'}
                </button>
            </div>

            {/* Resultados */}
            {generatedBets.length > 0 && (
                <div className="mt-8 border-t border-white/10 pt-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white">
                            {generatedBets.length} Oportunidade{generatedBets.length !== 1 ? 's' : ''} Encontrada{generatedBets.length !== 1 ? 's' : ''}
                        </h4>
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                            <CheckCircle size={13} /> Dados Reais do Banco de Inteligência Local
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {generatedBets.map((bet) => (
                            <div key={bet.id} className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-[#c4d82e]/20 transition-colors group">
                                {/* Cabeçalho do bilhete */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300 uppercase tracking-wide font-semibold">
                                            {bet.type === 'single' ? 'Simples' : 'Múltipla'}
                                        </span>
                                        <span className="text-xs text-gray-500">{bet.bookmaker}</span>
                                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30 font-bold uppercase">Local</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Odd Total</p>
                                        <p className="text-[#c4d82e] font-bold text-xl leading-tight">{bet.totalOdds.toFixed(2)}x</p>
                                    </div>
                                </div>

                                {/* Seleções */}
                                <div className="space-y-2 mb-4">
                                    {bet.selections.map((sel, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-lg p-2.5">
                                            <div className="flex justify-between items-start text-sm">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{sel.match}</p>
                                                    <p className="text-gray-400 text-xs">{sel.market} · <span className="text-[#c4d82e]">{sel.selection}</span></p>
                                                </div>
                                                <div className="text-right ml-3 flex-shrink-0">
                                                    <p className="text-white font-bold">{sel.odd.toFixed(2)}</p>
                                                    {sel.probability !== undefined && (
                                                        <p className="text-gray-400 text-xs">{sel.probability}% prob.</p>
                                                    )}
                                                </div>
                                            </div>
                                            {sel.startTime && (
                                                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {formatDateTime(sel.startTime)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Botão salvar */}
                                <button
                                    onClick={() => saveToArea(bet)}
                                    className="w-full flex justify-center items-center gap-2 bg-white/10 hover:bg-[#c4d82e]/20 hover:text-[#c4d82e] text-gray-300 py-2 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Save size={15} /> Salvar na Minha Lista
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
