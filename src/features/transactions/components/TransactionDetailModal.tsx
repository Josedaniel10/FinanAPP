import React from 'react';
import { Transaction } from '../types';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Calendar,
  CreditCard,
  Tag,
  Clock,
  Edit2,
} from 'lucide-react';
import { DSBottomSheet, DSButton } from '../../../design-system';

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
  const isTransfer = transaction.type === 'TRANSFER';

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

  return (
    <DSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Movimiento"
      maxHeight="65"
      footer={
        onEdit && (
          <DSButton
            type="button"
            variant="primary"
            fullWidth
            size="md"
            className="min-h-[48px]"
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
          >
            Editar Movimiento
          </DSButton>
        )
      }
    >
      <div className="space-y-4">
        {/* Main Amount Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <div className="inline-flex p-2 rounded-xl mb-2">
            {isTransfer ? (
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
            ) : isIncome ? (
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <TrendingDown className="w-6 h-6" />
              </div>
            )}
          </div>
          <h4
            className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
              isTransfer
                ? 'text-blue-700'
                : isIncome
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {isIncome ? '+' : isTransfer ? '⇄ ' : '-'} $
            {transaction.amount.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h4>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            {transaction.description}
          </p>
        </div>

        {/* Metadata Details List */}
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-slate-400" /> Categoría
            </span>
            <span className="font-semibold text-slate-800">
              {transaction.category?.name || 'General'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-400" /> Cuenta
            </span>
            <span className="font-semibold text-slate-800">
              {transaction.account?.name || 'Cuenta Principal'}
              {transaction.destinationAccount && (
                <span className="text-blue-600 block text-right font-medium">
                  → {transaction.destinationAccount.name}
                </span>
              )}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> Fecha
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {transaction.date}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> Método
            </span>
            <span className="font-semibold text-slate-800">
              {formatPaymentMethod(transaction.paymentMethod)}
            </span>
          </div>

          {transaction.notes && (
            <div className="py-2.5">
              <span className="text-slate-500 block mb-1">Notas:</span>
              <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 italic text-xs leading-relaxed">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </DSBottomSheet>
  );
};
