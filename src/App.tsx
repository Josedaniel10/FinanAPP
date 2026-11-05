import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from './features/auth/context/AuthContext';
import { useAuth } from './features/auth/hooks/useAuth';
import { useAuthStore } from './stores/authStore';
import { useUIStore, AppTab } from './stores/uiStore';
import { LoginForm } from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import { Sidebar } from './shared/components/Sidebar';
import { AppHeader } from './shared/components/AppHeader';
import { BottomNavBar } from './shared/components/BottomNavBar';
import { WelcomeDashboard } from './features/dashboard/components/WelcomeDashboard';
import { FinancialHistoryView } from './features/transactions/components/FinancialHistoryView';
import { BudgetsView } from './features/budgets/components/BudgetsView';
import { CategoriesView } from './features/categories/components/CategoriesView';
import { AccountsView } from './features/accounts/components/AccountsView';
import { SavingsView } from './features/savings/components/SavingsView';
import { ReportsView } from './features/reports/components/ReportsView';
import { AdminUsersView } from './features/admin/components/AdminUsersView';
import { UserProfileView } from './features/profile/components/UserProfileView';
import { DSFab, DSToastContainer } from './design-system';
import { TransactionModal } from './features/transactions/components/TransactionModal';
import { useAccountsQuery } from './features/accounts/hooks/useAccountsQuery';
import { useCreateTransactionMutation } from './features/transactions/hooks/useTransactionsQuery';
import { categoryService } from './features/categories/services/category.service';
import { Category } from './features/transactions/types';
import { Wallet, Plus } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { activeTab, setActiveTab } = useUIStore();

  // Quick Mobile Transaction FAB State
  const [isFabModalOpen, setIsFabModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { data: accounts = [] } = useAccountsQuery();
  const createTxMutation = useCreateTransactionMutation();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (user) {
      categoryService.getCategories().then((res: { data: Category[] }) => {
        setCategories(res.data);
      }).catch(() => {});
    }
  }, [user]);

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

  // If user is authenticated, render responsive layout:
  // - Desktop: Classic Navbar on top, full width multi-column content, no bottom bar
  // - Mobile: MobileHeader on top, compact cards, Bottom Sheet modals, FAB and BottomNavBar
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-emerald-500 selection:text-white">
        {/* Left Sidebar (Desktop fixed + Mobile slide-out drawer) */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Clean Top Header (Breadcrumb, mobile menu button, profile avatar trigger, NO logout button) */}
          <AppHeader onOpenProfile={() => setActiveTab('profile')} />

          {/* Main Content Area with fluid motion transitions */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {activeTab === 'dashboard' && (
                  <WelcomeDashboard
                    onNavigateToHistory={() => setActiveTab('history')}
                    onNavigateToAccounts={() => setActiveTab('accounts')}
                    onNavigateToBudgets={() => setActiveTab('budgets')}
                    onNavigateToSavings={() => setActiveTab('savings')}
                    onNavigateToReports={() => setActiveTab('reports')}
                  />
                )}
                {activeTab === 'history' && (
                  <FinancialHistoryView onNavigateToDashboard={() => setActiveTab('dashboard')} />
                )}
                {activeTab === 'accounts' && <AccountsView />}
                {activeTab === 'budgets' && <BudgetsView />}
                {activeTab === 'savings' && <SavingsView />}
                {activeTab === 'reports' && <ReportsView />}
                {activeTab === 'categories' && <CategoriesView />}
                {activeTab === 'admin' && <AdminUsersView />}
                {activeTab === 'profile' && <UserProfileView />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Desktop Footer */}
          <footer className="hidden md:block border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
            FinanAPP © {new Date().getFullYear()} • Plataforma de Gestión Financiera Personal
          </footer>
        </div>

        {/* Floating Action Button (FAB): Mobile Only */}
        <div className="block md:hidden">
          <DSFab
            onClick={() => setIsFabModalOpen(true)}
            icon={<Plus className="w-6 h-6" />}
            ariaLabel="Registrar nuevo movimiento"
          />
        </div>

        {/* Quick Add Bottom Sheet / Modal Triggered by FAB on Mobile */}
        <TransactionModal
          isOpen={isFabModalOpen}
          onClose={() => setIsFabModalOpen(false)}
          onSave={async (payload) => {
            await createTxMutation.mutateAsync(payload);
          }}
          categories={categories}
          accounts={accounts as any}
          defaultType="EXPENSE"
          onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        />

        {/* Non-intrusive Floating Feedback Snackbars/Toasts */}
        <DSToastContainer />

        {/* Mobile Bottom Navigation Bar */}
        <div className="block md:hidden">
          <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>
      </div>
    );
  }

  // If not authenticated, render Login / Register view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-800/20">
        {/* Presentation Column (Desktop/Tablet) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-emerald-800 to-teal-900 p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">FinanAPP</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
              Toma el control inteligente de tu dinero.
            </h1>
            <p className="mt-3 text-emerald-100 text-xs leading-relaxed">
              Registra tus ingresos, gastos, transferencias y presupuestos en cualquier dispositivo con total comodidad.
            </p>
          </div>

          <div className="text-[11px] text-emerald-300 relative z-10">
            FinanAPP • Inteligencia y Control Financiero Personal
          </div>
        </div>

        {/* Form Column */}
        <div className="p-6 sm:p-8 md:col-span-7 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile Brand Wordmark for Small Screens */}
            <div className="md:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                FinanAPP
              </span>
            </div>

            {/* Segmented Tab Switcher with 44px min height */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
                className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
