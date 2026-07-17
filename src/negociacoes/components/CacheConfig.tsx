import { useState } from 'react';
import { Database, RefreshCw, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, Activity, Zap, Target, Clock, Settings, HardDrive, Cpu } from 'lucide-react';

interface CacheConfig {
    enabled: boolean;
    ttl: number; // em segundos
    maxSize: number; // em MB
    strategy: 'lru' | 'fifo' | 'lfu';
    autoCleanup: boolean;
    cleanupInterval: number; // em segundos
}

interface CacheStats {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    size: number; // em MB
    oldestEntry: string;
    newestEntry: string;
}

export default function CacheConfigComponent() {
    const [config, setConfig] = useState<CacheConfig>({
        enabled: true,
        ttl: 30,
        maxSize: 100,
        strategy: 'lru',
        autoCleanup: true,
        cleanupInterval: 300,
    });

    const [stats, setStats] = useState<CacheStats>({
        totalEntries: 1250,
        hitRate: 85.5,
        missRate: 14.5,
        size: 45.2,
        oldestEntry: new Date(Date.now() - 3600000).toISOString(),
        newestEntry: new Date().toISOString(),
    });

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleClearCache = () => {
        setStats({
            totalEntries: 0,
            hitRate: 0,
            missRate: 0,
            size: 0,
            oldestEntry: '',
            newestEntry: '',
        });
        setShowClearConfirm(false);
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Cache</h2>
                <p className="text-gray-400">Gerencie o cache de odds para melhorar performance</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Entradas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Hit Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.hitRate}%</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Tamanho</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.size} MB</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-blue-400" size={18} />
                        <span className="text-gray-400 text-sm">TTL</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{config.ttl}s</p>
                </div>
            </div>

            {/* Configurações */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Settings className="text-[#c4d82e]" size={20} />
                        <span className="text-white font-medium">Configurações</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="cacheEnabled"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="cacheEnabled" className="text-gray-400 text-sm">
                            Cache Habilitado
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">TTL (segundos)</label>
                        <input
                            type="number"
                            value={config.ttl}
                            onChange={(e) => setConfig({ ...config, ttl: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Tempo de vida dos dados em cache</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Tamanho Máximo (MB)</label>
                        <input
                            type="number"
                            value={config.maxSize}
                            onChange={(e) => setConfig({ ...config, maxSize: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Tamanho máximo do cache</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Estratégia</label>
                        <select
                            value={config.strategy}
                            onChange={(e) => setConfig({ ...config, strategy: e.target.value as any })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="lru">LRU (Least Recently Used)</option>
                            <option value="fifo">FIFO (First In First Out)</option>
                            <option value="lfu">LFU (Least Frequently Used)</option>
                        </select>
                        <p className="text-gray-500 text-xs mt-1">Estratégia de eviction</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Intervalo de Limpeza (segundos)</label>
                        <input
                            type="number"
                            value={config.cleanupInterval}
                            onChange={(e) => setConfig({ ...config, cleanupInterval: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Intervalo para limpeza automática</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="autoCleanup"
                        checked={config.autoCleanup}
                        onChange={(e) => setConfig({ ...config, autoCleanup: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                    />
                    <label htmlFor="autoCleanup" className="text-gray-400 text-sm">
                        Limpeza Automática
                    </label>
                </div>
            </div>

            {/* Ações */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Activity className="text-[#c4d82e]" size={20} />
                        <span className="text-white font-medium">Ações</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                        >
                            <Trash2 size={18} />
                            Limpar Cache
                        </button>
                        <button
                            onClick={() => setConfig({ ...config })}
                            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                        >
                            <Save size={18} />
                            Salvar
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmação de Limpeza */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-yellow-400" size={24} />
                            <h3 className="text-xl font-bold text-white">Confirmar Limpeza</h3>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Tem certeza que deseja limpar todo o cache? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearCache}
                                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-500/90 transition-colors"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Informações do Cache */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Informações do Cache</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-gray-400 text-xs">Entrada Mais Antiga</span>
                        </div>
                        <p className="text-white font-medium">{formatDate(stats.oldestEntry)}</p>
                        <p className="text-gray-400 text-sm">{formatTime(stats.oldestEntry)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-gray-400 text-xs">Entrada Mais Recente</span>
                        </div>
                        <p className="text-white font-medium">{formatDate(stats.newestEntry)}</p>
                        <p className="text-gray-400 text-sm">{formatTime(stats.newestEntry)}</p>
                    </div>
                </div>
            </div>

            {/* Performance */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Performance</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Hit Rate</span>
                            <span className="text-green-400 font-medium">{stats.hitRate}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${stats.hitRate}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Miss Rate</span>
                            <span className="text-red-400 font-medium">{stats.missRate}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${stats.missRate}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Uso do Cache</span>
                            <span className="text-[#c4d82e] font-medium">{((stats.size / config.maxSize) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#c4d82e] rounded-full"
                                style={{ width: `${(stats.size / config.maxSize) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
