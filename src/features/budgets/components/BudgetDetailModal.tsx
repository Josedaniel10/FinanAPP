import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, ListOrdered, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Budget, BudgetWithTransactions } from '../types';
import { budgetService } from '../services/budget.service';

interface BudgetDetailModalProps {
  budget: Budget | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  budget,
  isOpen,
  onClose,
}) => {
  const [detail, setDetail] = useState<BudgetWithTransactions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && budget) {
      setLoading(true);
      budgetService
        .getBudgetById(budget.id)
        .then((res) => setDetail(res.data))
        .catch((err) => console.error('Error fetching budget detail:', err))
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  }, [isOpen, budget]);

  if (!isOpen || !budget) return null;

  const current = detail || budget;
  const isExceeded = current.alertStatus === 'EXCEEDED';
  const isWarning = current.alertStatus === 'WARNING';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm"
              style={{ backgroundColor: current.category?.color || '#059669' }}
            >
              {current.category?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {current.category?.name || 'Detalle de Presupuesto'}
              </h3>
              <p className="text-xs text-slate-400">
                {current.startDate} al {current.endDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isExceeded
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {isExceeded ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-bold">
                {isExceeded
                  ? 'Presupuesto Superado'
                  : isWarning
                  ? 'Atención: Límite cercano'
                  : 'Presupuesto dentro del límite'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isExceeded
                  ? `Has sobrepasado el límite por $${Math.abs(
                      current.remaining
                    ).toLocaleString('es-ES', { minimumFractionDigits: 2 })}.`
                  : isWarning
                  ? `Has consumido el ${current.percentage}% del presupuesto.`
                  : `Te quedan $${current.remaining.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                    })} disponibles.`}
              </p>
            </div>
          </div>

          {/* Metric stats grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                Límite
              </span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                ${current.limitAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                Gastado
              </span>
              <span className="text-xs font-bold text-rose-600 mt-1 block">
                ${current.spent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                Disponible
              </span>
              <span
                className={`text-xs font-bold mt-1 block ${
                  current.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                ${current.remaining.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Related expenses list */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
              Gastos computados en este período:
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Cargando gastos vinculados...
              </div>
            ) : detail?.relatedTransactions && detail.relatedTransactions.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {detail.relatedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {tx.date} {tx.paymentMethod ? `• ${tx.paymentMethod}` : ''}
                      </p>
                    </div>
                    <span className="font-bold text-rose-600">
                      -${tx.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100">
                No hay gastos registrados en esta categoría durante este período.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
