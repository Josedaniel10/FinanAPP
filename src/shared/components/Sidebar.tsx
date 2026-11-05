import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUIStore, AppTab } from '../../stores/uiStore';
import {
  Wallet,
  LayoutDashboard,
  History,
  CreditCard,
  Tag,
  Target,
  PiggyBank,
  BarChart3,
  ShieldCheck,
  User,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth();
  const {
    isSidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useUIStore();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    {
      id: 'dashboard' as AppTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Resumen financiero',
    },
    {
      id: 'history' as AppTab,
      label: 'Movimientos',
      icon: History,
      description: 'Libro de transacciones',
    },
    {
      id: 'accounts' as AppTab,
      label: 'Cuentas',
      icon: CreditCard,
      description: 'Saldos y transferencias',
    },
    {
      id: 'categories' as AppTab,
      label: 'Categorías',
      icon: Tag,
      description: 'Clasificación de gastos',
    },
    {
      id: 'budgets' as AppTab,
      label: 'Presupuestos',
      icon: Target,
      description: 'Límites y alertas 80/100%',
    },
    {
      id: 'savings' as AppTab,
      label: 'Metas de Ahorro',
      icon: PiggyBank,
      description: 'Huchas y progreso',
    },
    {
      id: 'reports' as AppTab,
      label: 'Reportes & Analíticas',
      icon: BarChart3,
      description: 'Excel CSV y descarga PDF',
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as AppTab,
            label: 'Panel de Administración',
            icon: ShieldCheck,
            description: 'Gestión de usuarios y roles',
          },
        ]
      : []),
  ];

  const handleNavClick = (tab: AppTab) => {
    onSelectTab(tab);
    setSidebarOpen(false);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const renderSidebarContent = (isCollapsedForDesktop = false) => (
    <div className="flex flex-col h-full justify-between bg-white select-none transition-all duration-300">
      {/* Top Brand Header */}
      <div>
        <div
          className={`p-4 border-b border-slate-100 flex items-center ${
            isCollapsedForDesktop ? 'justify-center' : 'justify-between'
          }`}
        >
          <div
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer group ${
              isCollapsedForDesktop ? 'justify-center' : ''
            }`}
            title="FinanAPP"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            {!isCollapsedForDesktop && (
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                  Finan<span className="text-emerald-600">APP</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Gestión Financiera
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ${
              isCollapsedForDesktop ? 'mt-3 mx-auto' : ''
            }`}
            title={isCollapsedForDesktop ? 'Expandir menú lateral' : 'Reducir a solo iconos'}
            aria-label={isCollapsedForDesktop ? 'Expandir menú lateral' : 'Reducir a solo iconos'}
          >
            {isCollapsedForDesktop ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Destination Items */}
        <div className={`p-2.5 space-y-1 ${isCollapsedForDesktop ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsedForDesktop && (
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navegación
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={isCollapsedForDesktop ? item.label : undefined}
                className={`flex items-center rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isCollapsedForDesktop
                    ? 'w-11 h-11 justify-center p-0'
                    : 'w-full gap-3 px-3 py-2.5 text-left'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-700/60 text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsedForDesktop && (
                  <>
                    <div className="flex-1 truncate">
                      <span className="block leading-tight">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile Footer Trigger */}
      <div className={`p-2.5 border-t border-slate-100 ${isCollapsedForDesktop ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          title={isCollapsedForDesktop ? 'Mi Perfil' : undefined}
          className={`rounded-2xl flex items-center transition-all cursor-pointer ${
            isCollapsedForDesktop
              ? 'w-11 h-11 justify-center p-0'
              : 'w-full p-2.5 gap-3 text-left'
          } ${
            activeTab === 'profile'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 ring-2 ring-emerald-500/20'
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {userInitial}
          </div>
          {!isCollapsedForDesktop && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'} • Mi perfil
                </p>
              </div>
              <User className="w-4 h-4 text-slate-400 shrink-0" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar (with collapsible width w-20 vs w-64) */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 h-screen sticky top-0 shrink-0 z-30 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* Mobile Drawer (always expanded inside slide-out panel) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
