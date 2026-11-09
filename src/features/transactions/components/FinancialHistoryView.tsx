import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Transaction,
  TransactionType,
  Category,
  Account,
  TransactionFilterParams,
  CreateTransactionPayload,
} from '../types';
import { transactionService } from '../services/transaction.service';
import { TransactionFiltersBar } from './TransactionFiltersBar';
import { TransactionDetailModal } from './TransactionDetailModal';
import { TransactionModal } from './TransactionModal';
import {
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  FileText,
  AlertTriangle,
  RotateCcw,
  MinusCircle,
  Scale,
} from 'lucide-react';
import { useCurrency } from '../../../shared/hooks/useCurrency';

interface FinancialHistoryViewProps {
  onNavigateToDashboard?: () => void;
}

export const FinancialHistoryView: React.FC<FinancialHistoryViewProps> = () => {
  const { format, preferredCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [filters, setFilters] = useState<TransactionFilterParams>({});

  // Modals state
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');

  // Deletion state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load static catalog (categories, accounts)
  const loadCatalogs = useCallback(async () => {
    try {
      const [catsRes, accsRes] = await Promise.all([
        transactionService.getCategories(),
        transactionService.getAccounts(),
      ]);
      setCategories(catsRes.data);
      setAccounts(accsRes.data);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  }, []);

  // Fetch transactions with applied filters
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await transactionService.getTransactions(filters);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error al consultar movimientos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Action handlers
  const handleOpenDetail = (tx: Transaction) => {
    setDetailTx(tx);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditTx(tx);
    setModalType(tx.type);
    setIsModalOpen(true);
  };

  const handleOpenNew = (type: TransactionType) => {
    setEditTx(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (
    payload: CreateTransactionPayload,
    editId?: string
  ) => {
    if (editId) {
      await transactionService.updateTransaction(editId, payload);
    } else {
      await transactionService.createTransaction(payload);
    }
    await Promise.all([fetchTransactions(), loadCatalogs()]);
  };

  const handleDeleteTransaction = async (id: string) => {
    setIsDeleting(true);
    try {
      await transactionService.deleteTransaction(id);
      setDeleteConfirmId(null);
      if (detailTx?.id === id) {
        setIsDetailOpen(false);
        setDetailTx(null);
      }
      await Promise.all([fetchTransactions(), loadCatalogs()]);
    } catch (err) {
      console.error('Error al eliminar movimiento:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  // Metrics derived from the filtered transactions
  const filteredMetrics = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    for (const t of transactions) {
      if (t.type === 'INCOME') {
        incomeSum += t.amount;
      } else {
        expenseSum += t.amount;
      }
    }
    const net = incomeSum - expenseSum;
    return {
      count: transactions.length,
      incomeSum,
      expenseSum,
      net,
    };
  }, [transactions]);

  const formatPaymentMethod = (pm?: string) => {
    switch (pm) {
      case 'CASH':
        return 'Efectivo';
      case 'DEBIT_CARD':
        return 'T. Débito';
      case 'CREDIT_CARD':
        return 'T. Crédito';
      case 'TRANSFER':
        return 'Transferencia';
      case 'OTHER':
        return 'Otro';
      default:
        return null;
    }
  };

  const formatRecurrence = (rec?: string) => {
    switch (rec) {
      case 'DAILY':
        return 'Diaria';
      case 'WEEKLY':
        return 'Semanal';
      case 'MONTHLY':
        return 'Mensual';
      case 'YEARLY':
        return 'Anual';
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Historial Financiero
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta y filtra todos tus ingresos y gastos registrados
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons to record transactions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenNew('INCOME')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Ingreso</span>
          </button>
          <button
            onClick={() => handleOpenNew('EXPENSE')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Filtered Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Movimientos Filtrados
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {filteredMetrics.count}
            </span>
            <span className="text-xs text-slate-500">registros</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Ingresos del Periodo
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">
              +{format(filteredMetrics.incomeSum)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Gastos del Periodo
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-600">
              -{format(filteredMetrics.expenseSum)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Flujo Neto</span>
            <Scale className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <div className="mt-2">
            <span
              className={`text-2xl font-extrabold ${
                filteredMetrics.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {filteredMetrics.net >= 0 ? '+' : '-'}{format(Math.abs(filteredMetrics.net))}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar Component */}
      <TransactionFiltersBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
        accounts={accounts}
        onReset={handleResetFilters}
      />

      {/* Delete Confirmation Banner */}
      {deleteConfirmId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              ¿Confirmas que deseas eliminar este movimiento? El saldo de la cuenta será recalculado automáticamente.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDeleteTransaction(deleteConfirmId)}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      )}

      {/* Results Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando historial de movimientos...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No se encontraron movimientos
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {Object.keys(filters).length > 0
                ? 'Ningún movimiento coincide con los filtros aplicados. Prueba ajustar o limpiar los filtros.'
                : 'Aún no has registrado ningún movimiento. Comienza añadiendo tu primer ingreso o gasto.'}
            </p>
            {Object.keys(filters).length > 0 ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer filtros</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenNew('INCOME')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Registrar primer movimiento
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (md:hidden): Touch-Friendly Transaction Cards */}
            <div className="block md:hidden divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                const pmLabel = formatPaymentMethod(tx.paymentMethod);
                const recLabel = formatRecurrence(tx.recurrence);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 hover:bg-slate-50 transition-colors active:bg-slate-100/70"
                  >
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => handleOpenDetail(tx)}
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
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">
                            {tx.description || tx.category?.name || (isIncome ? 'Ingreso' : 'Gasto')}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            <span>{tx.date}</span>
                            <span>·</span>
                            <span>{tx.account?.name || 'Principal'}</span>
                            {tx.category?.name && (
                              <>
                                <span>·</span>
                                <span className="font-medium text-slate-600 truncate">{tx.category.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono tabular-nums block ${
                            isIncome ? 'text-emerald-600' : isTransfer ? 'text-teal-700' : 'text-slate-900'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}{format(tx.amount, tx.account?.currency || preferredCurrency)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {tx.account?.currency || preferredCurrency}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Quick Action Buttons Bar */}
                    <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(tx)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tx)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(tx.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW (hidden md:block): Complete Detailed Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Cuenta</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    const pmLabel = formatPaymentMethod(tx.paymentMethod);
                    const recLabel = formatRecurrence(tx.recurrence);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(tx)}
                      >
                        {/* Fecha */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tx.date}</span>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isIncome ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span
                              className={`font-semibold ${
                                isIncome ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isIncome ? 'Ingreso' : 'Gasto'}
                            </span>
                          </div>
                        </td>

                        {/* Descripción & Notas */}
                        <td className="py-3.5 px-4">
                          <div className="max-w-xs sm:max-w-sm truncate">
                            <p className="font-semibold text-slate-900 truncate">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isIncome && recLabel && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                                  {recLabel}
                                </span>
                              )}
                              {!isIncome && pmLabel && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {pmLabel}
                                </span>
                              )}
                              {tx.notes && (
                                <span className="text-[10px] text-slate-400 italic truncate">
                                  "{tx.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {tx.category ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: tx.category.color || '#6B7280',
                                }}
                              />
                              <span className="font-medium text-slate-700">
                                {tx.category.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Cuenta */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tx.account?.name || 'Principal'}</span>
                          </div>
                        </td>

                        {/* Monto */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span
                            className={`text-sm font-bold ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{format(tx.amount, tx.account?.currency || preferredCurrency)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {tx.account?.currency || preferredCurrency}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td
                          className="py-3.5 px-4 whitespace-nowrap text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenDetail(tx)}
                              title="Ver detalle del movimiento"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              title="Editar movimiento"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(tx.id)}
                              title="Eliminar movimiento"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalle */}
      <TransactionDetailModal
        transaction={detailTx}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTx(null);
        }}
        onEdit={(tx) => handleOpenEdit(tx)}
      />

      {/* Modal de Creación / Edición */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTx(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        accounts={accounts}
        initialTransaction={editTx}
        defaultType={modalType}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />
    </div>
  );
};
