import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Tag, AlertCircle } from 'lucide-react';
import { Budget, CreateBudgetPayload, BudgetPeriod } from '../types';
import { transactionService } from '../../transactions/services/transaction.service';
import { Category } from '../../transactions/types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBudgetPayload) => Promise<void>;
  initialBudget?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBudget,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to compute default dates based on selected period
  const computeDatesForPeriod = (p: BudgetPeriod) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (p === 'MONTHLY') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        start: `${year}-${pad(month + 1)}-01`,
        end: `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`,
      };
    } else if (p === 'YEARLY') {
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      };
    } else if (p === 'WEEKLY') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        start: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
        end: `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`,
      };
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      // Load categories
      transactionService
        .getCategories()
        .then((res) => {
          const expenseCats = (res.data || []).filter((c) => c.type === 'EXPENSE');
          setCategories(expenseCats);
          if (!initialBudget && expenseCats.length > 0) {
            setCategoryId(expenseCats[0].id);
          }
        })
        .catch((err) => console.error('Error loading categories for budget:', err));

      if (initialBudget) {
        setCategoryId(initialBudget.categoryId);
        setName(initialBudget.name || '');
        setLimitAmount(String(initialBudget.limitAmount));
        setPeriod(initialBudget.period || 'MONTHLY');
        setStartDate(initialBudget.startDate);
        setEndDate(initialBudget.endDate);
      } else {
        setName('');
        setLimitAmount('');
        setPeriod('MONTHLY');
        const defaultDates = computeDatesForPeriod('MONTHLY');
        if (defaultDates) {
          setStartDate(defaultDates.start);
          setEndDate(defaultDates.end);
        }
      }
    }
  }, [isOpen, initialBudget]);

  const handlePeriodChange = (newPeriod: BudgetPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'CUSTOM') {
      const dates = computeDatesForPeriod(newPeriod);
      if (dates) {
        setStartDate(dates.start);
        setEndDate(dates.end);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Por favor ingresa un monto límite válido mayor que 0.');
      return;
    }

    if (!categoryId) {
      setError('Por favor selecciona una categoría de gasto.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Las fechas de inicio y fin son obligatorias.');
      return;
    }

    if (startDate > endDate) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        categoryId,
        name: name.trim() || undefined,
        limitAmount: Math.round(parsedLimit * 100) / 100,
        period,
        startDate,
        endDate,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h3>
              <p className="text-xs text-emerald-100">
                Establece un límite de gasto por categoría
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Categoría de Gasto *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              required
            >
              <option value="" disabled>
                Selecciona una categoría...
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Limit Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              Monto Límite ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ej. 500.00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Period selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Período *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM'] as BudgetPeriod[]).map((p) => {
                const labels: Record<BudgetPeriod, string> = {
                  MONTHLY: 'Mensual',
                  WEEKLY: 'Semanal',
                  YEARLY: 'Anual',
                  CUSTOM: 'Personalizado',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodChange(p)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      period === p
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Fecha Desde *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriod('CUSTOM');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Fecha Hasta *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriod('CUSTOM');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Optional Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Etiqueta o Nombre (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Presupuesto Vacaciones, Supermercado..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Guardando...'
                : initialBudget
                ? 'Actualizar Presupuesto'
                : 'Guardar Presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
