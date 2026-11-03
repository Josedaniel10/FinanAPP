import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { DSChip, DSButton, DSModal } from '../../../design-system';

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

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs animate-pulse flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="h-5 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Horizontal Interactive Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3 -mx-1 px-1">
        <DSChip
          label="Todos"
          isActive={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          count={transactions.length}
        />
        <DSChip
          label="Gastos"
          isActive={filter === 'EXPENSE'}
          onClick={() => setFilter('EXPENSE')}
          icon={<TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
          count={transactions.filter((t) => t.type === 'EXPENSE').length}
        />
        <DSChip
          label="Ingresos"
          isActive={filter === 'INCOME'}
          onClick={() => setFilter('INCOME')}
          icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
          count={transactions.filter((t) => t.type === 'INCOME').length}
        />
        <DSChip
          label="Transferencias"
          isActive={filter === 'TRANSFER'}
          onClick={() => setFilter('TRANSFER')}
          icon={<ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />}
          count={transactions.filter((t) => t.type === 'TRANSFER').length}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 my-2">
          <p className="text-sm font-semibold text-slate-700">Sin movimientos</p>
          <p className="text-xs text-slate-400 mt-1">
            No hay registros para el filtro seleccionado.
          </p>
        </div>
      ) : (
        /* Vertical Cards Feed with Generous Touch Targets */
        <div className="space-y-2.5">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const isTransfer = tx.type === 'TRANSFER';

            return (
              <div
                key={tx.id}
                onClick={() => onViewDetail?.(tx)}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs hover:border-slate-300 active:bg-slate-50 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                {/* Left: Category Icon with 40x40 container */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isTransfer
                      ? 'bg-blue-100 text-blue-700'
                      : isIncome
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isTransfer ? (
                    <ArrowLeftRight className="w-5 h-5" />
                  ) : isIncome ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>

                {/* Middle: Description & Clean Unboxed Metadata */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {tx.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                    <span>{tx.category?.name || 'General'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{tx.date}</span>
                    {tx.account && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{tx.account.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Tabular Amount & Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="text-right mr-1">
                    <span
                      className={`font-mono tabular-nums font-bold text-sm block ${
                        isTransfer
                          ? 'text-blue-700'
                          : isIncome
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '⇄ ' : '-'} $
                      {tx.amount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* 48x48 Touch Actions */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(tx);
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    aria-label="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(tx.id);
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onViewAll && transactions.length > 5 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-[48px] w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DSModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="¿Eliminar movimiento?"
        subtitle="Esta acción actualizará automáticamente el saldo de la cuenta."
        footer={
          <div className="flex gap-2 w-full">
            <DSButton
              variant="outline"
              size="md"
              className="flex-1 min-h-[48px]"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              Cancelar
            </DSButton>
            <DSButton
              variant="danger"
              size="md"
              className="flex-1 min-h-[48px]"
              isLoading={isDeleting}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Eliminar
            </DSButton>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar este movimiento financiero de manera permanente?
        </p>
      </DSModal>
    </div>
  );
};
