import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Building2, History, ArrowLeftRight, Bitcoin, LineChart, Dices, Activity, Wallet, DollarSign, Trophy, Zap, Calculator } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  activeView: string;
  onTabChange: (tab: string) => void;
  onViewChange: (view: string) => void;
}

// Menu items para cada aba
const cryptoMenuItems = [
  { id: 'crypto-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crypto-portfolio', label: 'Portfólio', icon: TrendingUp },
  { id: 'crypto-trading', label: 'Negociar', icon: ArrowLeftRight },
  { id: 'crypto-exchanges', label: 'Exchanges', icon: Building2 },
  { id: 'crypto-transactions', label: 'Histórico', icon: History },
];

const brokerMenuItems = [
  { id: 'broker-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'broker-portfolio', label: 'Portfólio', icon: TrendingUp },
  { id: 'broker-trading', label: 'Operar', icon: ArrowLeftRight },
  { id: 'broker-brokers', label: 'Corretoras', icon: Building2 },
  { id: 'broker-transactions', label: 'Histórico', icon: History },
];

const bettingMenuItems = [
  { id: 'betting-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'betting-live-odds', label: 'Odds em Tempo Real', icon: Zap },
  { id: 'betting-parlay', label: 'Gerar Múltiplas', icon: Calculator },
  { id: 'betting-bets', label: 'Minhas Apostas', icon: Trophy },
  { id: 'betting-analysis', label: 'Análise', icon: Activity },
  { id: 'betting-bookmakers', label: 'Casas de Aposta', icon: Dices },
  { id: 'betting-stats', label: 'Estatísticas', icon: LineChart },
];

const tabs = [
  { id: 'crypto', label: 'Criptomoedas', icon: Bitcoin },
  { id: 'broker', label: 'Broker', icon: LineChart },
  { id: 'betting', label: 'Casas de Apostas', icon: Dices },
];

export default function Layout({ children, activeTab, activeView, onTabChange, onViewChange }: LayoutProps) {
  const menuItems = activeTab === 'crypto' 
    ? cryptoMenuItems 
    : activeTab === 'broker' 
      ? brokerMenuItems 
      : bettingMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header com as 3 abas */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">InvestHub</h1>
              <p className="text-slate-400 text-sm hidden md:block">Plataforma de Investimentos</p>
            </div>
            
            {/* Abas de navegação */}
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Informações do usuário */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-white text-sm font-medium">R$ 125.430,00</p>
                <p className="text-green-400 text-xs">+12.5%</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {activeTab === 'crypto' && 'Criptomoedas'}
              {activeTab === 'broker' && 'Broker'}
              {activeTab === 'betting' && 'Casas de Apostas'}
            </h2>
            <p className="text-slate-400 text-sm">
              {activeTab === 'crypto' && 'Gestão de Crypto'}
              {activeTab === 'broker' && 'Ações e Forex'}
              {activeTab === 'betting' && 'Trading Esportivo'}
            </p>
          </div>

          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Card de saldo da aba atual */}
          <div className="p-4 mt-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  {activeTab === 'crypto' && <Bitcoin className="text-blue-400" size={20} />}
                  {activeTab === 'broker' && <LineChart className="text-blue-400" size={20} />}
                  {activeTab === 'betting' && <Dices className="text-blue-400" size={20} />}
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Saldo Total</p>
                  <p className="text-white font-bold">
                    {activeTab === 'crypto' && 'R$ 45.230,00'}
                    {activeTab === 'broker' && 'R$ 52.100,00'}
                    {activeTab === 'betting' && 'R$ 28.100,00'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors">
                  Depositar
                </button>
                <button className="flex-1 bg-slate-700/50 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Sacar
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
