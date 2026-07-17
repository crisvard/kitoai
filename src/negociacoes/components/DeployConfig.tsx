import { useState } from 'react';
import { Rocket, GitBranch, GitCommit, GitPullRequest, Play, Pause, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Activity, Target, Zap, Plus, Edit, BarChart3, Clock, FileText, Server, Cloud, HardDrive, Database, Globe, Lock, Unlock, Shield, Key, Eye, EyeOff, Download, Upload, Copy, ExternalLink, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize, Minimize, Move, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, ArrowUpCircle, ArrowDownCircle, ArrowLeftCircle, ArrowRightCircle, ArrowUpSquare, ArrowDownSquare, ArrowLeftSquare, ArrowRightSquare, ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUpFromLine, ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromDot, ArrowDownFromDot, ArrowLeftFromDot, ArrowRightFromDot, ArrowUpFromLine as ArrowUpFromLineIcon, ArrowDownFromLine as ArrowDownFromLineIcon, ArrowLeftFromLine as ArrowLeftFromLineIcon, ArrowRightFromLine as ArrowRightFromLineIcon, ArrowUpFromDot as ArrowUpFromDotIcon, ArrowDownFromDot as ArrowDownFromDotIcon, ArrowLeftFromDot as ArrowLeftFromDotIcon, ArrowRightFromDot as ArrowRightFromDotIcon, ArrowUpToLine as ArrowUpToLineIcon, ArrowDownToLine as ArrowDownToLineIcon, ArrowLeftToLine as ArrowLeftToLineIcon, ArrowRightToLine as ArrowRightToLineIcon, ArrowUpSquare as ArrowUpSquareIcon, ArrowDownSquare as ArrowDownSquareIcon, ArrowLeftSquare as ArrowLeftSquareIcon, ArrowRightSquare as ArrowRightSquareIcon, ArrowUpCircle as ArrowUpCircleIcon, ArrowDownCircle as ArrowDownCircleIcon, ArrowLeftCircle as ArrowLeftCircleIcon, ArrowRightCircle as ArrowRightCircleIcon, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, ArrowUpDown, ArrowLeftRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUpLeftSquare, ArrowUpRightSquare, ArrowDownLeftSquare, ArrowDownRightSquare, ArrowUpLeftCircle, ArrowUpRightCircle, ArrowDownLeftCircle, ArrowDownRightCircle, ArrowUpLeftToLine, ArrowUpRightToLine, ArrowDownLeftToLine, ArrowDownRightToLine, ArrowUpLeftFromLine, ArrowUpRightFromLine, ArrowDownLeftFromLine, ArrowDownRightFromLine, ArrowUpLeftFromDot, ArrowUpRightFromDot, ArrowDownLeftFromDot, ArrowDownRightFromDot, ArrowUpLeftSquare as ArrowUpLeftSquareIcon, ArrowUpRightSquare as ArrowUpRightSquareIcon, ArrowDownLeftSquare as ArrowDownLeftSquareIcon, ArrowDownRightSquare as ArrowDownRightSquareIcon, ArrowUpLeftCircle as ArrowUpLeftCircleIcon, ArrowUpRightCircle as ArrowUpRightCircleIcon, ArrowDownLeftCircle as ArrowDownLeftCircleIcon, ArrowDownRightCircle as ArrowDownRightCircleIcon, ArrowUpLeftToLine as ArrowUpLeftToLineIcon, ArrowUpRightToLine as ArrowUpRightToLineIcon, ArrowDownLeftToLine as ArrowDownLeftToLineIcon, ArrowDownRightToLine as ArrowDownRightToLineIcon, ArrowUpLeftFromLine as ArrowUpLeftFromLineIcon, ArrowUpRightFromLine as ArrowUpRightFromLineIcon, ArrowDownLeftFromLine as ArrowDownLeftFromLineIcon, ArrowDownRightFromLine as ArrowDownRightFromLineIcon, ArrowUpLeftFromDot as ArrowUpLeftFromDotIcon, ArrowUpRightFromDot as ArrowUpRightFromDotIcon, ArrowDownLeftFromDot as ArrowDownLeftFromDotIcon, ArrowDownRightFromDot as ArrowDownRightFromDotIcon, ArrowUpDown as ArrowUpDownIcon, ArrowLeftRight as ArrowLeftRightIcon, ArrowUpLeft as ArrowUpLeftIcon, ArrowUpRight as ArrowUpRightIcon, ArrowDownLeft as ArrowDownLeftIcon, ArrowDownRight as ArrowDownRightIcon } from 'lucide-react';

