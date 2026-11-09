import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../auth/hooks/useAuth';
import { transactionService } from '../../transactions/services/transaction.service';
import {
  Transaction,
  FinancialSummary,
  Category,
  Account,
  TransactionType,
  CreateTransactionPayload,
} from '../../transactions/types';
import { Budget } from '../../budgets/types';
import { budgetService } from '../../budgets/services/budget.service';
import { SavingsGoal, savingsService } from '../../savings/services/savings.service';
import { TransactionModal } from '../../transactions/components/TransactionModal';
import { TransactionList } from '../../transactions/components/TransactionList';
import { TransactionDetailModal } from '../../transactions/components/TransactionDetailModal';
import { CategorySummaryCard } from '../../transactions/components/CategorySummaryCard';
import { TransferModal } from '../../accounts/components/TransferModal';
import { MobileDashboard } from './MobileDashboard';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PlusCircle,
  Calendar,
  RefreshCw,
  MinusCircle,
  AlertOctagon,
  AlertTriangle,
  PiggyBank,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { useCurrency } from '../../../shared/hooks/useCurrency';

interface WelcomeDashboardProps {
  onNavigateToHistory?: () => void;
  onNavigateToAccounts?: () => void;
  onNavigateToBudgets?: () => void;
  onNavigateToSavings?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToProfile?: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  onNavigateToHistory,
  onNavigateToAccounts,
  onNavigateToBudgets,
  onNavigateToSavings,
  onNavigateToReports,
  onNavigateToProfile,
}) => {
  const { user } = useAuth();
  const { format, preferredCurrency } = useCurrency();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Detail Modal State
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [sumRes, txsRes, accsRes, catsRes, bgtRes, savRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions(),
        transactionService.getAccounts(),
        transactionService.getCategories(),
        budgetService.getBudgets().catch(() => ({ data: [] })),
        savingsService.getAll().catch(() => []),
      ]);

      setSummary(sumRes.data);
      setTransactions(txsRes.data);
      setAccounts(accsRes.data);
      setCategories(catsRes.data);
      setBudgets(bgtRes.data || []);
      setSavingsGoals(savRes || []);
    } catch (err) {
      console.error('Error al cargar datos financieros:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal to register expense
  const handleOpenExpenseModal = () => {
    setEditingTx(null);
    setModalType('EXPENSE');
    setIsModalOpen(true);
  };

  // Open modal to register income
  const handleOpenIncomeModal = () => {
    setEditingTx(null);
    setModalType('INCOME');
    setIsModalOpen(true);
  };

  // Open modal to edit transaction
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setModalType(tx.type);
    setIsModalOpen(true);
  };

  // Open detail modal
  const handleViewDetail = (tx: Transaction) => {
    setDetailTx(tx);
    setIsDetailOpen(true);
  };

  // Save transaction (create or edit)
  const handleSaveTransaction = async (
    payload: CreateTransactionPayload,
    editId?: string
  ) => {
    if (editId) {
      await transactionService.updateTransaction(editId, payload);
    } else {
      await transactionService.createTransaction(payload);
    }
    await loadData();
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    await transactionService.deleteTransaction(id);
    await loadData();
  };

  const currentBalance = summary?.currentBalance ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;

  // Proactive budget warnings
  const exceededBudgets = budgets.filter((b) => b.percentage >= 100);
  const warningBudgets = budgets.filter((b) => b.percentage >= 80 && b.percentage < 100);
  const hasCriticalBudgets = exceededBudgets.length > 0 || warningBudgets.length > 0;

  return (
    <>
      {/* Mobile-Only Experience (Curved hero, action pills, clean card stack & transactions) */}
      <div className="block md:hidden">
        <MobileDashboard
          summary={summary}
          accounts={accounts}
          transactions={transactions}
          budgets={budgets}
          isLoading={isLoading}
          onDeposit={handleOpenIncomeModal}
          onWithdraw={handleOpenExpenseModal}
          onTransfer={() => setIsTransferModalOpen(true)}
          onViewAllTransactions={onNavigateToHistory}
          onSelectTransaction={handleViewDetail}
          onNavigateToProfile={onNavigateToProfile}
        />
      </div>

      {/* Desktop Experience (100% intact and unchanged) */}
      <div className="hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Saludo y Botones de Acción Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            ¡Hola, {user?.name || 'Usuario'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aquí tienes el resumen financiero y métricas de tus cuentas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToReports && (
            <button
              type="button"
              onClick={onNavigateToReports}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all hover:-translate-y-0.5 shadow-2xs text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Reportes</span>
            </button>
          )}

          <button
            onClick={handleOpenIncomeModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Ingreso</span>
          </button>

          <button
            onClick={handleOpenExpenseModal}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Alerta Proactiva de Presupuestos (Consumo al 80% y 100%) */}
      {hasCriticalBudgets && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            exceededBudgets.length > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {exceededBudgets.length > 0 ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold leading-snug">
                {exceededBudgets.length > 0
                  ? `¡Alerta de Presupuesto! Has superado el 100% de gasto en ${exceededBudgets.length} categoría(s): ${exceededBudgets
                      .map((b) => b.category?.name || 'Gasto')
                      .join(', ')}`
                  : `Atención: Presupuesto al 80%+ de consumo en: ${warningBudgets
                      .map((b) => b.category?.name || 'Gasto')
                      .join(', ')}`}
              </h4>
              <p className="text-[11px] opacity-90 mt-0.5">
                {exceededBudgets.length > 0
                  ? 'Revisa tus egresos para evitar un déficit financiero en este periodo.'
                  : 'Estás muy cerca del tope fijado para tus gastos mensuales.'}
              </p>
            </div>
          </div>
          {onNavigateToBudgets && (
            <button
              type="button"
              onClick={onNavigateToBudgets}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                exceededBudgets.length > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              Revisar Presupuestos
            </button>
          )}
        </div>
      )}

      {/* Tarjetas Principales de Balance Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo Disponible */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Disponible
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                currentBalance < 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {format(currentBalance)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Balance neto consolidado
          </p>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Total Ingresos
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600">
              +{format(totalIncome)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Entradas acumuladas del periodo
          </p>
        </div>

        {/* Total Gastos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Total Gastos
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-600">
              -{format(totalExpenses)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Salidas registradas del periodo
          </p>
        </div>
      </div>

      {/* Grid: Mis Cuentas, Metas de Ahorro & Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Cuentas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Mis Cuentas</span>
              </h2>
              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline"
                >
                  Administrar
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {accounts.slice(0, 3).map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {acc.name}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {acc.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-bold font-mono ${
                          acc.balance < 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {format(acc.balance, acc.currency, { showCode: true })}
                      </p>
                      {acc.isDefault && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Cuentas activas: {accounts.length}</span>
            {onNavigateToAccounts && (
              <button
                type="button"
                onClick={onNavigateToAccounts}
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Metas de Ahorro Preview Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-purple-600" />
                <span>Metas de Ahorro</span>
              </h2>
              {onNavigateToSavings && (
                <button
                  type="button"
                  onClick={onNavigateToSavings}
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer hover:underline"
                >
                  Gestionar
                </button>
              )}
            </div>

            {savingsGoals.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <p>No tienes metas de ahorro fijadas.</p>
                {onNavigateToSavings && (
                  <button
                    type="button"
                    onClick={onNavigateToSavings}
                    className="mt-2 text-purple-600 font-semibold hover:underline"
                  >
                    Crear primera meta
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                    <div
                      key={goal.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800 truncate">{goal.name}</span>
                        <span className="font-mono font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: goal.color || '#7C3AED',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                        <span>{format(goal.currentAmount)}</span>
                        <span>de {format(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Metas: {savingsGoals.length}</span>
            {onNavigateToSavings && (
              <button
                type="button"
                onClick={onNavigateToSavings}
                className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Resumen por Categorías */}
        <div className="lg:col-span-1">
          <CategorySummaryCard breakdown={summary?.categoryBreakdown || []} />
        </div>
      </div>

      {/* Listado de Movimientos Recientes con acciones de Editar y Eliminar */}
      <div>
        <TransactionList
          transactions={transactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onViewDetail={handleViewDetail}
          onViewAll={onNavigateToHistory}
          isLoading={isLoading}
        />
      </div>
        </motion.div>
      </div>

      {/* Modal para Transferencias entre Cuentas (Compartido) */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          loadData();
        }}
        accounts={accounts as any}
      />

      {/* Modal para Ver Detalle del Movimiento */}
      <TransactionDetailModal
        transaction={detailTx}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTx(null);
        }}
        onEdit={(tx) => {
          setIsDetailOpen(false);
          handleEditTransaction(tx);
        }}
      />

      {/* Modal para Crear y Editar Movimientos */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        accounts={accounts}
        initialTransaction={editingTx}
        defaultType={modalType}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />
    </>
  );
};
