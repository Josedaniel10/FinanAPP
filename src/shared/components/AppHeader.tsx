import React, { useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUIStore, AppTab } from '../../stores/uiStore';
import { Bell, ShieldCheck } from 'lucide-react';
import { NotificationsModal } from './NotificationsModal';

interface AppHeaderProps {
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenProfile }) => {
  const { user } = useAuth();
  const { activeTab } = useUIStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const tabLabels: Record<AppTab, string> = {
    dashboard: 'Inicio',
    history: 'Movimientos',
    accounts: 'Cuentas',
    categories: 'Categorías',
    budgets: 'Presupuestos',
    savings: 'Metas de Ahorro',
    reports: 'Reportes & Analíticas',
    admin: 'Administración',
    profile: 'Mi Perfil',
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* 
        HEADER CONTAINER:
        - On Mobile: Hidden when on 'dashboard' (since MobileDashboard has its own integrated curved hero header).
                    Rendered for other tabs with Profile Avatar on Left, View Title in Center, Notification Bell on Right.
        - On Desktop: Always displayed with breadcrumbs, role badge, and user name.
      */}
      <header
        className={`sticky top-0 z-20 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 items-center justify-between shadow-2xs select-none ${
          activeTab === 'dashboard' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* MOBILE VIEW (md:hidden): Left Avatar, Center Title, Right Notifications */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          {/* Left: Profile Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            aria-label="Abrir mi perfil"
          >
            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs ring-2 ring-emerald-500/20">
              {userInitial}
            </div>
          </button>

          {/* Center: Title */}
          <h2 className="text-sm font-bold text-slate-900 tracking-tight text-center truncate flex-1">
            {tabLabels[activeTab] || 'FinanAPP'}
          </h2>

          {/* Right: Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            aria-label="Ver notificaciones"
          >
            <div className="w-8.5 h-8.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* DESKTOP VIEW (hidden md:flex): Left Breadcrumb & Right Profile */}
        <div className="hidden md:flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                {tabLabels[activeTab] === 'Inicio' ? 'Dashboard' : tabLabels[activeTab] || 'FinanAPP'}
              </h2>
              {activeTab === 'admin' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3" /> Privilegios Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Control patrimonial y gestión en tiempo real
            </p>
          </div>
        </div>

        {/* Desktop Profile Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer group ${
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
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
            </p>
          </div>
        </button>
      </header>

      {/* Mobile Notifications Bottom Sheet Modal */}
      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
};
