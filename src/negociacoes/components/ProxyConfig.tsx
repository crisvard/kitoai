import { useState } from 'react';
import { Shield, Globe, Lock, Unlock, RefreshCw, Plus, Trash2, Edit, Save, X, CheckCircle, XCircle, AlertCircle, Activity, Zap, Target, Clock, Settings } from 'lucide-react';

interface Proxy {
    id: string;
    name: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    protocol: 'http' | 'https' | 'socks5';
    country: string;
    status: 'active' | 'inactive' | 'error';
    lastUsed: string;
    requests: number;
    errors: number;
}

export default function ProxyConfig() {
    const [proxies, setProxies] = useState<Proxy[]>([
        {
            id: '1',
            name: 'Proxy Brasil 1',
            host: '182.253.12.45',
            port: 8080,
            username: 'user1',
            password: 'pass1',
            protocol: 'http',
            country: 'BR',
            status: 'active',
            lastUsed: new Date().toISOString(),
            requests: 1250,
            errors: 5,
        },
        {
            id: '2',
            name: 'Proxy EUA 1',
            host: '198.45.67.89',
            port: 3128,
            protocol: 'https',
            country: 'US',
            status: 'active',
            lastUsed: new Date().toISOString(),
            requests: 890,
            errors: 2,
        },
        {
            id: '3',
            name: 'Proxy UK 1',
            host: '82.145.67.123',
            port: 1080,
            protocol: 'socks5',
            country: 'UK',
            status: 'inactive',
            lastUsed: new Date(Date.now() - 3600000).toISOString(),
            requests: 450,
            errors: 15,
        },
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProxy, setEditingProxy] = useState<string | null>(null);
    const [newProxy, setNewProxy] = useState<Partial<Proxy>>({
        name: '',
        host: '',
        port: 8080,
        protocol: 'http',
        country: 'BR',
        status: 'active',
    });

    const handleAddProxy = () => {
        if (!newProxy.name || !newProxy.host) return;

        const proxy: Proxy = {
            id: Date.now().toString(),
            name: newProxy.name,
            host: newProxy.host,
            port: newProxy.port ?? 8080,
            username: newProxy.username,
            password: newProxy.password,
            protocol: newProxy.protocol ?? 'http',
            country: newProxy.country ?? 'BR',
            status: 'active',
            lastUsed: new Date().toISOString(),
            requests: 0,
            errors: 0,
        };

        setProxies([...proxies, proxy]);
        setNewProxy({
            name: '',
            host: '',
            port: 8080,
            protocol: 'http',
            country: 'BR',
            status: 'active',
        });
        setShowAddForm(false);
    };

    const handleDeleteProxy = (id: string) => {
        setProxies(proxies.filter(p => p.id !== id));
    };

    const handleToggleProxy = (id: string) => {
        setProxies(proxies.map(p =>
            p.id === id
                ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
                : p
        ));
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const activeProxies = proxies.filter(p => p.status === 'active').length;
    const totalRequests = proxies.reduce((sum, p) => sum + p.requests, 0);
    const totalErrors = proxies.reduce((sum, p) => sum + p.errors, 0);
    const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Proxy</h2>
                <p className="text-gray-400">Gerencie proxies para evitar bloqueios e rate limiting</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Proxies</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{proxies.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{activeProxies}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Requisições</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalRequests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{successRate}%</p>
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
                        Adicionar Proxy
                    </button>
                </div>
            </div>

            {/* Formulário de Adição */}
            {showAddForm && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Adicionar Proxy</h3>
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
                                value={newProxy.name}
                                onChange={(e) => setNewProxy({ ...newProxy, name: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Proxy Brasil 1"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Host</label>
                            <input
                                type="text"
                                value={newProxy.host}
                                onChange={(e) => setNewProxy({ ...newProxy, host: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="192.168.1.1"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Porta</label>
                            <input
                                type="number"
                                value={newProxy.port}
                                onChange={(e) => setNewProxy({ ...newProxy, port: parseInt(e.target.value) })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Protocolo</label>
                            <select
                                value={newProxy.protocol}
                                onChange={(e) => setNewProxy({ ...newProxy, protocol: e.target.value as any })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            >
                                <option value="http">HTTP</option>
                                <option value="https">HTTPS</option>
                                <option value="socks5">SOCKS5</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Usuário (opcional)</label>
                            <input
                                type="text"
                                value={newProxy.username || ''}
                                onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Senha (opcional)</label>
                            <input
                                type="password"
                                value={newProxy.password || ''}
                                onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleAddProxy}
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

            {/* Lista de Proxies */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Proxies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {proxies.map(proxy => (
                        <div
                            key={proxy.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${proxy.status === 'active'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {proxy.status === 'active' ? (
                                        <CheckCircle className="text-green-400" size={20} />
                                    ) : (
                                        <XCircle className="text-gray-400" size={20} />
                                    )}
                                    <h4 className="text-white font-bold">{proxy.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingProxy(proxy.id)}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <Edit size={14} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProxy(proxy.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-gray-400" />
                                    <span className="text-white">{proxy.host}:{proxy.port}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-gray-400" />
                                    <span className="text-white uppercase">{proxy.protocol}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-gray-400" />
                                    <span className="text-white">{proxy.country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-gray-400" />
                                    <span className="text-white">{proxy.requests} requisições</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={14} className="text-gray-400" />
                                    <span className={`font-medium ${proxy.errors > 0 ? 'text-red-400' : 'text-white'}`}>
                                        {proxy.errors} erros
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Último uso: {formatTime(proxy.lastUsed)}</span>
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => handleToggleProxy(proxy.id)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${proxy.status === 'active'
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        }`}
                                >
                                    {proxy.status === 'active' ? 'Desativar' : 'Ativar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Configurações de Rotação */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Configurações de Rotação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Estratégia de Rotação</label>
                        <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]">
                            <option value="round-robin">Round Robin</option>
                            <option value="random">Aleatório</option>
                            <option value="least-used">Menos Usado</option>
                            <option value="fastest">Mais Rápido</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Intervalo de Rotação (segundos)</label>
                        <input
                            type="number"
                            defaultValue={60}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Máximo de Requisições por Proxy</label>
                        <input
                            type="number"
                            defaultValue={100}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Timeout (segundos)</label>
                        <input
                            type="number"
                            defaultValue={30}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
