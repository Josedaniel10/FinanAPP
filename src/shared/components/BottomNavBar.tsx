import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AppTab } from '../../stores/uiStore';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  PieChart,
  Layers,
  ShieldCheck,
  PiggyBank,
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    {
      id: 'dashboard' as AppTab,
      label: 'Inicio',
      icon: LayoutDashboard,
    },
    {
      id: 'history' as AppTab,
      label: 'Movimientos',
      icon: ArrowLeftRight,
    },
    {
      id: 'accounts' as AppTab,
      label: 'Cuentas',
      icon: CreditCard,
    },
    {
      id: 'budgets' as AppTab,
      label: 'Presupuestos',
      icon: PieChart,
    },
    {
      id: (isAdmin ? 'admin' : 'categories') as AppTab,
      label: isAdmin ? 'Admin' : 'Categorías',
      icon: isAdmin ? ShieldCheck : Layers,
    },
  ];

  return (
    <nav
      aria-label="Navegación principal inferior"
      className="fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-all rounded-xl cursor-pointer ${
              isActive
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 active:scale-95'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                isActive ? 'bg-emerald-50 text-emerald-600' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
