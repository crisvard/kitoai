import { useState } from 'react';
import { Settings, CheckCircle, XCircle, Star, Plus, Trash2, Edit, Save, X, Zap, Target, Activity, Clock, DollarSign, Shield, Globe, Lock } from 'lucide-react';
import { BookmakerConfig } from '../types/bookmaker';

interface BookmakerSettingsProps {
    bookmakers: BookmakerConfig[];
    enabledBookmakers: string[];
    onUpdateBookmaker: (bookmaker: BookmakerConfig) => void;
    onToggleBookmaker: (name: string) => void;
    onDeleteBookmaker: (name: string) => void;
    onAddBookmaker: (bookmaker: BookmakerConfig) => void;
}

export default function BookmakerSettings({
    bookmakers,
    enabledBookmakers,
    onUpdateBookmaker,
    onToggleBookmaker,
    onDeleteBookmaker,
    onAddBookmaker
}: BookmakerSettingsProps) {
    const [editingBookmaker, setEditingBookmaker] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBookmaker, setNewBookmaker] = useState<Partial<BookmakerConfig>>({
        name: '',
        url: '',
        scraper: '',
        enabled: true,
        updateInterval: 30,
        maxRetries: 3,
        difficulty: 'medium',
        features: [],
    });

    const handleSaveBookmaker = (bookmaker: BookmakerConfig) => {
        onUpdateBookmaker(bookmaker);
        setEditingBookmaker(null);
    };

    const handleAddBookmaker = () => {
        if (!newBookmaker.name || !newBookmaker.url) return;

        const bookmaker: BookmakerConfig = {
            name: newBookmaker.name,
            url: newBookmaker.url,
            scraper: newBookmaker.scraper || `${newBookmaker.name.toLowerCase().replace(/\s+/g, '-')}-scraper`,
            enabled: newBookmaker.enabled ?? true,
            updateInterval: newBookmaker.updateInterval ?? 30,
            maxRetries: newBookmaker.maxRetries ?? 3,
            difficulty: newBookmaker.difficulty ?? 'medium',
            features: newBookmaker.features ?? [],
        };

        onAddBookmaker(bookmaker);
        setNewBookmaker({
            name: '',
            url: '',
            scraper: '',
            enabled: true,
            updateInterval: 30,
            maxRetries: 3,
            difficulty: 'medium',
            features: [],
        });
        setShowAddForm(false);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'low':
                return 'text-green-400';
            case 'medium':
                return 'text-yellow-400';
            case 'high':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'low':
                return 'Baixa';
            case 'medium':
                return 'Média';
            case 'high':
                return 'Alta';
            default:
                return 'Desconhecida';
        }
    };

    const enabledCount = enabledBookmakers.length;
    const totalBookmakers = bookmakers.length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Casas de Apostas</h2>
                <p className="text-gray-400">Gerencie as casas de apostas para espelhamento</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalBookmakers}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{enabledCount}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Inativas</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{totalBookmakers - enabledCount}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {totalBookmakers > 0 ? Math.round((enabledCount / totalBookmakers) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Ações */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Settings className="text-[#c4d82e]" size={20} />
                        <span className="text-white font-medium">Ações</span>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Plus size={18} />
                        Adicionar Casa
                    </button>
                </div>
            </div>

            {/* Formulário de Adição */}
            {showAddForm && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Adicionar Casa de Apostas</h3>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                            <input
                                type="text"
                                value={newBookmaker.name}
                                onChange={(e) => setNewBookmaker({ ...newBookmaker, name: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Ex: Betano"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">URL</label>
                            <input
                                type="text"
                                value={newBookmaker.url}
                                onChange={(e) => setNewBookmaker({ ...newBookmaker, url: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="https://www.betano.bet.br"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Scraper</label>
                            <input
                                type="text"
                                value={newBookmaker.scraper}
                                onChange={(e) => setNewBookmaker({ ...newBookmaker, scraper: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="betano-scraper"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Dificuldade</label>
                            <select
                                value={newBookmaker.difficulty}
                                onChange={(e) => setNewBookmaker({ ...newBookmaker, difficulty: e.target.value as any })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Intervalo de Atualização (segundos)</label>
                            <input
                                type="number"
                                value={newBookmaker.updateInterval}
                                onChange={(e) => setNewBookmaker({ ...newBookmaker, updateInterval: parseInt(e.target.value) })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Máximo de Tentativas</label>
                            <input
                                type="number"
                                value={newBookmaker.maxRetries}
                                onChange={(e) => setNewBookmaker({ ...newBookmaker, maxRetries: parseInt(e.target.value) })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleAddBookmaker}
                            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                        >
                            <Save size={18} />
                            Salvar
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de Casas de Apostas */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Casas de Apostas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmakers.map(bookmaker => {
                        const isEnabled = enabledBookmakers.includes(bookmaker.name);
                        return (
                            <div
                                key={bookmaker.name}
                                className={`rounded-xl p-4 border transition-all duration-200 ${isEnabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {isEnabled ? (
                                            <CheckCircle className="text-green-400" size={20} />
                                        ) : (
                                            <XCircle className="text-gray-400" size={20} />
                                        )}
                                        <h4 className="text-white font-bold">{bookmaker.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingBookmaker(bookmaker.name)}
                                            className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            <Edit size={14} className="text-white" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteBookmaker(bookmaker.name)}
                                            className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} className="text-gray-400" />
                                        <a href={bookmaker.url} target="_blank" rel="noopener noreferrer" className="text-[#c4d82e] hover:underline truncate">
                                            {bookmaker.url}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className="text-gray-400" />
                                        <span className={`font-medium ${getDifficultyColor(bookmaker.difficulty)}`}>
                                            Dificuldade: {getDifficultyLabel(bookmaker.difficulty)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="text-white">
                                            Atualização: {bookmaker.updateInterval}s
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-gray-400" />
                                        <span className="text-white">
                                            Tentativas: {bookmaker.maxRetries}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex flex-wrap gap-1">
                                        {bookmaker.features.map((feature, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => onToggleBookmaker(bookmaker.name)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isEnabled
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            }`}
                                    >
                                        {isEnabled ? 'Desativar' : 'Ativar'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Edição */}
            {editingBookmaker && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Editar: {editingBookmaker}</h3>
                            <button
                                onClick={() => setEditingBookmaker(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {(() => {
                            const bookmaker = bookmakers.find(b => b.name === editingBookmaker);
                            if (!bookmaker) return null;

                            return (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                                            <input
                                                type="text"
                                                value={bookmaker.name}
                                                onChange={(e) => onUpdateBookmaker({ ...bookmaker, name: e.target.value })}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">URL</label>
                                            <input
                                                type="text"
                                                value={bookmaker.url}
                                                onChange={(e) => onUpdateBookmaker({ ...bookmaker, url: e.target.value })}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Scraper</label>
                                            <input
                                                type="text"
                                                value={bookmaker.scraper}
                                                onChange={(e) => onUpdateBookmaker({ ...bookmaker, scraper: e.target.value })}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Dificuldade</label>
                                            <select
                                                value={bookmaker.difficulty}
                                                onChange={(e) => onUpdateBookmaker({ ...bookmaker, difficulty: e.target.value as any })}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                            >
                                                <option value="low">Baixa</option>
                                                <option value="medium">Média</option>
                                                <option value="high">Alta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Intervalo de Atualização (segundos)</label>
                                            <input
                                                type="number"
                                                value={bookmaker.updateInterval}
                                                onChange={(e) => onUpdateBookmaker({ ...bookmaker, updateInterval: parseInt(e.target.value) })}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Máximo de Tentativas</label>
                                            <input
                                                type="number"
                                                value={bookmaker.maxRetries}
                                                onChange={(e) => onUpdateBookmaker({ ...bookmaker, maxRetries: parseInt(e.target.value) })}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingBookmaker(null)}
                                            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                                        >
                                            <Save size={18} />
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setEditingBookmaker(null)}
                                            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                                        >
                                            <X size={18} />
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
