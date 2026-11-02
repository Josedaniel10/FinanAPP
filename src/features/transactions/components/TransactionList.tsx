import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Repeat,
  FileText,
  AlertTriangle,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
  onViewDetail?: (tx: Transaction) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onViewDetail,
  onViewAll,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'ALL' | TransactionType>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = transactions.filter((t) => {
    if (filter === 'ALL') return true;
    return t.type === filter;
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Movimientos Recientes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {transactions.length} movimiento(s) registrado(s)
            </p>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer ml-2"
            >
              <span>Ver historial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilter('EXPENSE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'EXPENSE'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('INCOME')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'INCOME'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ingresos</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Alert if selected */}
      {deleteConfirmId && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
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
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      )}

      {/* List content */}
      {filtered.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            No hay movimientos para mostrar
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {filter === 'ALL'
              ? 'Comienza registrando tu primer ingreso o gasto con los botones superiores.'
              : `No se encontraron registros en la sección de ${filter === 'INCOME' ? 'ingresos' : 'gastos'}.`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const pmLabel = formatPaymentMethod(tx.paymentMethod);
            const recLabel = formatRecurrence(tx.recurrence);

            return (
              <div
                key={tx.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                {/* Left: Icon, Description, Category and Metadata */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {tx.description}
                      </span>
                      {tx.category && (
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: tx.category.color || '#6B7280' }}
                        >
                          {tx.category.name}
                        </span>
                      )}
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{tx.date}</span>
                      </span>

                      {tx.account && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{tx.account.name}</span>
                        </span>
                      )}

                      {isIncome && recLabel && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          <Repeat className="w-3 h-3" />
                          <span>{recLabel}</span>
                        </span>
                      )}

                      {!isIncome && pmLabel && (
                        <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {pmLabel}
                        </span>
                      )}

                      {tx.notes && (
                        <span className="italic text-slate-400">
                          "{tx.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}$
                      {tx.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {tx.account?.currency || 'USD'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {onViewDetail && (
                      <button
                        onClick={() => onViewDetail(tx)}
                        title="Ver detalle"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(tx)}
                      title="Editar movimiento"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(tx.id)}
                      title="Eliminar movimiento"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
