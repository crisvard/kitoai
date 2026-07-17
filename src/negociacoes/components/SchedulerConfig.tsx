import { useState } from 'react';
import { Calendar, Clock, Play, Pause, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Activity, Target, Zap, Plus, Edit } from 'lucide-react';

interface ScheduledTask {
    id: string;
    name: string;
    type: 'scraping' | 'backup' | 'cleanup' | 'notification' | 'report';
    schedule: string; // cron expression
    enabled: boolean;
    lastRun: string;
    nextRun: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    config: Record<string, any>;
}

export default function SchedulerConfigComponent() {
    const [tasks, setTasks] = useState<ScheduledTask[]>([
        {
            id: '1',
            name: 'Scraping de Odds',
            type: 'scraping',
            schedule: '*/5 * * * *', // A cada 5 minutos
            enabled: true,
            lastRun: new Date().toISOString(),
            nextRun: new Date(Date.now() + 300000).toISOString(),
            status: 'idle',
            config: { bookmakers: ['Betano', 'Bet365', 'Stake'] },
        },
        {
            id: '2',
            name: 'Backup Diário',
            type: 'backup',
            schedule: '0 3 * * *', // Todo dia às 3h
            enabled: true,
            lastRun: new Date(Date.now() - 86400000).toISOString(),
            nextRun: new Date(Date.now() + 86400000 - (Date.now() % 86400000) + 10800000).toISOString(),
            status: 'idle',
            config: { type: 'full', location: 'local' },
        },
        {
            id: '3',
            name: 'Limpeza de Cache',
            type: 'cleanup',
            schedule: '0 */6 * * *', // A cada 6 horas
            enabled: true,
            lastRun: new Date(Date.now() - 21600000).toISOString(),
            nextRun: new Date(Date.now() + 21600000 - (Date.now() % 21600000)).toISOString(),
            status: 'idle',
            config: { maxAge: 86400 },
        },
        {
            id: '4',
            name: 'Relatório Semanal',
            type: 'report',
            schedule: '0 9 * * 1', // Toda segunda às 9h
            enabled: false,
            lastRun: new Date(Date.now() - 604800000).toISOString(),
            nextRun: new Date(Date.now() + 604800000 - (Date.now() % 604800000) + 32400000).toISOString(),
            status: 'idle',
            config: { email: 'admin@exemplo.com' },
        },
    ]);

    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState<Partial<ScheduledTask>>({
        name: '',
        type: 'scraping',
        schedule: '',
        enabled: true,
        config: {},
    });

    const handleAddTask = () => {
        if (!newTask.name || !newTask.schedule) return;

        const task: ScheduledTask = {
            id: Date.now().toString(),
            name: newTask.name,
            type: newTask.type ?? 'scraping',
            schedule: newTask.schedule,
            enabled: newTask.enabled ?? true,
            lastRun: '',
            nextRun: '',
            status: 'idle',
            config: newTask.config ?? {},
        };

        setTasks([...tasks, task]);
        setNewTask({
            name: '',
            type: 'scraping',
            schedule: '',
            enabled: true,
            config: {},
        });
        setShowAddTask(false);
    };

    const handleToggleTask = (id: string) => {
        setTasks(tasks.map(t =>
            t.id === id
                ? { ...t, enabled: !t.enabled }
                : t
        ));
    };

    const handleDeleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleRunTask = (id: string) => {
        setTasks(tasks.map(t =>
            t.id === id
                ? { ...t, status: 'running' as const }
                : t
        ));

        // Simular execução
        setTimeout(() => {
            setTasks(prev => prev.map(t =>
                t.id === id
                    ? {
                        ...t,
                        status: 'completed' as const,
                        lastRun: new Date().toISOString(),
                    }
                    : t
            ));
        }, 3000);
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

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'scraping':
                return 'Scraping';
            case 'backup':
                return 'Backup';
            case 'cleanup':
                return 'Limpeza';
            case 'notification':
                return 'Notificação';
            case 'report':
                return 'Relatório';
            default:
                return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'scraping':
                return 'text-blue-400';
            case 'backup':
                return 'text-green-400';
            case 'cleanup':
                return 'text-yellow-400';
            case 'notification':
                return 'text-purple-400';
            case 'report':
                return 'text-orange-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'text-yellow-400';
            case 'completed':
                return 'text-green-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'completed':
                return 'bg-green-500/10 border-green-500/30';
            case 'failed':
                return 'bg-red-500/10 border-red-500/30';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const enabledTasks = tasks.filter(t => t.enabled).length;
    const runningTasks = tasks.filter(t => t.status === 'running').length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Agendamento</h2>
                <p className="text-gray-400">Gerencie tarefas agendadas do sistema</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Tarefas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{tasks.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Tarefas Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{enabledTasks}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-yellow-400" size={18} />
                        <span className="text-gray-400 text-sm">Em Execução</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{runningTasks}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Próxima Execução</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {tasks.filter(t => t.enabled).sort((a, b) =>
                            new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime()
                        )[0]?.nextRun ? formatTime(tasks.filter(t => t.enabled).sort((a, b) =>
                            new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime()
                        )[0].nextRun) : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Tarefas Agendadas */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Tarefas Agendadas</h3>
                    <button
                        onClick={() => setShowAddTask(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Plus size={18} />
                        Adicionar Tarefa
                    </button>
                </div>

                {showAddTask && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                                <input
                                    type="text"
                                    value={newTask.name}
                                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="Nome da tarefa"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Tipo</label>
                                <select
                                    value={newTask.type}
                                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value as any })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                >
                                    <option value="scraping">Scraping</option>
                                    <option value="backup">Backup</option>
                                    <option value="cleanup">Limpeza</option>
                                    <option value="notification">Notificação</option>
                                    <option value="report">Relatório</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Agendamento (Cron)</label>
                                <input
                                    type="text"
                                    value={newTask.schedule}
                                    onChange={(e) => setNewTask({ ...newTask, schedule: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="*/5 * * * *"
                                />
                                <p className="text-gray-500 text-xs mt-1">Ex: */5 * * * * (a cada 5 minutos)</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddTask}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Save size={18} />
                                Criar
                            </button>
                            <button
                                onClick={() => setShowAddTask(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${task.enabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Calendar className={task.enabled ? 'text-green-400' : 'text-gray-400'} size={20} />
                                    <div>
                                        <h4 className="text-white font-bold">{task.name}</h4>
                                        <span className={`text-xs ${getTypeColor(task.type)}`}>
                                            {getTypeLabel(task.type)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRunTask(task.id)}
                                        disabled={task.status === 'running'}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                                    >
                                        <Play size={14} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleTask(task.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${task.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {task.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Agendamento: {task.schedule}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-gray-400" />
                                    <span className="text-white">Última execução: {formatTime(task.lastRun)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-gray-400" />
                                    <span className="text-white">Próxima execução: {formatTime(task.nextRun)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-gray-400" />
                                    <span className={`font-medium ${getStatusColor(task.status)}`}>
                                        Status: {task.status === 'idle' ? 'Ocioso' :
                                            task.status === 'running' ? 'Executando' :
                                                task.status === 'completed' ? 'Concluído' : 'Falhou'}
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
