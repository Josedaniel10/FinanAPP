import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Edit2,
  Trash2,
  ListFilter,
} from 'lucide-react';
import { Budget } from '../types';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
  onViewDetails: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const {
    category,
    limitAmount,
    spent,
    remaining,
    percentage,
    alertStatus,
    period,
    startDate,
    endDate,
    name,
  } = budget;

  // Visual status indicators
  const isExceeded = alertStatus === 'EXCEEDED';
  const isWarning = alertStatus === 'WARNING';

  // Period label translation
  const periodLabels: Record<string, string> = {
    MONTHLY: 'Mensual',
    WEEKLY: 'Semanal',
    YEARLY: 'Anual',
    CUSTOM: 'Personalizado',
  };

  const getStatusBadge = () => {
    if (isExceeded) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3 h-3" />
          <span>¡Límite Superado!</span>
        </div>
      );
    }
    if (isWarning) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          <span>Cerca del Límite</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        <span>Saludable</span>
      </div>
    );
  };

  const getProgressBarColor = () => {
    if (isExceeded) return 'bg-rose-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md ${
        isExceeded
          ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
          : isWarning
          ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10'
          : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-xs"
            style={{ backgroundColor: category?.color || '#059669' }}
          >
            {category?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {category?.name || 'Categoría de gasto'}
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                {periodLabels[period] || period}
              </span>
            </div>
            {name && (
              <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                {name}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-4 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">
          {startDate} al {endDate}
        </span>
      </div>

      {/* Progress & Numbers */}
      <div className="space-y-2 mb-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-slate-600">Gastado:</span>
          <span className="font-bold text-slate-900 text-sm">
            ${spent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs text-slate-400 font-normal">
              de ${limitAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="font-medium text-slate-500">
            {percentage}% utilizado
          </span>
          <span
            className={`font-semibold ${
              remaining < 0
                ? 'text-rose-600'
                : remaining === 0
                ? 'text-amber-600'
                : 'text-emerald-700'
            }`}
          >
            {remaining < 0
              ? `Excedido por $${Math.abs(remaining).toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                })}`
              : `Disponible: $${remaining.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                })}`}
          </span>
        </div>
      </div>

      {/* Actions footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onViewDetails(budget)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Ver Gastos</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(budget)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Editar presupuesto"
            aria-label="Editar presupuesto"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(budget.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Eliminar presupuesto"
            aria-label="Eliminar presupuesto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
