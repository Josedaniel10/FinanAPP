import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import {
  Wallet,
  LogOut,
  LayoutDashboard,
  History,
  Target,
  Tag,
  ShieldCheck,
  CreditCard,
  PiggyBank,
} from 'lucide-react';
import { AppTab } from '../../stores/uiStore';

export type ActiveTabType = AppTab;

interface NavbarProps {
  activeTab?: AppTab;
  onSelectTab?: (tab: AppTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'dashboard',
  onSelectTab,
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand and Navigation Tabs */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onSelectTab && onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Finan<span className="text-emerald-600">APP</span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Gestión Financiera Personal
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          {user && onSelectTab && (
            <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('accounts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'accounts'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cuentas</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('categories')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Categorías</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('budgets')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'budgets'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Presupuestos</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('savings')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'savings'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Ahorros</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab('admin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50/80'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          )}
        </div>

        {/* User profile & actions */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name}
                  {user.role === 'ADMIN' && (
                    <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
