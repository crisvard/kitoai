import { useState } from 'react';
import { HardDrive, Download, Upload, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Settings, Database, Cloud, Server, Shield } from 'lucide-react';

interface Backup {
    id: string;
    name: string;
    type: 'full' | 'incremental' | 'differential';
    size: number; // em MB
    createdAt: string;
    status: 'completed' | 'pending' | 'failed';
    location: 'local' | 'cloud' | 's3';
}

interface BackupConfig {
    enabled: boolean;
    autoBackup: boolean;
    backupInterval: number; // em horas
    retentionDays: number;
    maxBackups: number;
    location: 'local' | 'cloud' | 's3';
    encryptBackups: boolean;
}

export default function BackupConfigComponent() {
    const [config, setConfig] = useState<BackupConfig>({
        enabled: true,
        autoBackup: true,
        backupInterval: 24,
        retentionDays: 30,
        maxBackups: 10,
        location: 'local',
        encryptBackups: true,
    });

    const [backups, setBackups] = useState<Backup[]>([
        {
            id: '1',
            name: 'backup-2026-03-26-03-00',
            type: 'full',
            size: 125.5,
            createdAt: new Date().toISOString(),
            status: 'completed',
            location: 'local',
        },
        {
            id: '2',
            name: 'backup-2026-03-25-03-00',
            type: 'full',
            size: 123.2,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            location: 'local',
        },
        {
            id: '3',
            name: 'backup-2026-03-24-03-00',
            type: 'incremental',
            size: 12.8,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'completed',
            location: 'cloud',
        },
        {
            id: '4',
            name: 'backup-2026-03-23-03-00',
            type: 'full',
            size: 120.1,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            status: 'completed',
            location: 's3',
        },
    ]);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBackupName, setNewBackupName] = useState('');

    const handleCreateBackup = () => {
        if (!newBackupName) return;

        const backup: Backup = {
            id: Date.now().toString(),
            name: newBackupName,
            type: 'full',
            size: Math.random() * 100 + 50,
            createdAt: new Date().toISOString(),
            status: 'pending',
            location: config.location,
        };

        setBackups([backup, ...backups]);
        setNewBackupName('');
        setShowCreateForm(false);

        // Simular conclusão do backup
        setTimeout(() => {
            setBackups(prev => prev.map(b =>
                b.id === backup.id
                    ? { ...b, status: 'completed' as const }
                    : b
            ));
        }, 3000);
    };

    const handleDeleteBackup = (id: string) => {
        setBackups(backups.filter(b => b.id !== id));
    };

    const handleDownloadBackup = (backup: Backup) => {
        // Simular download
        console.log('Downloading:', backup.name);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatSize = (mb: number) => {
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(1)} GB`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-400';
            case 'pending':
                return 'text-yellow-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/10 border-green-500/30';
            case 'pending':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'failed':
                return 'bg-red-500/10 border-red-500/30';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const getLocationIcon = (location: string) => {
        switch (location) {
            case 'local':
                return <HardDrive size={16} />;
            case 'cloud':
                return <Cloud size={16} />;
            case 's3':
                return <Server size={16} />;
            default:
                return <Database size={16} />;
        }
    };

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const completedBackups = backups.filter(b => b.status === 'completed').length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Backup</h2>
                <p className="text-gray-400">Gerencie backups do sistema de espelhamento</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Backups</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{backups.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Completos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{completedBackups}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Tamanho Total</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatSize(totalSize)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-blue-400" size={18} />
                        <span className="text-gray-400 text-sm">Próximo Backup</span>
                    </div>
                    <p className="text-2xl font-bold text-white">03:00</p>
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
                            id="backupEnabled"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="backupEnabled" className="text-gray-400 text-sm">
                            Backup Habilitado
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Intervalo de Backup (horas)</label>
                        <input
                            type="number"
                            value={config.backupInterval}
                            onChange={(e) => setConfig({ ...config, backupInterval: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Frequência de backup automático</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Retenção (dias)</label>
                        <input
                            type="number"
                            value={config.retentionDays}
                            onChange={(e) => setConfig({ ...config, retentionDays: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Dias para manter os backups</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Máximo de Backups</label>
                        <input
                            type="number"
                            value={config.maxBackups}
                            onChange={(e) => setConfig({ ...config, maxBackups: parseInt(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        />
                        <p className="text-gray-500 text-xs mt-1">Número máximo de backups armazenados</p>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Local de Armazenamento</label>
                        <select
                            value={config.location}
                            onChange={(e) => setConfig({ ...config, location: e.target.value as any })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="local">Local</option>
                            <option value="cloud">Cloud</option>
                            <option value="s3">AWS S3</option>
                        </select>
                        <p className="text-gray-500 text-xs mt-1">Onde armazenar os backups</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="autoBackup"
                            checked={config.autoBackup}
                            onChange={(e) => setConfig({ ...config, autoBackup: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="autoBackup" className="text-gray-400 text-sm">
                            Backup Automático
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="encryptBackups"
                            checked={config.encryptBackups}
                            onChange={(e) => setConfig({ ...config, encryptBackups: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#c4d82e] focus:ring-[#c4d82e]"
                        />
                        <label htmlFor="encryptBackups" className="text-gray-400 text-sm">
                            Criptografar Backups
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

            {/* Ações */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HardDrive className="text-[#c4d82e]" size={20} />
                        <span className="text-white font-medium">Ações</span>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Database size={18} />
                        Criar Backup
                    </button>
                </div>
            </div>

            {/* Formulário de Criação */}
            {showCreateForm && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Criar Backup</h3>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Nome do Backup</label>
                        <input
                            type="text"
                            value={newBackupName}
                            onChange={(e) => setNewBackupName(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                            placeholder="backup-2026-03-26-03-00"
                        />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleCreateBackup}
                            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                        >
                            <Database size={18} />
                            Criar
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de Backups */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Backups</h3>
                <div className="space-y-4">
                    {backups.map(backup => (
                        <div
                            key={backup.id}
                            className={`rounded-xl p-4 border ${getStatusBg(backup.status)}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {backup.status === 'completed' ? (
                                        <CheckCircle className="text-green-400" size={20} />
                                    ) : backup.status === 'pending' ? (
                                        <RefreshCw className="text-yellow-400 animate-spin" size={20} />
                                    ) : (
                                        <XCircle className="text-red-400" size={20} />
                                    )}
                                    <h4 className="text-white font-bold">{backup.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDownloadBackup(backup)}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <Download size={14} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBackup(backup.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Database size={14} className="text-gray-400" />
                                    <span className="text-white">Tipo: {backup.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <HardDrive size={14} className="text-gray-400" />
                                    <span className="text-white">Tamanho: {formatSize(backup.size)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Criado: {formatDate(backup.createdAt)} às {formatTime(backup.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getLocationIcon(backup.location)}
                                    <span className="text-white">Local: {backup.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
