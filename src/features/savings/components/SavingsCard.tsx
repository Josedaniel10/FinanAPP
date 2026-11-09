import React from 'react';
import { SavingsGoal } from '../services/savings.service';
import { PiggyBank, Target, Calendar, Plus, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { DSButton } from '../../../design-system';
import { useCurrency } from '../../../shared/hooks/useCurrency';

interface SavingsCardProps {
  goal: SavingsGoal;
  onContribute: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

export const SavingsCard: React.FC<SavingsCardProps> = ({
  goal,
  onContribute,
  onEdit,
  onDelete,
}) => {
  const { format } = useCurrency();
  const percent = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  );
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isCompleted = goal.isCompleted || goal.currentAmount >= goal.targetAmount;

  // Calculate days remaining if targetDate is set
  let daysRemainingText: string | null = null;
  let isOverdue = false;

  if (goal.targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(goal.targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      daysRemainingText = `Venció hace ${Math.abs(diffDays)} día(s)`;
      isOverdue = true;
    } else if (diffDays === 0) {
      daysRemainingText = 'Vence hoy';
    } else {
      daysRemainingText = `Quedan ${diffDays} día(s)`;
    }
  }

  const cardColor = goal.color || '#059669';

  return (
    <div
      className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between ${
        isCompleted
          ? 'border-emerald-300 ring-1 ring-emerald-500/10'
          : isOverdue
          ? 'border-rose-200'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: cardColor }}
          >
            <PiggyBank className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completada
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                <Clock className="w-3.5 h-3.5" /> Plazo Vencido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                En progreso
              </span>
            )}
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {percent}%
            </span>
          </div>
        </div>

        {/* Goal Title */}
        <h3 className="font-bold text-base text-slate-900 tracking-tight truncate">
          {goal.name}
        </h3>

        {/* Target Date text */}
        {daysRemainingText ? (
          <p
            className={`text-xs mt-0.5 flex items-center gap-1 ${
              isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{daysRemainingText}</span>
            <span className="text-slate-400 font-mono">({goal.targetDate})</span>
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5">Sin fecha límite establecida</p>
        )}

        {/* Progress Bar with smooth animation */}
        <div className="mt-4">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                backgroundColor: isCompleted ? '#10B981' : cardColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-2 text-slate-600 font-mono">
            <span>
              Ahorrado: <strong className="text-slate-900 font-bold">{format(goal.currentAmount)}</strong>
            </span>
            <span>
              Meta: <strong className="text-slate-900 font-bold">{format(goal.targetAmount)}</strong>
            </span>
          </div>

          {!isCompleted && (
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              Faltan <strong className="font-mono text-slate-700 font-bold">{format(remaining)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onContribute(goal)}
          className="min-h-[44px] flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Aportar Fondos</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Editar meta"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            aria-label="Eliminar meta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
