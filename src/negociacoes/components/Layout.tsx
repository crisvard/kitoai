import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Building2, History, ArrowLeftRight, Bitcoin, LineChart, Dices, Activity, Wallet, DollarSign, Trophy, Target, Briefcase, Plus } from 'lucide-react';
import { useOtherNav } from '../contexts/OtherNavContext';

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

const otherMenuItems = [
  { id: 'other-dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
  { id: 'betting-betano', label: 'Betano Ao Vivo', icon: Target },
  { id: 'betting-bets', label: 'Minhas Apostas', icon: Trophy },
  { id: 'betting-analysis', label: 'Análise', icon: Activity },
  { id: 'betting-bookmakers', label: 'Casas de Aposta', icon: Dices },
  { id: 'betting-stats', label: 'Estatísticas', icon: History },
];

const tabs = [
  { id: 'crypto', label: 'Criptomoedas', icon: Bitcoin },
  { id: 'broker', label: 'Broker', icon: LineChart },
  { id: 'betting', label: 'Casas de Apostas', icon: Dices },
  { id: 'other', label: 'Outros', icon: Briefcase },
];

export default function Layout({ children, activeTab, activeView, onTabChange, onViewChange }: LayoutProps) {
  const { navItems, activeNav, setActiveNav, addNavItem, maxNavs, isGridMode, setGridMode, selectedNavs, toggleNavSelection } = useOtherNav();
  const menuItems = activeTab === 'crypto'
    ? cryptoMenuItems
    : activeTab === 'broker'
      ? brokerMenuItems
      : activeTab === 'betting'
        ? bettingMenuItems
        : otherMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header com as 3 abas */}
      <header className="bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">InvestHub</h1>
              <p className="text-gray-400 text-sm hidden md:block">Agente de Investimentos</p>
            </div>

            {/* Abas de navegação */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
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

            {/* Informações do usuário */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-white text-sm font-medium">R$ 125.430,00</p>
                <p className="text-green-400 text-xs">+12.5%</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#c4d82e] to-[#a3b82e] rounded-full flex items-center justify-center text-black font-bold">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border-r border-white/10">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {activeTab === 'crypto' && 'Criptomoedas'}
              {activeTab === 'broker' && 'Broker'}
              {activeTab === 'betting' && 'Casas de Apostas'}
              {activeTab === 'other' && 'Outros'}
            </h2>
            <p className="text-gray-400 text-sm">
              {activeTab === 'crypto' && 'Gestão de Crypto'}
              {activeTab === 'broker' && 'Ações e Forex'}
              {activeTab === 'betting' && 'Trading Esportivo'}
              {activeTab === 'other' && 'Módulos adicionais'}
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-[#c4d82e] text-black shadow-lg shadow-[#c4d82e]/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              {activeTab === 'other' && (
                <>
                  <div className="mb-3 rounded-xl border border-[#c4d82e]/30 bg-[#181818] p-3 shadow-inner shadow-black/20 flex justify-between items-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#c4d82e]">Outros</p>
                      <p className="mt-2 text-sm font-semibold text-white">Navegação lateral</p>
                      <p className="mt-1 text-xs text-gray-400">Acesso rápido aos módulos adicionais.</p>
                    </div>
                    <button
                      onClick={() => setGridMode(!isGridMode)}
                      title="Lado a lado (Mosaico)"
                      className={`text-[9px] px-2 py-1 rounded font-bold uppercase transition-colors ${isGridMode ? 'bg-[#c4d82e] text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                    >
                      Lado a Lado
                    </button>
                  </div>
                  <div className="mb-3 space-y-1 max-h-48 overflow-y-auto pr-1">
                    {navItems.map((item) => {
                      const isSelected = selectedNavs.includes(item);
                      const isCurrent = activeNav === item;
                      return (
                        <div key={item} className="flex items-center gap-2 mb-1 w-full">
                          {isGridMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleNavSelection(item)}
                              className="accent-[#c4d82e] cursor-pointer"
                            />
                          )}
                          <button
                            onClick={() => {
                              if (isGridMode) {
                                toggleNavSelection(item);
                              } else {
                                setActiveNav(item);
                              }
                            }}
                            className={`flex-1 rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-all ${(!isGridMode && isCurrent) || (isGridMode && isSelected)
                                ? 'bg-[#c4d82e] text-black'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                              }`}
                          >
                            {item}
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={addNavItem}
                      disabled={navItems.length >= maxNavs}
                      className={`flex w-full items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium transition-all ${navItems.length >= maxNavs
                          ? 'cursor-not-allowed border-white/10 bg-white/5 text-gray-500'
                          : 'border-[#c4d82e]/50 bg-[#c4d82e]/10 text-[#c4d82e] hover:bg-[#c4d82e]/20'
                        }`}
                    >
                      <Plus size={12} />
                      {navItems.length >= maxNavs ? `Máx ${maxNavs}` : 'Adicionar +1'}
                    </button>
                  </div>
                </>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#c4d82e]/10 rounded-lg">
                  {activeTab === 'crypto' && <Bitcoin className="text-[#c4d82e]" size={20} />}
                  {activeTab === 'broker' && <LineChart className="text-[#c4d82e]" size={20} />}
                  {activeTab === 'betting' && <Dices className="text-[#c4d82e]" size={20} />}
                  {activeTab === 'other' && <Briefcase className="text-[#c4d82e]" size={20} />}
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Saldo Total</p>
                  <p className="text-white font-bold">
                    {activeTab === 'crypto' && 'R$ 45.230,00'}
                    {activeTab === 'broker' && 'R$ 52.100,00'}
                    {activeTab === 'betting' && 'R$ 28.100,00'}
                    {activeTab === 'other' && 'R$ 12.500,00'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors">
                  Depositar
                </button>
                <button className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
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
