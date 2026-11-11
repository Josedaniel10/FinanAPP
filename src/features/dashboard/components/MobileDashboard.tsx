import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCurrency } from '../../../shared/hooks/useCurrency';
import {
  Transaction,
  Account,
  FinancialSummary,
} from '../../transactions/types';
import { Budget } from '../../budgets/types';
import {
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Mic,
} from 'lucide-react';
import { NotificationsModal, NotificationItem } from '../../../shared/components/NotificationsModal';

export interface MobileDashboardProps {
  summary: FinancialSummary | null;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  isLoading?: boolean;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  onOpenIncome?: () => void;
  onOpenExpense?: () => void;
  onOpenTransfer?: () => void;
  onViewTransaction?: (tx: Transaction) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onNavigateToHistory?: () => void;
  onViewAllTransactions?: () => void;
  onNavigateToAccounts?: () => void;
  onNavigateToBudgets?: () => void;
  onNavigateToProfile?: () => void;
  onOpenVoiceAI?: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  summary,
  transactions,
  accounts,
  budgets,
  isLoading,
  onDeposit,
  onWithdraw,
  onTransfer,
  onOpenIncome,
  onOpenExpense,
  onOpenTransfer,
  onViewTransaction,
  onSelectTransaction,
  onNavigateToHistory,
  onViewAllTransactions,
  onNavigateToAccounts,
  onNavigateToBudgets,
  onNavigateToProfile,
  onOpenVoiceAI,
}) => {
  const { user } = useAuth();
  const { format, preferredCurrency } = useCurrency();

  const handleIncome = onDeposit || onOpenIncome || (() => {});
  const handleExpense = onWithdraw || onOpenExpense || (() => {});
  const handleTransfer = onTransfer || onOpenTransfer || (() => {});
  const handleView = onSelectTransaction || onViewTransaction || (() => {});
  const handleAll = onViewAllTransactions || onNavigateToHistory;

  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const currentBalance = summary?.currentBalance ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;

  // Selected account for card display
  const primaryAccount = accounts.length > 0
    ? accounts[activeAccountIndex % accounts.length]
    : null;

  // Proactive budget warnings
  const exceededBudgets = budgets.filter((b) => b.percentage >= 100);
  const warningBudgets = budgets.filter((b) => b.percentage >= 80 && b.percentage < 100);
  const hasAlerts = exceededBudgets.length > 0 || warningBudgets.length > 0;

  // Generate notifications list from live state
  const notifications: NotificationItem[] = [
    ...(exceededBudgets.map((b, i) => ({
      id: `alert-exceeded-${i}`,
      type: 'DANGER' as const,
      title: `Límite Superado: ${b.category?.name || 'Presupuesto'}`,
      message: `Has consumido el ${b.percentage}% de tu presupuesto fijado en esta categoría.`,
      time: 'Crítico',
    }))),
    ...(warningBudgets.map((b, i) => ({
      id: `alert-warning-${i}`,
      type: 'WARNING' as const,
      title: `Alerta 80%: ${b.category?.name || 'Presupuesto'}`,
      message: `Estás cerca del límite (${b.percentage}% gastado en este periodo).`,
      time: 'Atención',
    }))),
    {
      id: 'alert-system',
      type: 'SUCCESS' as const,
      title: 'Cuentas y Balances Sincronizados',
      message: `Tus ${accounts.length} cuenta(s) están actualizadas y respaldadas en MongoDB Atlas.`,
      time: 'Al día',
    },
  ];

  // User initial
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Format short friendly date
  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return 'Hoy';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return `Hoy, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Delta calculation for trend pill
  const monthlyDeltaText = totalIncome > 0
    ? `${totalExpenses <= totalIncome ? '↗' : '↘'} ${Math.round(((totalIncome - totalExpenses) / (totalIncome || 1)) * 100)}% flujo neto`
    : '↗ Saldo al día';

  const handleNextAccount = () => {
    if (accounts.length > 1) {
      setActiveAccountIndex((prev) => (prev + 1) % accounts.length);
    }
  };

  return (
    <div className="w-full space-y-5 pb-6">
      {/* 1. TOP CURVED HERO CARD (FinanAPP Emerald-to-Teal-to-Slate Gradient) */}
      <div className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-b from-[#06302b] via-[#09473e] to-[#042421] text-white pt-5 pb-5 px-5 shadow-xl overflow-hidden select-none border border-emerald-900/40">
        {/* Soft Ambient Background Highlights */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-16 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Bar: Profile Avatar (Left) and Notification Bell (Right) */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          {/* Profile Avatar Button */}
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="flex items-center gap-2.5 p-1 rounded-full group cursor-pointer active:scale-95 transition-transform"
            title="Ver mi perfil"
            aria-label="Abrir perfil de usuario"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-200 text-emerald-950 font-black text-sm flex items-center justify-center ring-2 ring-white/40 shadow-md">
              {userInitial}
            </div>
            <div className="text-left hidden xs:block">
              <span className="text-[10px] text-emerald-200/70 block leading-tight">
                Hola,
              </span>
              <span className="text-xs font-bold text-white block leading-tight">
                {user?.name.split(' ')[0]}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Frosted Notification Bell Button */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/15 flex items-center justify-center relative cursor-pointer transition-all shadow-xs"
              title="Notificaciones"
              aria-label="Ver notificaciones y alertas"
            >
              <Bell className="w-5 h-5 text-white/90" />
              {hasAlerts && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-2.5 right-2.5 ring-2 ring-slate-950 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Central Balance Display */}
        <div className="relative z-10 text-center my-3">
          <p className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-widest">
            Balance
          </p>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mt-1">
            {format(currentBalance)}
          </h1>

          {/* Trend Pill */}
          <div className="mt-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-emerald-200 font-medium">
              <span>{monthlyDeltaText}</span>
            </span>
          </div>
        </div>

        {/* Layered Card Deck at bottom of hero */}
        <div className="relative z-10 mt-5 pt-1">
          {/* Card Layer 1 (Back) */}
          <div className="w-[78%] mx-auto h-2 bg-white/10 rounded-t-xl" />
          {/* Card Layer 2 (Middle) */}
          <div className="w-[88%] mx-auto h-2.5 bg-white/15 rounded-t-xl" />

          {/* Card Layer 3: Front Active Card */}
          <div
            onClick={handleNextAccount}
            className="w-full rounded-2xl p-4 bg-gradient-to-r from-emerald-600/85 via-teal-600/85 to-cyan-700/85 backdrop-blur-xl border border-white/25 shadow-xl text-white cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between text-xs text-white/90 mb-3">
              <span className="font-bold tracking-tight">
                {primaryAccount?.name || 'Cuenta Principal'}
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/15">
                {format(primaryAccount?.balance ?? currentBalance, primaryAccount?.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between font-mono text-xs tracking-wider text-white/90">
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  •••• {primaryAccount?.id ? primaryAccount.id.slice(-4).toUpperCase() : '9286'}
                </span>
                <span className="text-[10px] text-white/70">
                  {primaryAccount?.type || 'CASH'}
                </span>
              </div>
              <span className="font-sans font-black text-xs tracking-tight italic opacity-95">
                VISA
              </span>
            </div>
          </div>

          {/* Accounts Dots Indicator if more than 1 account */}
          {accounts.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {accounts.slice(0, 5).map((acc, idx) => (
                <div
                  key={acc.id}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeAccountIndex % accounts.length
                      ? 'w-4 bg-white'
                      : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. QUICK ACTIONS BAR (Deposit, Transfer, Withdraw) + Voice AI */}
      <div className="space-y-2.5">
        {onOpenVoiceAI && (
          <button
            type="button"
            onClick={onOpenVoiceAI}
            className="w-full min-h-[48px] h-12 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xs text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4 stroke-[2.5]" />
            <span>Registro por voz</span>
          </button>
        )}

        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Deposit / Ingreso */}
          <button
            type="button"
            onClick={handleIncome}
            className="flex-1 min-h-[48px] h-12 px-3 sm:px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>Ingreso</span>
          </button>

          {/* Transfer / Transferir entre cuentas */}
          <button
            type="button"
            onClick={handleTransfer}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs text-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
            title="Transferir entre cuentas"
            aria-label="Transferir saldo entre cuentas"
          >
            <ArrowLeftRight className="w-4 h-4 text-teal-700 stroke-[2.5]" />
          </button>

          {/* Withdraw / Gasto */}
          <button
            type="button"
            onClick={handleExpense}
            className="flex-1 min-h-[48px] h-12 px-3 sm:px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowDownLeft className="w-4 h-4 text-rose-600 stroke-[2.5]" />
            <span>Gasto</span>
          </button>
        </div>
      </div>

      {/* 3. PROACTIVE BUDGET WARNING (Compact Banner if needed) */}
      {hasAlerts && (
        <div>
          <div
            onClick={onNavigateToBudgets}
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer shadow-2xs active:scale-[0.99] transition-all ${
              exceededBudgets.length > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className={`w-4 h-4 shrink-0 ${exceededBudgets.length > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
              <p className="text-xs font-bold truncate">
                {exceededBudgets.length > 0
                  ? `Límite superado en ${exceededBudgets[0]?.category?.name || 'Presupuesto'}`
                  : `Atención: Presupuesto al 80%+ de consumo`}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
          </div>
        </div>
      )}

      {/* 4. RECENT TRANSACTIONS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Movimientos Recientes
          </h2>
          {handleAll && (
            <button
              type="button"
              onClick={handleAll}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-700 active:scale-95 transition-colors cursor-pointer"
            >
              Ver todos
            </button>
          )}
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs font-bold text-slate-700">Sin movimientos recientes</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Usa los botones superiores para registrar tu primer ingreso o gasto.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isTransfer = tx.type === 'TRANSFER';

              return (
                <div
                  key={tx.id}
                  onClick={() => handleView(tx)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs flex items-center justify-between gap-3 active:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                      style={{
                        backgroundColor:
                          tx.category?.color ||
                          (isIncome ? '#059669' : isTransfer ? '#0D9488' : '#E11D48'),
                      }}
                    >
                      {tx.category?.name ? tx.category.name.charAt(0).toUpperCase() : (isIncome ? '+' : '-')}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {tx.description || tx.category?.name || (isIncome ? 'Ingreso' : 'Gasto')}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {formatShortDate(tx.date)}
                        {tx.account?.name ? ` · ${tx.account.name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isIncome ? 'text-emerald-600' : isTransfer ? 'text-teal-700' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}{format(tx.amount, tx.account?.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications Bottom Sheet Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        items={notifications}
      />
    </div>
  );
};
