import { useState } from 'react';
import { Shield, Clock, Activity, Zap, Target, Settings, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface RateLimitConfig {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
    cooldownPeriod: number; // em segundos
    strategy: 'fixed' | 'sliding' | 'token-bucket';
}

interface RateLimitStats {
    currentRequests: number;
    remainingRequests: number;
    resetTime: string;
    blockedRequests: number;
    successRate: number;
}

export default function RateLimitConfigComponent() {
    const [config, setConfig] = useState<RateLimitConfig>({
        enabled: true,
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 10,
        cooldownPeriod: 60,
        strategy: 'sliding',
    });

    const [stats, setStats] = useState<RateLimitStats>({
        currentRequests: 45,
        remainingRequests: 15,
        resetTime: new Date(Date.now() + 60000).toISOString(),
        blockedRequests: 12,
        successRate: 98.5,
    });

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatSeconds = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h`;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Rate Limiting</h2>
                <p className="text-gray-400">Controle a taxa de requisições para evitar bloqueios</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Requisições Atuais</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.currentRequests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Restantes</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.remainingRequests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Bloqueadas</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{stats.blockedRequests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
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
                            id="rateLimitEnabled"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="rateLimitEnabled" className="text-gray-400 text-sm">
                            Rate Limiting Habilitado
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Requisições por Minuto</label>
                        <input
                            type="number"
                            value={config.requestsPerMinute}
                            onChange={(e) => setConfig({ ...config, requestsPerMinute: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Máximo de requisições por minuto</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Requisições por Hora</label>
                        <input
                            type="number"
                            value={config.requestsPerHour}
                            onChange={(e) => setConfig({ ...config, requestsPerHour: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Máximo de requisições por hora</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Requisições por Dia</label>
                        <input
                            type="number"
                            value={config.requestsPerDay}
                            onChange={(e) => setConfig({ ...config, requestsPerDay: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Máximo de requisições por dia</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Limite de Burst</label>
                        <input
                            type="number"
                            value={config.burstLimit}
                            onChange={(e) => setConfig({ ...config, burstLimit: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Requisições simultâneas permitidas</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Período de Cooldown (segundos)</label>
                        <input
                            type="number"
                            value={config.cooldownPeriod}
                            onChange={(e) => setConfig({ ...config, cooldownPeriod: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Tempo de espera após limite atingido</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Estratégia</label>
                        <select
                            value={config.strategy}
                            onChange={(e) => setConfig({ ...config, strategy: e.target.value as any })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="fixed">Fixed Window</option>
                            <option value="sliding">Sliding Window</option>
                            <option value="token-bucket">Token Bucket</option>
                        </select>
                        <p className="text-gray-500 text-xs mt-1">Algoritmo de rate limiting</p>
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

            {/* Status Atual */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Status Atual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-gray-400 text-xs">Reset em</span>
                        </div>
                        <p className="text-white font-medium">{formatTime(stats.resetTime)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={16} className="text-gray-400" />
                            <span className="text-gray-400 text-xs">Uso Atual</span>
                        </div>
                        <p className="text-white font-medium">
                            {stats.currentRequests} / {config.requestsPerMinute} por minuto
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Performance</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Uso por Minuto</span>
                            <span className="text-[#c4d82e] font-medium">
                                {((stats.currentRequests / config.requestsPerMinute) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#c4d82e] rounded-full"
                                style={{ width: `${(stats.currentRequests / config.requestsPerMinute) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                            <span className="text-green-400 font-medium">{stats.successRate}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${stats.successRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs de Rate Limiting */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Logs de Rate Limiting</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <BarChart3 size={18} />
                        Ver Todos
                    </button>
                </div>
                <div className="space-y-2">
                    {[
                        { time: '03:28:15', type: 'success', message: 'Requisição permitida (45/60)' },
                        { time: '03:28:14', type: 'success', message: 'Requisição permitida (44/60)' },
                        { time: '03:28:13', type: 'blocked', message: 'Requisição bloqueada - limite atingido' },
                        { time: '03:28:12', type: 'success', message: 'Requisição permitida (43/60)' },
                        { time: '03:28:11', type: 'success', message: 'Requisição permitida (42/60)' },
                    ].map((log, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-3 rounded-lg ${log.type === 'blocked' ? 'bg-red-500/10' : 'bg-green-500/10'
                                }`}
                        >
                            <span className="text-gray-400 text-xs font-mono">{log.time}</span>
                            {log.type === 'blocked' ? (
                                <XCircle className="text-red-400" size={16} />
                            ) : (
                                <CheckCircle className="text-green-400" size={16} />
                            )}
                            <span className={`text-sm ${log.type === 'blocked' ? 'text-red-400' : 'text-green-400'
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
