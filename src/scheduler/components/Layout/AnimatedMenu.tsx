import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  PlusCircle,
  Users,
  Scissors,
  BarChart3
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  hoverColor: string;
}

interface AnimatedMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AnimatedMenu({ activeTab, onTabChange }: AnimatedMenuProps) {
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
      id: 'new-appointment',
      label: 'Novo Agendamento',
      icon: PlusCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      hoverColor: 'hover:bg-green-500/30'
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
      id: 'services',
      label: 'Serviços',
      icon: Scissors,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      hoverColor: 'hover:bg-pink-500/30'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      hoverColor: 'hover:bg-orange-500/30'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
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
    </div>
  );
}