import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  PieChart,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Budget, BudgetSummary, CreateBudgetPayload } from '../types';
import { budgetService } from '../services/budget.service';
import { BudgetCard } from './BudgetCard';
import { BudgetModal } from './BudgetModal';
import { BudgetDetailModal } from './BudgetDetailModal';
import { useCurrency } from '../../../shared/hooks/useCurrency';

export const BudgetsView: React.FC = () => {
  const { format, preferredCurrency } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'WARNING' | 'EXCEEDED' | 'NORMAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, summaryRes] = await Promise.all([
        budgetService.getBudgets(),
        budgetService.getSummary(),
      ]);
      setBudgets(budgetsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      console.error('Error loading budgets data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (payload: CreateBudgetPayload) => {
    if (editingBudget) {
      await budgetService.updateBudget(editingBudget.id, payload);
    } else {
      await budgetService.createBudget(payload);
    }
    await loadData();
  };

  const handleDeleteBudget = async (id: string) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      await budgetService.deleteBudget(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('No se pudo eliminar el presupuesto.');
    }
  };

  // Filtered budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      // Tab filter
      if (filterTab === 'EXCEEDED' && b.alertStatus !== 'EXCEEDED') return false;
      if (filterTab === 'WARNING' && b.alertStatus !== 'WARNING' && b.alertStatus !== 'EXCEEDED') return false;
      if (filterTab === 'NORMAL' && b.alertStatus !== 'NORMAL') return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const catName = b.category?.name?.toLowerCase() || '';
        const name = b.name?.toLowerCase() || '';
        return catName.includes(term) || name.includes(term);
      }

      return true;
    });
  }, [budgets, filterTab, searchTerm]);

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Presupuestos Financieros
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Establece techos de gasto por categoría y mantén tus egresos bajo control inteligente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Actualizar datos"
            aria-label="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Alert Banner if there are exceeded or warning budgets */}
      {summary && (summary.exceededCount > 0 || summary.warningCount > 0) && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            summary.exceededCount > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {summary.exceededCount > 0 ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold">
                {summary.exceededCount > 0
                  ? `¡Alerta! Tienes ${summary.exceededCount} presupuesto(s) con límite superado`
                  : `Atención: Tienes ${summary.warningCount} presupuesto(s) cerca de alcanzar el límite`}
              </h4>
              <p className="text-[11px] opacity-90 mt-0.5">
                Revisa los gastos asociados y evalúa reajustar tus egresos para no comprometer tu balance mensual.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterTab(summary.exceededCount > 0 ? 'EXCEEDED' : 'WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              summary.exceededCount > 0
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            Ver presupuestos en alerta
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Presupuesto Total
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2">
              {format(summary.totalLimit)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              En {summary.budgetsCount} categorías planificadas
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Gasto Acumulado
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-rose-600 mt-2">
              {format(summary.totalSpent)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.overallPercentage}% del total presupuestado
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Saldo Disponible
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-emerald-700 mt-2">
              {format(summary.totalRemaining)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Margen disponible total
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Estado General
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {summary.normalCount} OK
              </span>
              {summary.warningCount > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {summary.warningCount} Alerta
                </span>
              )}
              {summary.exceededCount > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  {summary.exceededCount} Superados
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Control presupuestario activo
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Todos ({budgets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'WARNING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>En Alerta ({budgets.filter((b) => b.alertStatus === 'WARNING' || b.alertStatus === 'EXCEEDED').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('EXCEEDED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'EXCEEDED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Superados ({budgets.filter((b) => b.alertStatus === 'EXCEEDED').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('NORMAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saludables ({budgets.filter((b) => b.alertStatus === 'NORMAL').length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Cargando tus presupuestos...
        </div>
      ) : filteredBudgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBudgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteBudget}
              onViewDetails={(budget) => setDetailBudget(budget)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-300 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {budgets.length === 0
              ? 'No tienes presupuestos creados aún'
              : 'Ningún presupuesto coincide con los filtros'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {budgets.length === 0
              ? 'Crea un presupuesto para tus categorías frecuentes (ej. Comida, Alquiler, Entretenimiento) para monitorear automáticamente tus gastos.'
              : 'Prueba cambiar los filtros seleccionados o el término de búsqueda.'}
          </p>
          {budgets.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Establecer Primer Presupuesto</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveBudget}
        initialBudget={editingBudget}
      />

      <BudgetDetailModal
        isOpen={Boolean(detailBudget)}
        onClose={() => setDetailBudget(null)}
        budget={detailBudget}
      />
    </div>
  );
};
