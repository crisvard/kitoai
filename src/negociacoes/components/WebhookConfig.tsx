import { useState } from 'react';
import { Webhook, Globe, Lock, Unlock, Eye, EyeOff, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Activity, Clock, Target, Zap, Send, Download } from 'lucide-react';

interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: string[];
    enabled: boolean;
    secret: string;
    createdAt: string;
    lastTriggered: string;
    successCount: number;
    failureCount: number;
}

interface WebhookEvent {
    id: string;
    webhookId: string;
    event: string;
    timestamp: string;
    status: 'success' | 'failed' | 'pending';
    responseCode?: number;
    responseTime?: number;
}

export default function WebhookConfigComponent() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
        {
            id: '1',
            name: 'Webhook Principal',
            url: 'https://api.exemplo.com/webhook',
            events: ['odds_updated', 'scraper_error', 'backup_complete'],
            enabled: true,
            secret: 'whsec_abc123xyz456',
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            lastTriggered: new Date().toISOString(),
            successCount: 1250,
            failureCount: 5,
        },
        {
            id: '2',
            name: 'Webhook Slack',
            url: 'https://hooks.slack.com/services/...',
            events: ['scraper_error', 'security_alert'],
            enabled: true,
            secret: 'whsec_def789uvw012',
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
            lastTriggered: new Date(Date.now() - 3600000).toISOString(),
            successCount: 890,
            failureCount: 2,
        },
        {
            id: '3',
            name: 'Webhook Backup',
            url: 'https://backup.exemplo.com/webhook',
            events: ['backup_complete'],
            enabled: false,
            secret: 'whsec_ghi345rst678',
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            lastTriggered: new Date(Date.now() - 86400000 * 2).toISOString(),
            successCount: 45,
            failureCount: 0,
        },
    ]);

    const [events, setEvents] = useState<WebhookEvent[]>([
        {
            id: '1',
            webhookId: '1',
            event: 'odds_updated',
            timestamp: new Date().toISOString(),
            status: 'success',
            responseCode: 200,
            responseTime: 125,
        },
        {
            id: '2',
            webhookId: '1',
            event: 'scraper_error',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            status: 'success',
            responseCode: 200,
            responseTime: 98,
        },
        {
            id: '3',
            webhookId: '2',
            event: 'security_alert',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            status: 'failed',
            responseCode: 500,
            responseTime: 5000,
        },
    ]);

    const [showAddWebhook, setShowAddWebhook] = useState(false);
    const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
        name: '',
        url: '',
        events: [],
        enabled: true,
        secret: '',
    });
    const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

    const handleAddWebhook = () => {
        if (!newWebhook.name || !newWebhook.url) return;

        const webhook: WebhookConfig = {
            id: Date.now().toString(),
            name: newWebhook.name,
            url: newWebhook.url,
            events: newWebhook.events ?? [],
            enabled: newWebhook.enabled ?? true,
            secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
            createdAt: new Date().toISOString(),
            lastTriggered: '',
            successCount: 0,
            failureCount: 0,
        };

        setWebhooks([...webhooks, webhook]);
        setNewWebhook({
            name: '',
            url: '',
            events: [],
            enabled: true,
            secret: '',
        });
        setShowAddWebhook(false);
    };

    const handleToggleWebhook = (id: string) => {
        setWebhooks(webhooks.map(w =>
            w.id === id
                ? { ...w, enabled: !w.enabled }
                : w
        ));
    };

    const handleDeleteWebhook = (id: string) => {
        setWebhooks(webhooks.filter(w => w.id !== id));
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

    const maskSecret = (secret: string) => {
        if (secret.length <= 8) return secret;
        return `${secret.substring(0, 8)}...`;
    };

    const enabledWebhooks = webhooks.filter(w => w.enabled).length;
    const totalEvents = webhooks.reduce((sum, w) => sum + w.successCount + w.failureCount, 0);
    const successRate = totalEvents > 0
        ? ((webhooks.reduce((sum, w) => sum + w.successCount, 0) / totalEvents) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Webhooks</h2>
                <p className="text-gray-400">Gerencie webhooks para receber notificações em tempo real</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Webhook className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Webhooks</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{webhooks.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Webhooks Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{enabledWebhooks}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Eventos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalEvents}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{successRate}%</p>
                </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Webhooks</h3>
                    <button
                        onClick={() => setShowAddWebhook(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Webhook size={18} />
                        Adicionar Webhook
                    </button>
                </div>

                {showAddWebhook && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                                <input
                                    type="text"
                                    value={newWebhook.name}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="Nome do webhook"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">URL</label>
                                <input
                                    type="text"
                                    value={newWebhook.url}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddWebhook}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Save size={18} />
                                Criar
                            </button>
                            <button
                                onClick={() => setShowAddWebhook(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {webhooks.map(webhook => (
                        <div
                            key={webhook.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${webhook.enabled
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Webhook className={webhook.enabled ? 'text-green-400' : 'text-gray-400'} size={20} />
                                    <h4 className="text-white font-bold">{webhook.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowSecret({ ...showSecret, [webhook.id]: !showSecret[webhook.id] })}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        {showSecret[webhook.id] ? (
                                            <EyeOff size={14} className="text-white" />
                                        ) : (
                                            <Eye size={14} className="text-white" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleToggleWebhook(webhook.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${webhook.enabled
                                            ? 'bg-green-500/20 hover:bg-green-500/30'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {webhook.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-gray-400" />
                                    <span className="text-white truncate">{webhook.url}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Lock size={14} className="text-gray-400" />
                                    <span className="text-white font-mono">
                                        {showSecret[webhook.id] ? webhook.secret : maskSecret(webhook.secret)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-gray-400" />
                                    <span className="text-white">Eventos: {webhook.events.join(', ')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Último disparo: {formatTime(webhook.lastTriggered)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Send size={14} className="text-gray-400" />
                                    <span className="text-white">Sucesso: {webhook.successCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Receive size={14} className="text-gray-400" />
                                    <span className="text-white">Falhas: {webhook.failureCount}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Eventos Recentes */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Eventos Recentes</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <RefreshCw size={18} />
                        Atualizar
                    </button>
                </div>
                <div className="space-y-2">
                    {events.map(event => {
                        const webhook = webhooks.find(w => w.id === event.webhookId);
                        return (
                            <div
                                key={event.id}
                                className={`flex items-center gap-4 p-3 rounded-lg ${event.status === 'success' ? 'bg-green-500/10' :
                                    event.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                                    }`}
                            >
                                <span className="text-gray-400 text-xs font-mono">{formatTime(event.timestamp)}</span>
                                {event.status === 'success' ? (
                                    <CheckCircle className="text-green-400" size={16} />
                                ) : event.status === 'failed' ? (
                                    <XCircle className="text-red-400" size={16} />
                                ) : (
                                    <Clock className="text-yellow-400" size={16} />
                                )}
                                <span className="text-white text-sm">{webhook?.name}</span>
                                <span className="text-gray-400 text-sm">{event.event}</span>
                                {event.responseCode && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${event.responseCode === 200 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {event.responseCode}
                                    </span>
                                )}
                                {event.responseTime && (
                                    <span className="text-gray-400 text-xs">{event.responseTime}ms</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
