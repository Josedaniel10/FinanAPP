import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUIStore, AppTab } from '../../stores/uiStore';
import { Menu, ShieldCheck, User } from 'lucide-react';

interface AppHeaderProps {
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenProfile }) => {
  const { user } = useAuth();
  const { activeTab, setSidebarOpen } = useUIStore();

  const tabLabels: Record<AppTab, string> = {
    dashboard: 'Dashboard',
    history: 'Historial de Movimientos',
    accounts: 'Cuentas Financieras',
    categories: 'Categorías',
    budgets: 'Presupuestos',
    savings: 'Metas de Ahorro',
    reports: 'Reportes & Analíticas',
    admin: 'Panel de Administración',
    profile: 'Mi Perfil de Usuario',
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs select-none">
      {/* Left: Mobile hamburger menu toggle & View Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current View Breadcrumb / Title */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {tabLabels[activeTab] || 'FinanAPP'}
            </h2>
            {activeTab === 'admin' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" /> Privilegios Admin
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Control patrimonial y gestión en tiempo real
          </p>
        </div>
      </div>

      {/* Right: Clean User Profile Avatar Button (Tapping opens Profile; NO logout icon here) */}
      <button
        type="button"
        onClick={onOpenProfile}
        className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition-all cursor-pointer group ${
          activeTab === 'profile'
            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
            : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
        }`}
        title="Ver mi perfil"
        aria-label="Ver información de perfil"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
          {userInitial}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
            {user?.name}
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">
            {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
          </p>
        </div>
      </button>
    </header>
  );
};
