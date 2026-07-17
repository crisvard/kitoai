import { useState } from 'react';
import { Zap, Activity, Clock, Cpu, HardDrive, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface PerformanceConfig {
    enabled: boolean;
    maxConcurrentRequests: number;
    requestTimeout: number; // em segundos
    connectionPoolSize: number;
    cacheEnabled: boolean;
    compressionEnabled: boolean;
    lazyLoading: boolean;
    prefetchEnabled: boolean;
}

interface PerformanceStats {
    averageResponseTime: number; // em ms
    requestsPerSecond: number;
    activeConnections: number;
    memoryUsage: number; // em MB
    cpuUsage: number; // em %
    cacheHitRate: number; // em %
    errorRate: number; // em %
}

export default function PerformanceConfigComponent() {
    const [config, setConfig] = useState<PerformanceConfig>({
        enabled: true,
        maxConcurrentRequests: 10,
        requestTimeout: 30,
        connectionPoolSize: 20,
        cacheEnabled: true,
        compressionEnabled: true,
        lazyLoading: true,
        prefetchEnabled: false,
    });

    const [stats, setStats] = useState<PerformanceStats>({
        averageResponseTime: 1250,
        requestsPerSecond: 8.5,
        activeConnections: 12,
        memoryUsage: 256,
        cpuUsage: 45,
        cacheHitRate: 85.5,
        errorRate: 1.2,
    });

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatSize = (mb: number) => {
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(1)} GB`;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Performance</h2>
                <p className="text-gray-400">Otimize a performance do sistema de espelhamento</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Tempo de Resposta</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatTime(stats.averageResponseTime)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Requisições/s</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.requestsPerSecond}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Conexões Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.activeConnections}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Cache Hit Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.cacheHitRate}%</p>
                </div>
            </div>

            {/* Uso de Recursos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Memória</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatSize(stats.memoryUsage)}</p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#c4d82e] rounded-full"
                            style={{ width: `${(stats.memoryUsage / 512) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">CPU</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.cpuUsage}%</p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#c4d82e] rounded-full"
                            style={{ width: `${stats.cpuUsage}%` }}
                        ></div>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Disco</span>
                    </div>
                    <p className="text-2xl font-bold text-white">45 GB</p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#c4d82e] rounded-full"
                            style={{ width: '45%' }}
                        ></div>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Erro</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{stats.errorRate}%</p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${stats.errorRate}%` }}
                        ></div>
                    </div>
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
                            id="performanceEnabled"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="performanceEnabled" className="text-gray-400 text-sm">
                            Otimização Habilitada
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Máximo de Requisições Concorrentes</label>
                        <input
                            type="number"
                            value={config.maxConcurrentRequests}
                            onChange={(e) => setConfig({ ...config, maxConcurrentRequests: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Requisições simultâneas permitidas</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Timeout de Requisição (segundos)</label>
                        <input
                            type="number"
                            value={config.requestTimeout}
                            onChange={(e) => setConfig({ ...config, requestTimeout: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Tempo limite para requisições</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Tamanho do Pool de Conexões</label>
                        <input
                            type="number"
                            value={config.connectionPoolSize}
                            onChange={(e) => setConfig({ ...config, connectionPoolSize: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Número de conexões no pool</p>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="cacheEnabled"
                            checked={config.cacheEnabled}
                            onChange={(e) => setConfig({ ...config, cacheEnabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="cacheEnabled" className="text-gray-400 text-sm">
                            Cache Habilitado
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="compressionEnabled"
                            checked={config.compressionEnabled}
                            onChange={(e) => setConfig({ ...config, compressionEnabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="compressionEnabled" className="text-gray-400 text-sm">
                            Compressão Habilitada
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="lazyLoading"
                            checked={config.lazyLoading}
                            onChange={(e) => setConfig({ ...config, lazyLoading: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="lazyLoading" className="text-gray-400 text-sm">
                            Lazy Loading
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="prefetchEnabled"
                            checked={config.prefetchEnabled}
                            onChange={(e) => setConfig({ ...config, prefetchEnabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="prefetchEnabled" className="text-gray-400 text-sm">
                            Prefetch Habilitado
                        </label>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => setConfig({ ...config })}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Save size={18} />
                        Salvar
                    </button>
                </div>
            </div>

            {/* Métricas de Performance */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Métricas de Performance</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Tempo de Resposta Médio</span>
                            <span className="text-[#c4d82e] font-medium">{formatTime(stats.averageResponseTime)}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#c4d82e] rounded-full"
                                style={{ width: `${Math.min((stats.averageResponseTime / 2000) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Cache Hit Rate</span>
                            <span className="text-green-400 font-medium">{stats.cacheHitRate}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${stats.cacheHitRate}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Uso de CPU</span>
                            <span className="text-[#c4d82e] font-medium">{stats.cpuUsage}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#c4d82e] rounded-full"
                                style={{ width: `${stats.cpuUsage}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Uso de Memória</span>
                            <span className="text-[#c4d82e] font-medium">{formatSize(stats.memoryUsage)}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#c4d82e] rounded-full"
                                style={{ width: `${(stats.memoryUsage / 512) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs de Performance */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Logs de Performance</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <BarChart3 size={18} />
                        Ver Todos
                    </button>
                </div>
                <div className="space-y-2">
                    {[
                        { time: '03:38:12', type: 'success', message: 'Requisição completada em 1.2s' },
                        { time: '03:38:10', type: 'warning', message: 'Timeout atingido (30s)' },
                        { time: '03:38:08', type: 'success', message: 'Cache hit para odds Betano' },
                        { time: '03:38:05', type: 'error', message: 'Conexão recusada - pool cheio' },
                        { time: '03:38:02', type: 'success', message: 'Requisição completada em 0.8s' },
                    ].map((log, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-3 rounded-lg ${log.type === 'error' ? 'bg-red-500/10' :
                                log.type === 'warning' ? 'bg-yellow-500/10' : 'bg-green-500/10'
                                }`}
                        >
                            <span className="text-gray-400 text-xs font-mono">{log.time}</span>
                            {log.type === 'error' ? (
                                <XCircle className="text-red-400" size={16} />
                            ) : log.type === 'warning' ? (
                                <AlertCircle className="text-yellow-400" size={16} />
                            ) : (
                                <CheckCircle className="text-green-400" size={16} />
                            )}
                            <span className={`text-sm ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'warning' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
