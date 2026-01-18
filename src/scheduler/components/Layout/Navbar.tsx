import { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  BarChart3,
  Settings
} from 'lucide-react';

// Componente de ícone do WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  hoverColor: string;
}

interface NavbarProps {
  currentView: 'dashboard' | 'appointments' | 'customers' | 'professionals' | 'reports' | 'settings' | 'whatsapp';
  onViewChange: (view: 'dashboard' | 'appointments' | 'customers' | 'professionals' | 'reports' | 'settings' | 'whatsapp') => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { signOut } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-[#c4d82e]',
      bgColor: 'bg-[#c4d82e]/20',
      hoverColor: 'hover:bg-[#c4d82e]/30'
    },
    {
      id: 'appointments',
      label: 'Agendamentos',
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      hoverColor: 'hover:bg-blue-500/30'
    },
    {
      id: 'customers',
      label: 'Clientes',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      hoverColor: 'hover:bg-cyan-500/30'
    },
    {
      id: 'professionals',
      label: 'Profissionais',
      icon: UserCheck,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      hoverColor: 'hover:bg-purple-500/30'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      hoverColor: 'hover:bg-orange-500/30'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      hoverColor: 'hover:bg-green-500/30'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      hoverColor: 'hover:bg-pink-500/30'
    }
  ];

  return (
    <nav className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 m-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-[#c4d82e] p-3 rounded-2xl">
            <LayoutDashboard className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kito Expert</h1>
            <p className="text-gray-400 text-sm">Dashboard Administrativo</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="md:hidden">
            <Menu className="w-6 h-6 text-gray-400" />
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Animated Menu */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as 'dashboard' | 'appointments' | 'customers' | 'professionals' | 'reports' | 'settings' | 'whatsapp')}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                group relative overflow-hidden
                bg-gradient-to-br from-white/5 to-white/[0.02]
                border border-white/10 rounded-2xl
                p-4 transition-all duration-500 ease-out
                hover:scale-105 hover:shadow-xl hover:shadow-white/10
                ${isActive
                  ? 'bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 border-[#c4d82e]/50 shadow-lg shadow-[#c4d82e]/20'
                  : 'hover:border-white/20'
                }
              `}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Background glow effect */}
              <div className={`
                absolute inset-0 opacity-0 transition-opacity duration-300
                ${isActive || isHovered ? 'opacity-100' : ''}
                bg-gradient-to-br from-white/10 to-transparent
              `} />

              {/* Icon container with animated background */}
              <div className={`
                relative z-10 mb-3 mx-auto w-12 h-12 rounded-xl
                transition-all duration-300 flex items-center justify-center
                ${isActive
                  ? 'bg-[#c4d82e]/20 scale-110'
                  : `${item.bgColor} ${item.hoverColor}`
                }
              `}>
                <Icon className={`
                  w-6 h-6 transition-all duration-300
                  ${isActive
                    ? 'text-[#c4d82e] scale-110'
                    : item.color
                  }
                  ${isHovered && !isActive ? 'scale-110' : ''}
                `} />
              </div>

              {/* Label */}
              <div className="relative z-10 text-center">
                <span className={`
                  text-xs font-semibold transition-all duration-300 block
                  ${isActive
                    ? 'text-[#c4d82e]'
                    : 'text-gray-300 group-hover:text-white'
                  }
                `}>
                  {item.label}
                </span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#c4d82e] rounded-full animate-pulse" />
              )}

              {/* Hover ripple effect */}
              {(isHovered || isActive) && (
                <div className="absolute inset-0 rounded-2xl border border-white/20 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
