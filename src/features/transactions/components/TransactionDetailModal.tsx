import React from 'react';
import { Transaction } from '../types';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Tag,
  Repeat,
  FileText,
  Clock,
  Edit2,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'INCOME';

  const formatPaymentMethod = (pm?: string) => {
    switch (pm) {
      case 'CASH':
        return 'Efectivo';
      case 'DEBIT_CARD':
        return 'Tarjeta de Débito';
      case 'CREDIT_CARD':
        return 'Tarjeta de Crédito';
      case 'TRANSFER':
        return 'Transferencia bancaria';
      case 'OTHER':
        return 'Otro método';
      default:
        return 'No especificado';
    }
  };

  const formatRecurrence = (rec?: string) => {
    switch (rec) {
      case 'DAILY':
        return 'Recurrencia diaria';
      case 'WEEKLY':
        return 'Recurrencia semanal';
      case 'MONTHLY':
        return 'Recurrencia mensual';
      case 'YEARLY':
        return 'Recurrencia anual';
      default:
        return 'Única vez (sin recurrencia)';
    }
  };

  const formatDateTime = (isoDate?: string) => {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header con color temático */}
        <div
          className={`p-6 border-b flex items-start justify-between ${
            isIncome
              ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
              : 'bg-rose-50/70 border-rose-100 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isIncome
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              }`}
            >
              {isIncome ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                  isIncome
                    ? 'bg-emerald-200/60 text-emerald-800'
                    : 'bg-rose-200/60 text-rose-800'
                }`}
              >
                {isIncome ? 'Ingreso' : 'Gasto'}
              </span>
              <h2 className="text-2xl font-black tracking-tight mt-1">
                {isIncome ? '+' : '-'}$
                {transaction.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-semibold opacity-70">
                  {transaction.account?.currency || 'USD'}
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-slate-800">
          {/* Descripción */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Descripción
            </span>
            <p className="text-base font-semibold text-slate-900">
              {transaction.description}
            </p>
          </div>

          {/* Grid de atributos */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Categoría */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Categoría</span>
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: transaction.category?.color || '#6B7280',
                  }}
                />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {transaction.category?.name || 'Sin categoría'}
                </span>
              </div>
            </div>

            {/* Cuenta / Destino */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                <CreditCard className="w-3 h-3 text-slate-400" />
                <span>Cuenta</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                {transaction.account?.name || 'Cuenta Principal'}
              </p>
            </div>

            {/* Fecha del movimiento */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Fecha</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                {transaction.date}
              </p>
            </div>

            {/* Recurrencia o Método de pago */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                {isIncome ? (
                  <Repeat className="w-3 h-3 text-slate-400" />
                ) : (
                  <CreditCard className="w-3 h-3 text-slate-400" />
                )}
                <span>{isIncome ? 'Recurrencia' : 'Método de pago'}</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                {isIncome
                  ? formatRecurrence(transaction.recurrence)
                  : formatPaymentMethod(transaction.paymentMethod)}
              </p>
            </div>
          </div>

          {/* Notas adicionales si existen */}
          {transaction.notes && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Notas adicionales</span>
              </span>
              <p className="text-xs text-slate-700 italic">
                "{transaction.notes}"
              </p>
            </div>
          )}

          {/* Metadatos de auditoría */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Registrado: {formatDateTime(transaction.createdAt)}</span>
            </span>
            <span className="font-mono text-[10px]">ID: {transaction.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar movimiento</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
