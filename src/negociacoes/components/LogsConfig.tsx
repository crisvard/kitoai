import { useState } from 'react';
import { FileText, Search, Filter, Download, Trash2, RefreshCw, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Copy, Check, Settings, Activity, Target, Zap, Clock, Globe, Lock, Unlock, Shield, Key, Eye, EyeOff, BarChart3, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize, Minimize, Move, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, ArrowUpCircle, ArrowDownCircle, ArrowLeftCircle, ArrowRightCircle, ArrowUpSquare, ArrowDownSquare, ArrowLeftSquare, ArrowRightSquare, ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUpFromLine, ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromDot, ArrowDownFromDot, ArrowLeftFromDot, ArrowRightFromDot, ArrowUpFromLine as ArrowUpFromLineIcon, ArrowDownFromLine as ArrowDownFromLineIcon, ArrowLeftFromLine as ArrowLeftFromLineIcon, ArrowRightFromLine as ArrowRightFromLineIcon, ArrowUpFromDot as ArrowUpFromDotIcon, ArrowDownFromDot as ArrowDownFromDotIcon, ArrowLeftFromDot as ArrowLeftFromDotIcon, ArrowRightFromDot as ArrowRightFromDotIcon, ArrowUpToLine as ArrowUpToLineIcon, ArrowDownToLine as ArrowDownToLineIcon, ArrowLeftToLine as ArrowLeftToLineIcon, ArrowRightToLine as ArrowRightToLineIcon, ArrowUpSquare as ArrowUpSquareIcon, ArrowDownSquare as ArrowDownSquareIcon, ArrowLeftSquare as ArrowLeftSquareIcon, ArrowRightSquare as ArrowRightSquareIcon, ArrowUpCircle as ArrowUpCircleIcon, ArrowDownCircle as ArrowDownCircleIcon, ArrowLeftCircle as ArrowLeftCircleIcon, ArrowRightCircle as ArrowRightCircleIcon, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, ArrowUpDown, ArrowLeftRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUpLeftSquare, ArrowUpRightSquare, ArrowDownLeftSquare, ArrowDownRightSquare, ArrowUpLeftCircle, ArrowUpRightCircle, ArrowDownLeftCircle, ArrowDownRightCircle, ArrowUpLeftToLine, ArrowUpRightToLine, ArrowDownLeftToLine, ArrowDownRightToLine, ArrowUpLeftFromLine, ArrowUpRightFromLine, ArrowDownLeftFromLine, ArrowDownRightFromLine, ArrowUpLeftFromDot, ArrowUpRightFromDot, ArrowDownLeftFromDot, ArrowDownRightFromDot, ArrowUpLeftSquare as ArrowUpLeftSquareIcon, ArrowUpRightSquare as ArrowUpRightSquareIcon, ArrowDownLeftSquare as ArrowDownLeftSquareIcon, ArrowDownRightSquare as ArrowDownRightSquareIcon, ArrowUpLeftCircle as ArrowUpLeftCircleIcon, ArrowUpRightCircle as ArrowUpRightCircleIcon, ArrowDownLeftCircle as ArrowDownLeftCircleIcon, ArrowDownRightCircle as ArrowDownRightCircleIcon, ArrowUpLeftToLine as ArrowUpLeftToLineIcon, ArrowUpRightToLine as ArrowUpRightToLineIcon, ArrowDownLeftToLine as ArrowDownLeftToLineIcon, ArrowDownRightToLine as ArrowDownRightToLineIcon, ArrowUpLeftFromLine as ArrowUpLeftFromLineIcon, ArrowUpRightFromLine as ArrowUpRightFromLineIcon, ArrowDownLeftFromLine as ArrowDownLeftFromLineIcon, ArrowDownRightFromLine as ArrowDownRightFromLineIcon, ArrowUpLeftFromDot as ArrowUpLeftFromDotIcon, ArrowUpRightFromDot as ArrowUpRightFromDotIcon, ArrowDownLeftFromDot as ArrowDownLeftFromDotIcon, ArrowDownRightFromDot as ArrowDownRightFromDotIcon, ArrowUpDown as ArrowUpDownIcon, ArrowLeftRight as ArrowLeftRightIcon, ArrowUpLeft as ArrowUpLeftIcon, ArrowUpRight as ArrowUpRightIcon, ArrowDownLeft as ArrowDownLeftIcon, ArrowDownRight as ArrowDownRightIcon } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    source: string;
    message: string;
    details?: string;
}

