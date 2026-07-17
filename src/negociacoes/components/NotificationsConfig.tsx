import { useState } from 'react';
import { Bell, Mail, MessageSquare, Slack, Webhook, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';

interface NotificationChannel {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'push' | 'sms';
    enabled: boolean;
    config: Record<string, any>;
}

interface NotificationRule {
    id: string;
    name: string;
    event: string;
    channels: string[];
    enabled: boolean;
    conditions: Record<string, any>;
}

export default function NotificationsConfigComponent() {
    const [channels, setChannels] = useState<NotificationChannel[]>([
        {
            id: '1',
            name: 'Email Principal',
            type: 'email',
            enabled: true,
            config: { email: 'admin@exemplo.com' },
        },
        {
            id: '2',
            name: 'Slack Geral',
            type: 'slack',
            enabled: true,
            config: { webhook: 'https://hooks.slack.com/services/...' },
        },
        {
            id: '3',
            name: 'Webhook API',
            type: 'webhook',
            enabled: false,
            config: { url: 'https://api.exemplo.com/webhook' },
        },
        {
            id: '4',
            name: 'Push Mobile',
            type: 'push',
            enabled: true,
            config: { token: 'abc123...' },
        },
    ]);

    const [rules, setRules] = useState<NotificationRule[]>([
        {
            id: '1',
            name: 'Scraper com Erro',
            event: 'scraper_error',
            channels: ['1', '2'],
            enabled: true,
            conditions: { errors: 5 },
        },
        {
            id: '2',
            name: 'Odds Atualizadas',
            event: 'odds_updated',
            channels: ['1'],
            enabled: true,
            conditions: { minEvents: 10 },
        },
        {
            id: '3',
            name: 'Rate Limit Atingido',
            event: 'rate_limit',
            channels: ['1', '2', '4'],
            enabled: true,
            conditions: { percentage: 80 },
        },
        {
            id: '4',
            name: 'Backup Completo',
            event: 'backup_complete',
            channels: ['1'],
            enabled: false,
            conditions: {},
        },
    ]);

    const [showAddChannel, setShowAddChannel] = useState(false);
    const [showAddRule, setShowAddRule] = useState(false);
    const [newChannel, setNewChannel] = useState<Partial<NotificationChannel>>({
        name: '',
        type: 'email',
        enabled: true,
        config: {},
    });
    const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
        name: '',
        event: '',
        channels: [],
        enabled: true,
        conditions: {},
    });

    const handleAddChannel = () => {
        if (!newChannel.name) return;

        const channel: NotificationChannel = {
            id: Date.now().toString(),
            name: newChannel.name,
            type: newChannel.type ?? 'email',
            enabled: newChannel.enabled ?? true,
            config: newChannel.config ?? {},
        };

        setChannels([...channels, channel]);
        setNewChannel({
            name: '',
            type: 'email',
            enabled: true,
            config: {},
        });
        setShowAddChannel(false);
    };

    const handleAddRule = () => {
        if (!newRule.name || !newRule.event) return;

        const rule: NotificationRule = {
            id: Date.now().toString(),
            name: newRule.name,
            event: newRule.event,
            channels: newRule.channels ?? [],
            enabled: newRule.enabled ?? true,
            conditions: newRule.conditions ?? {},
        };

        setRules([...rules, rule]);
        setNewRule({
            name: '',
            event: '',
            channels: [],
            enabled: true,
            conditions: {},
        });
        setShowAddRule(false);
    };

    const handleToggleChannel = (id: string) => {
        setChannels(channels.map(c =>
            c.id === id
                ? { ...c, enabled: !c.enabled }
                : c
        ));
    };

    const handleToggleRule = (id: string) => {
        setRules(rules.map(r =>
            r.id === id
                ? { ...r, enabled: !r.enabled }
                : r
        ));
    };

    const handleDeleteChannel = (id: string) => {
        setChannels(channels.filter(c => c.id !== id));
    };

    const handleDeleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'email':
                return <Mail size={16} />;
            case 'slack':
                return <Slack size={16} />;
            case 'webhook':
                return <Webhook size={16} />;
            case 'push':
                return <Smartphone size={16} />;
            case 'sms':
                return <MessageSquare size={16} />;
            default:
                return <Bell size={16} />;
        }
    };

    const enabledChannels = channels.filter(c => c.enabled).length;
    const enabledRules = rules.filter(r => r.enabled).length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Notificações</h2>
                <p className="text-gray-400">Gerencie canais e regras de notificação</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Bell className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Canais</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{channels.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Canais Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{enabledChannels}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Regras</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{rules.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Regras Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{enabledRules}</p>
                </div>
            </div>

            {/* Canais de Notificação */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Canais de Notificação</h3>
                    <button
                        onClick={() => setShowAddChannel(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Bell size={18} />
                        Adicionar Canal
                    </button>
                </div>

                {showAddChannel && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                                <input
                                    type="text"
                                    value={newChannel.name}
                                    onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="Nome do canal"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Tipo</label>
                                <select
                                    value={newChannel.type}
                                    onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value as any })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                >
                                    <option value="email">Email</option>
                                    <option value="slack">Slack</option>
                                    <option value="webhook">Webhook</option>
                                    <option value="push">Push</option>
                                    <option value="sms">SMS</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddChannel}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                            <button
                                onClick={() => setShowAddChannel(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {channels.map(channel => (
                        <div
                            key={channel.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${channel.enabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={channel.enabled ? 'text-green-400' : 'text-gray-400'}>
                                        {getChannelIcon(channel.type)}
                                    </div>
                                    <h4 className="text-white font-bold">{channel.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleChannel(channel.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${channel.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {channel.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteChannel(channel.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400">
                                Tipo: {channel.type}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Regras de Notificação */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Regras de Notificação</h3>
                    <button
                        onClick={() => setShowAddRule(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Settings size={18} />
                        Adicionar Regra
                    </button>
                </div>

                {showAddRule && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                                <input
                                    type="text"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="Nome da regra"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Evento</label>
                                <select
                                    value={newRule.event}
                                    onChange={(e) => setNewRule({ ...newRule, event: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="scraper_error">Erro no Scraper</option>
                                    <option value="odds_updated">Odds Atualizadas</option>
                                    <option value="rate_limit">Rate Limit</option>
                                    <option value="backup_complete">Backup Completo</option>
                                    <option value="security_alert">Alerta de Segurança</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddRule}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                            <button
                                onClick={() => setShowAddRule(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {rules.map(rule => (
                        <div
                            key={rule.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${rule.enabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Bell className={rule.enabled ? 'text-green-400' : 'text-gray-400'} size={20} />
                                    <h4 className="text-white font-bold">{rule.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleRule(rule.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${rule.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {rule.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Settings size={14} className="text-gray-400" />
                                    <span className="text-white">Evento: {rule.event}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bell size={14} className="text-gray-400" />
                                    <span className="text-white">
                                        Canais: {rule.channels.map(c => channels.find(ch => ch.id === c)?.name).join(', ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
