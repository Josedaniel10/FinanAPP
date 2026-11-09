import React, { useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AppTab } from '../../stores/uiStore';
import {
  CreditCard,
  ArrowLeftRight,
  PieChart,
  PiggyBank,
  Grid,
  BarChart3,
  Tag,
  ShieldCheck,
  User,
  Wallet,
  X,
  ChevronRight,
} from 'lucide-react';
import { DSBottomSheet } from '../../design-system';

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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Main 4 direct shortcuts + More menu
  const primaryTabs: { id: AppTab; icon: React.ElementType; label: string }[] = [
    {
      id: 'dashboard',
      icon: CreditCard,
      label: 'Inicio',
    },
    {
      id: 'history',
      icon: ArrowLeftRight,
      label: 'Movimientos',
    },
    {
      id: 'budgets',
      icon: PieChart,
      label: 'Presupuestos',
    },
    {
      id: 'savings',
      icon: PiggyBank,
      label: 'Ahorros',
    },
  ];

  // Secondary items accessible via the More (...) menu
  const moreItems: {
    id: AppTab;
    icon: React.ElementType;
    label: string;
    description: string;
  }[] = [
    {
      id: 'accounts',
      icon: Wallet,
      label: 'Mis Cuentas',
      description: 'Saldos bancarios y transferencias',
    },
    {
      id: 'reports',
      icon: BarChart3,
      label: 'Reportes & Analíticas',
      description: 'Métricas y exportación PDF/Excel',
    },
    {
      id: 'categories',
      icon: Tag,
      label: 'Categorías Financieras',
      description: 'Gestión de rubros de ingresos y gastos',
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as AppTab,
            icon: ShieldCheck,
            label: 'Panel de Administración',
            description: 'Gestión de usuarios y categorías globales',
          },
        ]
      : []),
    {
      id: 'profile',
      icon: User,
      label: 'Mi Perfil de Usuario',
      description: 'Moneda preferida y configuración de cuenta',
    },
  ];

  const isMoreActive = moreItems.some((item) => item.id === activeTab);

  const handleSelectMoreItem = (tab: AppTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* FLOATING CAPSULE DOCK (Matches Reference Design in image_0354551a.png) */}
      <nav
        aria-label="Navegación móvil flotante"
        className="fixed bottom-4 inset-x-0 z-40 max-w-[300px] xs:max-w-xs mx-auto bg-slate-950/92 text-white backdrop-blur-xl border border-white/15 rounded-full p-1.5 shadow-2xl flex items-center justify-around select-none mb-[env(safe-area-inset-bottom,0px)]"
      >
        {primaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'text-white/60 hover:text-white active:scale-95'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </button>
          );
        })}

        {/* 5th Icon: More / Grid Menu Trigger */}
        <button
          type="button"
          onClick={() => setIsMoreMenuOpen(true)}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMoreActive
              ? 'bg-white text-slate-950 shadow-md scale-105'
              : 'text-white/60 hover:text-white active:scale-95'
          }`}
          title="Más opciones"
          aria-label="Más secciones de la aplicación"
        >
          <Grid className="w-5 h-5 stroke-[2.2]" />
        </button>
      </nav>

      {/* MORE SECTIONS BOTTOM SHEET */}
      <DSBottomSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 block leading-tight">
                Secciones de FinanAPP
              </span>
              <span className="text-[11px] text-slate-400 font-normal block">
                Accesos directos a módulos financieros
              </span>
            </div>
          </div>
        }
      >
        <div className="space-y-2 pb-6">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectMoreItem(item.id)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </DSBottomSheet>
    </>
  );
};