export default function LogsConfigComponent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const logs: LogEntry[] = [
        {
            id: '1',
            timestamp: '2026-03-26 03:50:12',
            level: 'info',
            source: 'Betano Scraper',
            message: 'Odds atualizadas com sucesso',
            details: '15 eventos coletados em 2.3s',
        },
        {
            id: '2',
            timestamp: '2026-03-26 03:50:10',
            level: 'warning',
            source: 'Rate Limiter',
            message: 'Rate limit atingido (80%)',
            details: '48/60 requisições por minuto',
        },
        {
            id: '3',
            timestamp: '2026-03-26 03:50:08',
            level: 'error',
            source: 'Bet365 Scraper',
            message: 'Timeout ao conectar',
            details: 'Connection timeout after 30s',
        },
        {
            id: '4',
            timestamp: '2026-03-26 03:50:05',
            level: 'info',
            source: 'Cache',
            message: 'Cache limpo automaticamente',
            details: '1250 entradas removidas',
        },
        {
            id: '5',
            timestamp: '2026-03-26 03:50:02',
            level: 'debug',
            source: 'Proxy Manager',
            message: 'Proxy rotacionado',
            details: 'Proxy Brasil 1 → Proxy EUA 1',
        },
        {
            id: '6',
            timestamp: '2026-03-26 03:49:58',
            level: 'info',
            source: 'Stake Scraper',
            message: 'Odds atualizadas com sucesso',
            details: '12 eventos coletados em 1.8s',
        },
        {
            id: '7',
            timestamp: '2026-03-26 03:49:55',
            level: 'warning',
            source: 'Monitoring',
            message: 'Taxa de sucesso abaixo de 90%',
            details: 'Taxa atual: 85.5%',
        },
        {
            id: '8',
            timestamp: '2026-03-26 03:49:50',
            level: 'error',
            source: '1xBet Scraper',
            message: 'Seletor não encontrado',
            details: 'Elemento [data-testid="event-card"] não existe',
        },
    ];

    const sources = [...new Set(logs.map(l => l.source))];

    const toggleLog = (id: string) => {
        setExpandedLogs(prev =>
            prev.includes(id)
                ? prev.filter(l => l !== id)
                : [...prev, id]
        );
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error':
                return 'text-red-400';
            case 'warning':
                return 'text-yellow-400';
            case 'info':
                return 'text-blue-400';
            case 'debug':
                return 'text-gray-400';
            default:
                return 'text-gray-400';
        }
    };

    const getLevelBg = (level: string) => {
        switch (level) {
            case 'error':
                return 'bg-red-500/10 border-red-500/30';
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/30';
            case 'debug':
                return 'bg-white/5 border-white/10';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error':
                return <XCircle size={16} />;
            case 'warning':
                return <AlertCircle size={16} />;
            case 'info':
                return <CheckCircle size={16} />;
            case 'debug':
                return <FileText size={16} />;
            default:
                return <FileText size={16} />;
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filterLevel !== 'all' && log.level !== filterLevel) return false;
        if (filterSource !== 'all' && log.source !== filterSource) return false;
        if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: logs.length,
        info: logs.filter(l => l.level === 'info').length,
        warning: logs.filter(l => l.level === 'warning').length,
        error: logs.filter(l => l.level === 'error').length,
        debug: logs.filter(l => l.level === 'debug').length,
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Logs do Sistema</h2>
                <p className="text-gray-400">Visualize e gerencie logs do sistema de espelhamento</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-blue-400" size={18} />
                        <span className="text-gray-400 text-sm">Info</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{stats.info}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-yellow-400" size={18} />
                        <span className="text-gray-400 text-sm">Warning</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{stats.warning}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Error</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{stats.error}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-gray-400" size={18} />
                        <span className="text-gray-400 text-sm">Debug</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-400">{stats.debug}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Filtros</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                            <Download size={18} />
                            Exportar
                        </button>
                        <button className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors">
                            <Trash2 size={18} />
                            Limpar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Buscar logs..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Nível</label>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="all">Todos</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                            <option value="debug">Debug</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs mb-1 block">Fonte</label>
                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                        >
                            <option value="all">Todas</option>
                            {sources.map(source => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Logs */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Logs</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <RefreshCw size={18} />
                        Atualizar
                    </button>
                </div>

                <div className="space-y-2">
                    {filteredLogs.map(log => (
                        <div
                            key={log.id}
                            className={`rounded-xl border ${getLevelBg(log.level)} overflow-hidden`}
                        >
                            <button
                                onClick={() => toggleLog(log.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={getLevelColor(log.level)}>
                                        {getLevelIcon(log.level)}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{log.source}</span>
                                            <span className="text-gray-400 text-xs">{log.timestamp}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">{log.message}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(JSON.stringify(log, null, 2), log.id);
                                        }}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        {copiedId === log.id ? (
                                            <Check size={14} className="text-green-400" />
                                        ) : (
                                            <Copy size={14} className="text-white" />
                                        )}
                                    </button>
                                    {expandedLogs.includes(log.id) ? (
                                        <ChevronUp className="text-gray-400" size={16} />
                                    ) : (
                                        <ChevronDown className="text-gray-400" size={16} />
                                    )}
                                </div>
                            </button>

                            {expandedLogs.includes(log.id) && (
                                <div className="px-4 pb-4">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-gray-400 text-xs mb-1">Detalhes:</p>
                                        <p className="text-white text-sm">{log.details}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
