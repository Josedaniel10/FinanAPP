import React, { useState, useEffect } from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';
import { useAuth } from './features/auth/hooks/useAuth';
import { useAuthStore } from './stores/authStore';
import { LoginForm } from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import { Navbar, ActiveTabType } from './shared/components/Navbar';
import { WelcomeDashboard } from './features/dashboard/components/WelcomeDashboard';
import { FinancialHistoryView } from './features/transactions/components/FinancialHistoryView';
import { BudgetsView } from './features/budgets/components/BudgetsView';
import { CategoriesView } from './features/categories/components/CategoriesView';
import { Wallet, ShieldCheck, ArrowRight, TrendingUp, PieChart, Lock } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<ActiveTabType>('dashboard');

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-pulse mb-4">
          <Wallet className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700 animate-pulse">
          Cargando FinanAPP...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Verificando sesión segura y configuración
        </p>
      </div>
    );
  }

  // If user is authenticated, render authenticated app layout
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar activeTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1">
          {currentTab === 'dashboard' && (
            <WelcomeDashboard onNavigateToHistory={() => setCurrentTab('history')} />
          )}
          {currentTab === 'history' && (
            <FinancialHistoryView onNavigateToDashboard={() => setCurrentTab('dashboard')} />
          )}
          {currentTab === 'categories' && <CategoriesView />}
          {currentTab === 'budgets' && <BudgetsView />}
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
          FinanAPP © {new Date().getFullYear()} • Gestión Financiera Personal
        </footer>
      </div>
    );
  }

  // If not authenticated, render Login / Register screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800/20">
        {/* Left column: Brand & Context Presentation */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 to-teal-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">FinanAPP</span>
                <span className="block text-[11px] text-emerald-300 font-medium">
                  Gestión Financiera Personal
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              Toma el control inteligente de tu dinero.
            </h1>
            <p className="mt-3 text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Registra tus ingresos, gastos, consulta balances en tiempo real y gestiona presupuestos con máxima seguridad.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-700/50 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Ingresos y Gastos</p>
                  <p className="text-[11px] text-emerald-200">
                    Control detallado de cada movimiento y saldo actualizado.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-700/50 flex items-center justify-center shrink-0 mt-0.5">
                  <PieChart className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Categorías y Presupuestos</p>
                  <p className="text-[11px] text-emerald-200">
                    Organización por rubros de gasto e ingreso personalizables.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-700/50 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Seguridad en tus finanzas</p>
                  <p className="text-[11px] text-emerald-200">
                    Protección avanzada y resguardo seguro de tu información financiera.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-700/50 flex items-center justify-between text-[11px] text-emerald-300 relative z-10">
            <span>Acceso seguro</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Protegido
            </span>
          </div>
        </div>

        {/* Right column: Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            {/* Tabs selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Registrar Cuenta
              </button>
            </div>

            {authMode === 'login' ? (
              <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
