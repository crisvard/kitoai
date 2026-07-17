import { useState } from 'react';
import { LayoutDashboard, Dices, Activity, Settings, BarChart3, Target, Zap, TrendingUp, TrendingDown, Clock, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import BookmakerMirror from './BookmakerMirror';
import OddsComparison from './OddsComparison';
import LiveOdds from './LiveOdds';
import BettingAnalytics from './BettingAnalytics';
import BookmakerSettings from './BookmakerSettings';
import { useBookmakerOdds, BOOKMAKER_CONFIGS } from '../hooks/useBookmakerOdds';

type Tab = 'mirror' | 'comparison' | 'live' | 'analytics' | 'settings';

export default function MirrorDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('mirror');
    const {
        odds,
        loading,
        error,
        scraperStatuses,
        stats,
        enabledBookmakers,
        refresh,
        compareOdds,
        toggleBookmaker
    } = useBookmakerOdds(['Betano', 'Bet365', 'Stake']);

    const comparisons = compareOdds();

     const tabs = [
         { id: 'mirror', label: 'Espelhamento', icon: Dices },
         { id: 'comparison', label: 'Comparação', icon: BarChart3 },
         { id: 'live', label: 'Ao Vivo', icon: Zap },
         { id: 'analytics', label: 'Análise', icon: Activity },
         { id: 'settings', label: 'Configurações', icon: Settings },
     ];

     const renderContent = () => {
         switch (activeTab) {
             case 'mirror':
                 return <BookmakerMirror />;
             case 'comparison':
                 return <OddsComparison comparisons={comparisons} loading={loading} />;
             case 'live':
                 return <LiveOdds events={odds.filter(e => e.status === 'live')} loading={loading} onRefresh={refresh} />;
             case 'analytics':
                 return <BettingAnalytics />;
             case 'settings':
                 return (
                     <BookmakerSettings
                         bookmakers={BOOKMAKER_CONFIGS}
                         enabledBookmakers={enabledBookmakers}
                         onUpdateBookmaker={(bookmaker) => {
                             // Implementar atualização
                             console.log('Atualizar:', bookmaker);
                         }}
                         onToggleBookmaker={toggleBookmaker}
                         onDeleteBookmaker={(name) => {
                             // Implementar exclusão
                             console.log('Excluir:', name);
                         }}
                         onAddBookmaker={(bookmaker) => {
                             // Implementar adição
                             console.log('Adicionar:', bookmaker);
                         }}
                     />
                 );
             default:
                 return <BookmakerMirror />;
         }
     };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
            {/* Header */}
            <header className="bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#c4d82e]/20 rounded-xl">
                                <Dices className="text-[#c4d82e]" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">MirrorHub</h1>
                                <p className="text-gray-400 text-sm">Espelhamento de Casas de Apostas</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as Tab)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-[#c4d82e] text-black shadow-lg shadow-[#c4d82e]/30'
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium text-sm">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-white text-sm font-medium">{stats.totalEvents} Eventos</p>
                                <p className="text-green-400 text-xs">{stats.liveEvents} Ao Vivo</p>
                            </div>
                            <button
                                onClick={refresh}
                                disabled={loading}
                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={20} className={`text-white ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-8">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
