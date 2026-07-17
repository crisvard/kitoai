import { useState } from 'react';
import { Activity, Bell, Mail, MessageSquare, Slack, Webhook, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, BarChart3, TrendingUp, TrendingDown, Clock, Settings, Zap, Target } from 'lucide-react';

interface Alert {
    id: string;
    name: string;
    type: 'error' | 'warning' | 'info';
    condition: string;
    threshold: number;
    enabled: boolean;
    channels: string[];
    lastTriggered: string;
    triggerCount: number;
}

interface MonitoringStats {
    totalAlerts: number;
    activeAlerts: number;
    triggeredToday: number;
    successRate: number;
    averageResponseTime: number;
}

export default function MonitoringConfigComponent() {
    const [alerts, setAlerts] = useState<Alert[]>([
        {
            id: '1',
            name: 'Scraper com Erro',
            type: 'error',
            condition: 'errors > 5',
            threshold: 5,
            enabled: true,
            channels: ['email', 'slack'],
            lastTriggered: new Date(Date.now() - 3600000).toISOString(),
            triggerCount: 3,
        },
        {
            id: '2',
            name: 'Taxa de Sucesso Baixa',
            type: 'warning',
            condition: 'successRate < 90',
            threshold: 90,
            enabled: true,
            channels: ['email'],
            lastTriggered: new Date(Date.now() - 7200000).toISOString(),
            triggerCount: 1,
        },
        {
            id: '3',
            name: 'Rate Limit Atingido',
            type: 'warning',
            condition: 'rateLimit > 80',
            threshold: 80,
            enabled: true,
            channels: ['slack', 'webhook'],
            lastTriggered: new Date().toISOString(),
            triggerCount: 5,
        },
        {
            id: '4',
            name: 'Odds Não Atualizadas',
            type: 'info',
            condition: 'lastUpdate > 60',
            threshold: 60,
            enabled: false,
            channels: ['email'],
            lastTriggered: '',
            triggerCount: 0,
        },
    ]);

    const [stats, setStats] = useState<MonitoringStats>({
        totalAlerts: 4,
        activeAlerts: 3,
        triggeredToday: 8,
        successRate: 98.5,
        averageResponseTime: 1.2,
    });

    const [showAddForm, setShowAddForm] = useState(false);
    const [newAlert, setNewAlert] = useState<Partial<Alert>>({
        name: '',
        type: 'warning',
        condition: '',
        threshold: 0,
        enabled: true,
        channels: ['email'],
    });

    const handleAddAlert = () => {
        if (!newAlert.name || !newAlert.condition) return;

        const alert: Alert = {
            id: Date.now().toString(),
            name: newAlert.name,
            type: newAlert.type ?? 'warning',
            condition: newAlert.condition,
            threshold: newAlert.threshold ?? 0,
            enabled: newAlert.enabled ?? true,
            channels: newAlert.channels ?? ['email'],
            lastTriggered: '',
            triggerCount: 0,
        };

        setAlerts([...alerts, alert]);
        setNewAlert({
            name: '',
            type: 'warning',
            condition: '',
            threshold: 0,
            enabled: true,
            channels: ['email'],
        });
        setShowAddForm(false);
    };

    const handleToggleAlert = (id: string) => {
        setAlerts(alerts.map(a =>
            a.id === id
                ? { ...a, enabled: !a.enabled }
                : a
        ));
    };

    const handleDeleteAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return 'Nunca';
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'error':
                return 'text-red-400';
            case 'warning':
                return 'text-yellow-400';
            case 'info':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
        }
    };

    const getTypeBg = (type: string) => {
        switch (type) {
            case 'error':
                return 'bg-red-500/10 border-red-500/30';
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/30';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Monitoramento</h2>
                <p className="text-gray-400">Configure alertas e notificações para monitorar o sistema</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Bell className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Alertas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalAlerts}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.activeAlerts}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-yellow-400" size={18} />
                        <span className="text-gray-400 text-sm">Disparados Hoje</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{stats.triggeredToday}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
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
                        <Bell size={18} />
                        Adicionar Alerta
                    </button>
                </div>
            </div>

            {/* Formulário de Adição */}
            {showAddForm && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Adicionar Alerta</h3>
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
                                value={newAlert.name}
                                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Nome do alerta"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Tipo</label>
                            <select
                                value={newAlert.type}
                                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            >
                                <option value="error">Erro</option>
                                <option value="warning">Aviso</option>
                                <option value="info">Informação</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Condição</label>
                            <input
                                type="text"
                                value={newAlert.condition}
                                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Ex: errors > 5"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Threshold</label>
                            <input
                                type="number"
                                value={newAlert.threshold}
                                onChange={(e) => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleAddAlert}
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

            {/* Lista de Alertas */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Alertas</h3>
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${getTypeBg(alert.type)} ${alert.enabled ? '' : 'opacity-50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className={getTypeColor(alert.type)} size={20} />
                                    <h4 className="text-white font-bold">{alert.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleAlert(alert.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${alert.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {alert.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAlert(alert.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-gray-400" />
                                    <span className="text-white">Condição: {alert.condition}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-gray-400" />
                                    <span className="text-white">Threshold: {alert.threshold}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Último disparo: {formatTime(alert.lastTriggered)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-gray-400" />
                                    <span className="text-white">Disparado {alert.triggerCount} vezes</span>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="flex flex-wrap gap-2">
                                    {alert.channels.map((channel, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300">
                                            {channel === 'email' && <Mail size={12} className="inline mr-1" />}
                                            {channel === 'slack' && <Slack size={12} className="inline mr-1" />}
                                            {channel === 'webhook' && <Webhook size={12} className="inline mr-1" />}
                                            {channel}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Canais de Notificação */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Canais de Notificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="text-[#c4d82e]" size={20} />
                            <h4 className="text-white font-bold">Email</h4>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">Receba alertas por email</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="emailEnabled"
                                defaultChecked
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="emailEnabled" className="text-gray-400 text-sm">
                                Habilitado
                            </label>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <Slack className="text-[#c4d82e]" size={20} />
                            <h4 className="text-white font-bold">Slack</h4>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">Receba alertas no Slack</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="slackEnabled"
                                defaultChecked
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="slackEnabled" className="text-gray-400 text-sm">
                                Habilitado
                            </label>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <Webhook className="text-[#c4d82e]" size={20} />
                            <h4 className="text-white font-bold">Webhook</h4>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">Receba alertas via webhook</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="webhookEnabled"
                                defaultChecked
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                            />
                            <label htmlFor="webhookEnabled" className="text-gray-400 text-sm">
                                Habilitado
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs de Monitoramento */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Logs de Monitoramento</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <BarChart3 size={18} />
                        Ver Todos
                    </button>
                </div>
                <div className="space-y-2">
                    {[
                        { time: '03:32:15', type: 'warning', message: 'Rate limit atingido (80%)' },
                        { time: '03:30:12', type: 'success', message: 'Todos os scrapers funcionando' },
                        { time: '03:28:45', type: 'error', message: 'Bet365 scraper com erro' },
                        { time: '03:25:30', type: 'success', message: 'Odds atualizadas com sucesso' },
                        { time: '03:20:18', type: 'warning', message: 'Taxa de sucesso abaixo de 90%' },
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
