import React, { useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUIStore, AppTab } from '../../stores/uiStore';
import {
  Wallet,
  LogOut,
  ShieldCheck,
  User,
  PieChart,
  PiggyBank,
  Tag,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { DSBottomSheet } from '../../design-system';

export const MobileHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { setActiveTab } = useUIStore();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const navigateTo = (tab: AppTab) => {
    setActiveTab(tab);
    setIsProfileSheetOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between shadow-2xs">
        {/* Left: Brand Wordmark */}
        <div
          onClick={() => navigateTo('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              FinanAPP
            </span>
            {user?.role === 'ADMIN' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-800">
                <ShieldCheck className="w-3 h-3" /> ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Right: User Avatar Trigger */}
        <button
          type="button"
          onClick={() => setIsProfileSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer select-none"
          aria-label="Abrir perfil y menú móvil"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </button>
      </header>

      {/* User Profile & Navigation Bottom Sheet */}
      <DSBottomSheet
        isOpen={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
        title="Mi Perfil & Accesos"
        maxHeight="65"
      >
        <div className="space-y-4">
          {/* User Info Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="mt-1">
                <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  Rol: {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Module Navigation Links with 48x48 hitboxes */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Módulos del Sistema
            </p>

            <button
              type="button"
              onClick={() => navigateTo('reports')}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Reportes & Exportación (CSV/PDF)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('savings')}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <PiggyBank className="w-4 h-4 text-purple-600" />
                <span>Metas de Ahorro</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('accounts')}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Cuentas Financieras & Divisas</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('categories')}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Gestor de Categorías</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Logout Action */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsProfileSheetOpen(false);
                logout();
              }}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </DSBottomSheet>
    </>
  );
};
