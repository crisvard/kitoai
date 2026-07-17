import { useState } from 'react';
import { Shield, Lock, Unlock, Key, Eye, EyeOff, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Settings, Fingerprint, UserCheck, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SecurityConfig {
    enabled: boolean;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
    sessionTimeout: number; // em minutos
    maxLoginAttempts: number;
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
    };
    encryptionEnabled: boolean;
    auditLog: boolean;
}

interface SecurityEvent {
    id: string;
    timestamp: string;
    type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'ip_blocked' | 'suspicious';
    user: string;
    ip: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function SecurityConfigComponent() {
    const [config, setConfig] = useState<SecurityConfig>({
        enabled: true,
        twoFactorAuth: true,
        ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
        },
        encryptionEnabled: true,
        auditLog: true,
    });

    const [events, setEvents] = useState<SecurityEvent[]>([
        {
            id: '1',
            timestamp: new Date().toISOString(),
            type: 'login',
            user: 'admin',
            ip: '192.168.1.100',
            details: 'Login bem-sucedido',
            severity: 'low',
        },
        {
            id: '2',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: 'failed_login',
            user: 'unknown',
            ip: '45.33.32.156',
            details: 'Tentativa de login falhou - senha incorreta',
            severity: 'medium',
        },
        {
            id: '3',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            type: 'ip_blocked',
            user: 'unknown',
            ip: '185.220.101.1',
            details: 'IP bloqueado após 5 tentativas falhas',
            severity: 'high',
        },
        {
            id: '4',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            type: 'suspicious',
            user: 'admin',
            ip: '192.168.1.100',
            details: 'Acesso a múltiplas contas em curto período',
            severity: 'critical',
        },
    ]);

    const [showAddIp, setShowAddIp] = useState(false);
    const [newIp, setNewIp] = useState('');

    const handleAddIp = () => {
        if (!newIp) return;
        setConfig({
            ...config,
            ipWhitelist: [...config.ipWhitelist, newIp],
        });
        setNewIp('');
        setShowAddIp(false);
    };

    const handleRemoveIp = (ip: string) => {
        setConfig({
            ...config,
            ipWhitelist: config.ipWhitelist.filter(i => i !== ip),
        });
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'text-red-400';
            case 'high':
                return 'text-orange-400';
            case 'medium':
                return 'text-yellow-400';
            case 'low':
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-500/10 border-red-500/30';
            case 'high':
                return 'bg-orange-500/10 border-orange-500/30';
            case 'medium':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'low':
                return 'bg-green-500/10 border-green-500/30';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'login':
                return <UserCheck size={16} />;
            case 'logout':
                return <Unlock size={16} />;
            case 'failed_login':
                return <XCircle size={16} />;
            case 'password_change':
                return <Key size={16} />;
            case 'ip_blocked':
                return <ShieldAlert size={16} />;
            case 'suspicious':
                return <AlertCircle size={16} />;
            default:
                return <Shield size={16} />;
        }
    };

    const stats = {
        totalEvents: events.length,
        critical: events.filter(e => e.severity === 'critical').length,
        high: events.filter(e => e.severity === 'high').length,
        medium: events.filter(e => e.severity === 'medium').length,
        low: events.filter(e => e.severity === 'low').length,
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Segurança</h2>
                <p className="text-gray-400">Gerencie configurações de segurança e auditoria</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Eventos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Críticos</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="text-orange-400" size={18} />
                        <span className="text-gray-400 text-sm">Altos</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-yellow-400" size={18} />
                        <span className="text-gray-400 text-sm">Médios</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Baixos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.low}</p>
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
                            id="securityEnabled"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="securityEnabled" className="text-gray-400 text-sm">
                            Segurança Habilitada
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Timeout de Sessão (minutos)</label>
                        <input
                            type="number"
                            value={config.sessionTimeout}
                            onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Tempo limite de inatividade</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Máximo de Tentativas de Login</label>
                        <input
                            type="number"
                            value={config.maxLoginAttempts}
                            onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Tentativas antes de bloquear</p>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="twoFactorAuth"
                            checked={config.twoFactorAuth}
                            onChange={(e) => setConfig({ ...config, twoFactorAuth: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="twoFactorAuth" className="text-gray-400 text-sm">
                            Autenticação de Dois Fatores (2FA)
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="encryptionEnabled"
                            checked={config.encryptionEnabled}
                            onChange={(e) => setConfig({ ...config, encryptionEnabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="encryptionEnabled" className="text-gray-400 text-sm">
                            Criptografia Habilitada
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="auditLog"
                            checked={config.auditLog}
                            onChange={(e) => setConfig({ ...config, auditLog: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="auditLog" className="text-gray-400 text-sm">
                            Log de Auditoria
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

            {/* Política de Senha */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Política de Senha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Comprimento Mínimo</label>
                        <input
                            type="number"
                            value={config.passwordPolicy.minLength}
                            onChange={(e) => setConfig({
                                ...config,
                                passwordPolicy: { ...config.passwordPolicy, minLength: parseInt(e.target.value) }
                            })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="requireUppercase"
                                checked={config.passwordPolicy.requireUppercase}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, requireUppercase: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="requireUppercase" className="text-gray-400 text-sm">
                                Exigir Maiúsculas
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="requireLowercase"
                                checked={config.passwordPolicy.requireLowercase}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, requireLowercase: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="requireLowercase" className="text-gray-400 text-sm">
                                Exigir Minúsculas
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="requireNumbers"
                                checked={config.passwordPolicy.requireNumbers}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, requireNumbers: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="requireNumbers" className="text-gray-400 text-sm">
                                Exigir Números
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="requireSpecialChars"
                                checked={config.passwordPolicy.requireSpecialChars}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, requireSpecialChars: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="requireSpecialChars" className="text-gray-400 text-sm">
                                Exigir Caracteres Especiais
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de IPs Permitidos */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">IPs Permitidos</h3>
                    <button
                        onClick={() => setShowAddIp(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Shield size={18} />
                        Adicionar IP
                    </button>
                </div>

                {showAddIp && (
                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={newIp}
                            onChange={(e) => setNewIp(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            placeholder="192.168.1.0/24"
                        />
                        <button
                            onClick={handleAddIp}
                            className="bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                        >
                            Adicionar
                        </button>
                        <button
                            onClick={() => setShowAddIp(false)}
                            className="bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                <div className="space-y-2">
                    {config.ipWhitelist.map((ip, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-green-400" />
                                <span className="text-white">{ip}</span>
                            </div>
                            <button
                                onClick={() => handleRemoveIp(ip)}
                                className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                <X size={14} className="text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Eventos de Segurança */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Eventos de Segurança</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <RefreshCw size={18} />
                        Atualizar
                    </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {events.map(event => (
                        <div
                            key={event.id}
                            className={`rounded-lg p-3 border ${getSeverityBg(event.severity)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={getSeverityColor(event.severity)}>
                                        {getTypeIcon(event.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white font-medium">{event.user}</span>
                                            <span className="text-gray-400 text-xs">{event.ip}</span>
                                            <span className="text-gray-400 text-xs">{formatTime(event.timestamp)}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">{event.details}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(event.severity)} ${getSeverityBg(event.severity)}`}>
                                    {event.severity}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
