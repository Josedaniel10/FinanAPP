import React, { useState } from 'react';
import {
  useSavingsGoalsQuery,
  useDeleteSavingsGoalMutation,
} from '../hooks/useSavingsQuery';
import { SavingsGoal } from '../services/savings.service';
import { SavingsCard } from './SavingsCard';
import { SavingGoalModal } from './SavingGoalModal';
import { DepositModal } from './DepositModal';
import {
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  CheckCircle2,
  Clock,
  Coins,
} from 'lucide-react';
import { DSButton, DSChip, DSModal } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';

export const SavingsView: React.FC = () => {
  const { data: goals = [], isLoading } = useSavingsGoalsQuery();
  const deleteMutation = useDeleteSavingsGoalMutation();

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Calculate summary metrics
  const totalSaved = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
  const globalPercent =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const completedCount = goals.filter(
    (g) => g.isCompleted || g.currentAmount >= g.targetAmount
  ).length;
  const activeCount = goals.length - completedCount;

  const filteredGoals = goals.filter((g) => {
    const isCompleted = g.isCompleted || g.currentAmount >= g.targetAmount;
    if (filter === 'ACTIVE') return !isCompleted;
    if (filter === 'COMPLETED') return isCompleted;
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showToast({ type: 'success', message: 'Meta de ahorro eliminada.' });
      setDeleteConfirmId(null);
    } catch {
      showToast({ type: 'error', message: 'Error al eliminar la meta.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <PiggyBank className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Objetivos & Futuro
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Metas de Ahorro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define tus aspiraciones, programa aportes periódicos y monitorea tu progreso en tiempo real
          </p>
        </div>

        <DSButton
          variant="primary"
          size="md"
          className="min-h-[44px]"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
        >
          Nueva Meta
        </DSButton>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Total Ahorrado
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 mt-1">
            $
            {totalSaved.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Meta Total Acumulada
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
            $
            {totalTarget.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            Progreso Global
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-700 mt-1">
            {globalPercent}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
            Metas Completadas
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-purple-700 mt-1">
            {completedCount} <span className="text-xs text-slate-400 font-normal">/ {goals.length}</span>
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <DSChip
          label="Todas las Metas"
          isActive={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          count={goals.length}
        />
        <DSChip
          label="En Progreso"
          isActive={filter === 'ACTIVE'}
          onClick={() => setFilter('ACTIVE')}
          count={activeCount}
        />
        <DSChip
          label="Completadas"
          isActive={filter === 'COMPLETED'}
          onClick={() => setFilter('COMPLETED')}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          count={completedCount}
        />
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs animate-pulse space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-200" />
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 my-4">
          <PiggyBank className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No hay metas de ahorro aún</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Comienza fijando tu primer objetivo financiero (como un fondo para emergencias o vacaciones) y visualiza tu progreso con cada aporte.
          </p>
          <div className="mt-4">
            <DSButton
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
            >
              Crear Primera Meta
            </DSButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <SavingsCard
              key={goal.id}
              goal={goal}
              onContribute={(g) => {
                setDepositGoal(g);
                setIsDepositModalOpen(true);
              }}
              onEdit={(g) => {
                setEditingGoal(g);
                setIsGoalModalOpen(true);
              }}
              onDelete={(id) => setDeleteConfirmId(id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <SavingGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        initialGoal={editingGoal}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setDepositGoal(null);
        }}
        goal={depositGoal}
      />

      {/* Delete Confirmation Modal */}
      <DSModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="¿Eliminar meta de ahorro?"
        subtitle="Los aportes registrados en la meta se eliminarán de este objetivo."
        footer={
          <div className="flex gap-2 w-full">
            <DSButton
              variant="outline"
              size="md"
              className="flex-1 min-h-[48px]"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </DSButton>
            <DSButton
              variant="danger"
              size="md"
              className="flex-1 min-h-[48px]"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Eliminar Meta
            </DSButton>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar esta meta de ahorro? Esta acción no se puede deshacer.
        </p>
      </DSModal>
    </div>
  );
};