interface DeployEnvironment {
    id: string;
    name: string;
    type: 'development' | 'staging' | 'production';
    url: string;
    status: 'active' | 'inactive' | 'deploying' | 'failed';
    lastDeploy: string;
    version: string;
    branch: string;
}

interface DeployHistory {
    id: string;
    environment: string;
    version: string;
    branch: string;
    commit: string;
    timestamp: string;
    status: 'success' | 'failed' | 'rolling_back';
    duration: number;
    user: string;
}

export default function DeployConfigComponent() {
    const [environments, setEnvironments] = useState<DeployEnvironment[]>([
        {
            id: '1',
            name: 'Development',
            type: 'development',
            url: 'https://dev.mirrorhub.com',
            status: 'active',
            lastDeploy: new Date().toISOString(),
            version: '1.2.3-dev',
            branch: 'develop',
        },
        {
            id: '2',
            name: 'Staging',
            type: 'staging',
            url: 'https://staging.mirrorhub.com',
            status: 'active',
            lastDeploy: new Date(Date.now() - 86400000).toISOString(),
            version: '1.2.2',
            branch: 'release/1.2.2',
        },
        {
            id: '3',
            name: 'Production',
            type: 'production',
            url: 'https://mirrorhub.com',
            status: 'active',
            lastDeploy: new Date(Date.now() - 172800000).toISOString(),
            version: '1.2.1',
            branch: 'main',
        },
    ]);

    const [deployHistory, setDeployHistory] = useState<DeployHistory[]>([
        {
            id: '1',
            environment: 'Production',
            version: '1.2.1',
            branch: 'main',
            commit: 'abc1234',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            status: 'success',
            duration: 120000,
            user: 'admin',
        },
        {
            id: '2',
            environment: 'Staging',
            version: '1.2.2',
            branch: 'release/1.2.2',
            commit: 'def5678',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            status: 'success',
            duration: 95000,
            user: 'admin',
        },
        {
            id: '3',
            environment: 'Development',
            version: '1.2.3-dev',
            branch: 'develop',
            commit: 'ghi9012',
            timestamp: new Date().toISOString(),
            status: 'success',
            duration: 45000,
            user: 'developer',
        },
    ]);

    const [showDeployModal, setShowDeployModal] = useState(false);
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
    const [deployBranch, setDeployBranch] = useState('main');

    const handleDeploy = () => {
        if (!selectedEnvironment) return;

        setEnvironments(environments.map(e =>
            e.id === selectedEnvironment
                ? { ...e, status: 'deploying' as const }
                : e
        ));

        // Simular deploy
        setTimeout(() => {
            setEnvironments(prev => prev.map(e =>
                e.id === selectedEnvironment
                    ? {
                        ...e,
                        status: 'active' as const,
                        lastDeploy: new Date().toISOString(),
                        version: `${e.version.split('-')[0]}-deployed`,
                    }
                    : e
            ));

            const env = environments.find(e => e.id === selectedEnvironment);
            if (env) {
                const newDeploy: DeployHistory = {
                    id: Date.now().toString(),
                    environment: env.name,
                    version: env.version,
                    branch: deployBranch,
                    commit: Math.random().toString(36).substring(2, 9),
                    timestamp: new Date().toISOString(),
                    status: 'success',
                    duration: Math.random() * 120000 + 30000,
                    user: 'admin',
                };
                setDeployHistory([newDeploy, ...deployHistory]);
            }

            setShowDeployModal(false);
            setSelectedEnvironment('');
            setDeployBranch('main');
        }, 5000);
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

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'text-green-400';
            case 'deploying':
                return 'text-yellow-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 border-green-500/30';
            case 'deploying':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'failed':
                return 'bg-red-500/10 border-red-500/30';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'development':
                return 'text-blue-400';
            case 'staging':
                return 'text-yellow-400';
            case 'production':
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'development':
                return <GitBranch size={16} />;
            case 'staging':
                return <GitPullRequest size={16} />;
            case 'production':
                return <Rocket size={16} />;
            default:
                return <Server size={16} />;
        }
    };

    const activeEnvironments = environments.filter(e => e.status === 'active').length;
    const deployingEnvironments = environments.filter(e => e.status === 'deploying').length;
    const successfulDeploys = deployHistory.filter(d => d.status === 'success').length;
    const failedDeploys = deployHistory.filter(d => d.status === 'failed').length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Deploy</h2>
                <p className="text-gray-400">Gerencie ambientes e deploys do sistema</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Server className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Ambientes</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{environments.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{activeEnvironments}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Rocket className="text-yellow-400" size={18} />
                        <span className="text-gray-400 text-sm">Deployando</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{deployingEnvironments}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Deploys Bem-sucedidos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{successfulDeploys}</p>
                </div>
            </div>

            {/* Ambientes */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Ambientes</h3>
                    <button
                        onClick={() => setShowDeployModal(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Rocket size={18} />
                        Fazer Deploy
                    </button>
                </div>

                {showDeployModal && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Ambiente</label>
                                <select
                                    value={selectedEnvironment}
                                    onChange={(e) => setSelectedEnvironment(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                >
                                    <option value="">Selecione...</option>
                                    {environments.map(env => (
                                        <option key={env.id} value={env.id}>{env.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Branch</label>
                                <input
                                    type="text"
                                    value={deployBranch}
                                    onChange={(e) => setDeployBranch(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                    placeholder="main"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleDeploy}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Rocket size={18} />
                                Deploy
                            </button>
                            <button
                                onClick={() => setShowDeployModal(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {environments.map(env => (
                        <div
                            key={env.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${getStatusBg(env.status)}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={getTypeColor(env.type)}>
                                        {getTypeIcon(env.type)}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{env.name}</h4>
                                        <span className={`text-xs ${getTypeColor(env.type)}`}>
                                            {env.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={env.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <ExternalLink size={14} className="text-white" />
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-gray-400" />
                                    <span className="text-white truncate">{env.url}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GitBranch size={14} className="text-gray-400" />
                                    <span className="text-white">Branch: {env.branch}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-gray-400" />
                                    <span className="text-white">Versão: {env.version}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-white">Último deploy: {formatTime(env.lastDeploy)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-gray-400" />
                                    <span className={`font-medium ${getStatusColor(env.status)}`}>
                                        Status: {env.status === 'active' ? 'Ativo' :
                                            env.status === 'deploying' ? 'Deployando' :
                                                env.status === 'failed' ? 'Falhou' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Histórico de Deploys */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Histórico de Deploys</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <RefreshCw size={18} />
                        Atualizar
                    </button>
                </div>
                <div className="space-y-2">
                    {deployHistory.map(deploy => (
                        <div
                            key={deploy.id}
                            className={`flex items-center gap-4 p-3 rounded-lg ${deploy.status === 'success' ? 'bg-green-500/10' :
                                    deploy.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                                }`}
                        >
                            <span className="text-gray-400 text-xs font-mono">{formatTime(deploy.timestamp)}</span>
                            {deploy.status === 'success' ? (
                                <CheckCircle className="text-green-400" size={16} />
                            ) : deploy.status === 'failed' ? (
                                <XCircle className="text-red-400" size={16} />
                            ) : (
                                <RefreshCw className="text-yellow-400 animate-spin" size={16} />
                            )}
                            <span className="text-white text-sm">{deploy.environment}</span>
                            <span className="text-gray-400 text-sm">{deploy.version}</span>
                            <span className="text-gray-400 text-sm">{deploy.branch}</span>
                            <span className="text-gray-400 text-xs">{deploy.commit}</span>
                            <span className="text-gray-400 text-xs">{formatDuration(deploy.duration)}</span>
                            <span className="text-gray-400 text-xs">{deploy.user}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
