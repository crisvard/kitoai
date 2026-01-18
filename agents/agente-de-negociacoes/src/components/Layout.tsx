import { LayoutDashboard, TrendingUp, Building2, History, ArrowLeftRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, activeView, onViewChange }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfólio', icon: TrendingUp },
    { id: 'trading', label: 'Negociar', icon: ArrowLeftRight },
    { id: 'exchanges', label: 'Exchanges', icon: Building2 },
    { id: 'transactions', label: 'Histórico', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-2">CryptoHub</h1>
            <p className="text-slate-400 text-sm">Gestão de Investimentos</p>
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
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
