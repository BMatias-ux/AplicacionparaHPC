import React from 'react';
import { Home, Calendar, Edit3, User, Menu } from 'lucide-react';

export type TabType = 'home' | 'turnos' | 'actividades' | 'mis-datos' | 'mas';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'turnos', label: 'Turnos', icon: Calendar },
    { id: 'actividades', label: 'Actividades', icon: Edit3 },
    { id: 'mis-datos', label: 'Mis Datos', icon: User },
    { id: 'mas', label: 'Más', icon: Menu },
  ] as const;

  return (
    <nav
      aria-label="Navegación principal"
      className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-4 shrink-0 shadow-lg shadow-gray-100/50 z-40 select-none relative"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className="flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200 focus:outline-none group relative"
          >
            {/* Top active dot indicator */}
            <div className="h-1 flex items-center justify-center w-full mb-1">
              {isActive && (
                <div className="w-5 h-1 bg-[#0D9488] rounded-full transition-all duration-300" />
              )}
            </div>

            <Icon
              size={22}
              strokeWidth={isActive ? 2.4 : 1.8}
              className={`transition-transform duration-150 ${
                isActive ? 'text-[#0D9488] scale-110' : 'text-gray-400 group-hover:text-[#0D9488]'
              }`}
            />
            <span
              className={`text-[10px] mt-1 uppercase tracking-widest transition-all ${
                isActive
                  ? 'text-[#0D9488] font-bold'
                  : 'text-gray-400 font-semibold group-hover:text-gray-600'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
