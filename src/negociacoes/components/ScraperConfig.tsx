import { useState } from 'react';
import { Settings, Play, Pause, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, Activity, Zap, Target, BarChart3 } from 'lucide-react';
import { ScraperStatus } from '../types/bookmaker';

interface ScraperConfigProps {
    scraperStatuses: ScraperStatus[];
    onToggleScraper: (name: string) => void;
    onRefreshScraper: (name: string) => void;
    onRefreshAll: () => void;
}

export default function ScraperConfig({
    scraperStatuses,
    onToggleScraper,
    onRefreshScraper,
    onRefreshAll
}: ScraperConfigProps) {
    const [selectedScraper, setSelectedScraper] = useState<string | null>(null);

    const formatTime = (isoString: string) => {
        if (!isoString) return 'Nunca';
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="text-green-400" size={20} />;
            case 'error':
                return <XCircle className="text-red-400" size={20} />;
            case 'inactive':
                return <AlertCircle className="text-gray-400" size={20} />;
            default:
                return <AlertCircle className="text-gray-400" size={20} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 border-green-500/30';
            case 'error':
                return 'bg-red-500/10 border-red-500/30';
            case 'inactive':
                return 'bg-white/5 border-white/10';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const activeScrapers = scraperStatuses.filter(s => s.status === 'active').length;
    const errorScrapers = scraperStatuses.filter(s => s.status === 'error').length;
    const totalEvents = scraperStatuses.reduce((sum, s) => sum + s.eventsScraped, 0);
    const totalErrors = scraperStatuses.reduce((sum, s) => sum + s.errors, 0);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Scrapers</h2>
                <p className="text-gray-400">Gerencie e monitore os scrapers de casas de apostas</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{activeScrapers}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Com Erro</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{errorScrapers}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Eventos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalEvents}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-yellow-400" size={18} />
                        <span className="text-gray-400 text-sm">Erros</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalErrors}</p>
                </div>
            </div>

            {/* Ações */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Settings className="text-[#c4d82e]" size={20} />
                        <span className="text-white font-medium">Ações</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onRefreshAll}
                            className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Atualizar Todos
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Scrapers */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Scrapers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scraperStatuses.map(scraper => (
                        <div
                            key={scraper.name}
                            onClick={() => setSelectedScraper(scraper.name === selectedScraper ? null : scraper.name)}
                            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${getStatusColor(scraper.status)} ${selectedScraper === scraper.name ? 'ring-2 ring-[#c4d82e]' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(scraper.status)}
                                    <h4 className="text-white font-bold">{scraper.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRefreshScraper(scraper.name);
                                        }}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <RefreshCw size={14} className="text-white" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleScraper(scraper.name);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${scraper.status === 'active'
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {scraper.status === 'active' ? (
                                            <Pause size={14} className="text-green-400" />
                                        ) : (
                                            <Play size={14} className="text-white" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Status</span>
                                    <span className={`font-medium ${scraper.status === 'active' ? 'text-green-400' :
                                            scraper.status === 'error' ? 'text-red-400' : 'text-gray-400'
                                        }`}>
                                        {scraper.status === 'active' ? 'Ativo' :
                                            scraper.status === 'error' ? 'Com Erro' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Eventos</span>
                                    <span className="text-white font-medium">{scraper.eventsScraped}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Erros</span>
                                    <span className={`font-medium ${scraper.errors > 0 ? 'text-red-400' : 'text-white'}`}>
                                        {scraper.errors}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Última Execução</span>
                                    <span className="text-white font-medium">{formatTime(scraper.lastRun)}</span>
                                </div>
                            </div>

                            {scraper.errorMessage && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-red-400 text-xs truncate">{scraper.errorMessage}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Detalhes do Scraper Selecionado */}
            {selectedScraper && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Detalhes: {selectedScraper}</h3>
                        <button
                            onClick={() => setSelectedScraper(null)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {(() => {
                        const scraper = scraperStatuses.find(s => s.name === selectedScraper);
                        if (!scraper) return null;

                        return (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-xs mb-1">Status</p>
                                        <p className={`text-lg font-bold ${scraper.status === 'active' ? 'text-green-400' :
                                                scraper.status === 'error' ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {scraper.status === 'active' ? 'Ativo' :
                                                scraper.status === 'error' ? 'Com Erro' : 'Inativo'}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-xs mb-1">Eventos Coletados</p>
                                        <p className="text-lg font-bold text-white">{scraper.eventsScraped}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-xs mb-1">Erros</p>
                                        <p className={`text-lg font-bold ${scraper.errors > 0 ? 'text-red-400' : 'text-white'}`}>
                                            {scraper.errors}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-xs mb-1">Última Execução</p>
                                        <p className="text-lg font-bold text-white">{formatTime(scraper.lastRun)}</p>
                                    </div>
                                </div>

                                {scraper.errorMessage && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                        <p className="text-red-400 text-sm">{scraper.errorMessage}</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onRefreshScraper(scraper.name)}
                                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                                    >
                                        <RefreshCw size={18} />
                                        Atualizar
                                    </button>
                                    <button
                                        onClick={() => onToggleScraper(scraper.name)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${scraper.status === 'active'
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            }`}
                                    >
                                        {scraper.status === 'active' ? (
                                            <>
                                                <Pause size={18} />
                                                Pausar
                                            </>
                                        ) : (
                                            <>
                                                <Play size={18} />
                                                Iniciar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Logs */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Logs Recentes</h3>
                    <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                        <BarChart3 size={18} />
                        Ver Todos
                    </button>
                </div>
                <div className="space-y-2">
                    {[
                        { time: '03:15:23', scraper: 'Betano', message: 'Odds atualizadas com sucesso', type: 'success' },
                        { time: '03:15:20', scraper: 'Bet365', message: 'Timeout ao conectar', type: 'error' },
                        { time: '03:15:18', scraper: 'Stake', message: 'Odds atualizadas com sucesso', type: 'success' },
                        { time: '03:15:15', scraper: '1xBet', message: 'Odds atualizadas com sucesso', type: 'success' },
                        { time: '03:15:12', scraper: 'Betano', message: 'Iniciando coleta de odds', type: 'info' },
                    ].map((log, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-3 rounded-lg ${log.type === 'error' ? 'bg-red-500/10' :
                                    log.type === 'success' ? 'bg-green-500/10' : 'bg-white/5'
                                }`}
                        >
                            <span className="text-gray-400 text-xs font-mono">{log.time}</span>
                            <span className="text-white text-sm font-medium">{log.scraper}</span>
                            <span className={`text-sm ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-green-400' : 'text-gray-400'
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
