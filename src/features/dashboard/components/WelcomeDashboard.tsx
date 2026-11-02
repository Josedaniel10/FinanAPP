import React, { useState, useEffect, useCallback } from 'react';
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
import { TransactionModal } from '../../transactions/components/TransactionModal';
import { TransactionList } from '../../transactions/components/TransactionList';
import { TransactionDetailModal } from '../../transactions/components/TransactionDetailModal';
import { CategorySummaryCard } from '../../transactions/components/CategorySummaryCard';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PlusCircle,
  Calendar,
  RefreshCw,
  MinusCircle,
} from 'lucide-react';

interface WelcomeDashboardProps {
  onNavigateToHistory?: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  onNavigateToHistory,
}) => {
  const { user } = useAuth();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Detail Modal State
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [sumRes, txsRes, accsRes, catsRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions(),
        transactionService.getAccounts(),
        transactionService.getCategories(),
      ]);

      setSummary(sumRes.data);
      setTransactions(txsRes.data);
      setAccounts(accsRes.data);
      setCategories(catsRes.data);
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
    // Refresh all balances, accounts and transaction list
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Saludo y Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Hola, {user?.name || 'Usuario'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumen consolidado de tus finanzas personales
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Actualizar datos"
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenIncomeModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Ingreso</span>
          </button>

          <button
            onClick={handleOpenExpenseModal}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Principales de Balance Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Saldo Disponible */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Disponible
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`text-3xl font-extrabold ${
                currentBalance < 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="ml-2 text-xs font-medium text-slate-500">USD</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Balance total de tus cuentas activas
          </p>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ingresos
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-600">
              +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="ml-2 text-xs font-medium text-slate-500">USD</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Suma de todos tus ingresos registrados
          </p>
        </div>

        {/* Total Gastos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Gastos
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-rose-600">
              -${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="ml-2 text-xs font-medium text-slate-500">USD</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Suma de todos tus gastos registrados
          </p>
        </div>
      </div>

      {/* Grid: Mis Cuentas & Resumen por Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Cuentas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Mis Cuentas</span>
              </h2>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {acc.name}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {acc.type === 'CASH' ? 'Efectivo / General' : acc.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          acc.balance < 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Cuentas activas: {accounts.length}</span>
            <span>Moneda: USD</span>
          </div>
        </div>

        {/* Resumen por Categorías */}
        <div className="lg:col-span-2">
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
    </div>
  );
};
