import { useState } from 'react';
import { Key, Lock, Unlock, Eye, EyeOff, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Globe, Shield, Activity, Clock, Target } from 'lucide-react';

interface ApiKey {
    id: string;
    name: string;
    key: string;
    permissions: string[];
    enabled: boolean;
    createdAt: string;
    lastUsed: string;
    requests: number;
}

interface ApiEndpoint {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    enabled: boolean;
    rateLimit: number;
    authRequired: boolean;
}

export default function ApiConfigComponent() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        {
            id: '1',
            name: 'Chave Principal',
            key: 'sk_live_abc123xyz456',
            permissions: ['read', 'write', 'admin'],
            enabled: true,
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            lastUsed: new Date().toISOString(),
            requests: 12500,
        },
        {
            id: '2',
            name: 'Chave de Leitura',
            key: 'sk_live_def789uvw012',
            permissions: ['read'],
            enabled: true,
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
            lastUsed: new Date(Date.now() - 3600000).toISOString(),
            requests: 8900,
        },
        {
            id: '3',
            name: 'Chave de Teste',
            key: 'sk_test_ghi345rst678',
            permissions: ['read', 'write'],
            enabled: false,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            lastUsed: new Date(Date.now() - 86400000 * 2).toISOString(),
            requests: 450,
        },
    ]);

    const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
        {
            id: '1',
            path: '/api/odds',
            method: 'GET',
            enabled: true,
            rateLimit: 100,
            authRequired: true,
        },
        {
            id: '2',
            path: '/api/events',
            method: 'GET',
            enabled: true,
            rateLimit: 60,
            authRequired: true,
        },
        {
            id: '3',
            path: '/api/scrapers',
            method: 'POST',
            enabled: true,
            rateLimit: 10,
            authRequired: true,
        },
        {
            id: '4',
            path: '/api/config',
            method: 'PUT',
            enabled: true,
            rateLimit: 5,
            authRequired: true,
        },
    ]);

    const [showAddKey, setShowAddKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    const handleAddKey = () => {
        if (!newKeyName) return;

        const key: ApiKey = {
            id: Date.now().toString(),
            name: newKeyName,
            key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
            permissions: ['read'],
            enabled: true,
            createdAt: new Date().toISOString(),
            lastUsed: '',
            requests: 0,
        };

        setApiKeys([...apiKeys, key]);
        setNewKeyName('');
        setShowAddKey(false);
    };

    const handleToggleKey = (id: string) => {
        setApiKeys(apiKeys.map(k =>
            k.id === id
                ? { ...k, enabled: !k.enabled }
                : k
        ));
    };

    const handleDeleteKey = (id: string) => {
        setApiKeys(apiKeys.filter(k => k.id !== id));
    };

    const handleToggleEndpoint = (id: string) => {
        setEndpoints(endpoints.map(e =>
            e.id === id
                ? { ...e, enabled: !e.enabled }
                : e
        ));
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return 'Nunca';
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return 'Nunca';
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const maskKey = (key: string) => {
        if (key.length <= 8) return key;
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    };

    const enabledKeys = apiKeys.filter(k => k.enabled).length;
    const enabledEndpoints = endpoints.filter(e => e.enabled).length;
    const totalRequests = apiKeys.reduce((sum, k) => sum + k.requests, 0);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de API</h2>
                <p className="text-gray-400">Gerencie chaves de API e endpoints</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Chaves</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{apiKeys.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Chaves Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{enabledKeys}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Endpoints</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{enabledEndpoints}/{endpoints.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Requisições</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalRequests}</p>
                </div>
            </div>

            {/* Chaves de API */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Chaves de API</h3>
                    <button
                        onClick={() => setShowAddKey(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Key size={18} />
                        Adicionar Chave
                    </button>
                </div>

                {showAddKey && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nome da Chave</label>
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Nome da chave"
                            />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddKey}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Save size={18} />
                                Criar
                            </button>
                            <button
                                onClick={() => setShowAddKey(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {apiKeys.map(apiKey => (
                        <div
                            key={apiKey.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${apiKey.enabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Key className={apiKey.enabled ? 'text-green-400' : 'text-gray-400'} size={20} />
                                    <h4 className="text-white font-bold">{apiKey.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowKey({ ...showKey, [apiKey.id]: !showKey[apiKey.id] })}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        {showKey[apiKey.id] ? (
                                            <EyeOff size={14} className="text-white" />
                                        ) : (
                                            <Eye size={14} className="text-white" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleToggleKey(apiKey.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${apiKey.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {apiKey.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteKey(apiKey.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Lock size={14} className="text-gray-400" />
                                    <span className="text-white font-mono">
                                        {showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-gray-400" />
                                    <span className="text-white">Permissões: {apiKey.permissions.join(', ')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Criada: {formatDate(apiKey.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-gray-400" />
                                    <span className="text-white">Último uso: {formatTime(apiKey.lastUsed)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-gray-400" />
                                    <span className="text-white">Requisições: {apiKey.requests}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Endpoints */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Endpoints</h3>
                <div className="space-y-4">
                    {endpoints.map(endpoint => (
                        <div
                            key={endpoint.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${endpoint.enabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Globe className={endpoint.enabled ? 'text-green-400' : 'text-gray-400'} size={20} />
                                    <div>
                                        <h4 className="text-white font-bold">{endpoint.path}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded ${endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                                endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                                    endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                            }`}>
                                            {endpoint.method}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleEndpoint(endpoint.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${endpoint.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {endpoint.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-gray-400" />
                                    <span className="text-white">Rate Limit: {endpoint.rateLimit} req/min</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-gray-400" />
                                    <span className="text-white">Auth: {endpoint.authRequired ? 'Obrigatório' : 'Opcional'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
