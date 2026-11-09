import React from 'react';
import {
  Category,
  Account,
  TransactionType,
  TransactionFilterParams,
} from '../types';
import {
  Search,
  Filter,
  Calendar,
  Tag,
  CreditCard,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface TransactionFiltersBarProps {
  filters: TransactionFilterParams;
  onChange: (newFilters: TransactionFilterParams) => void;
  categories: Category[];
  accounts: Account[];
  onReset: () => void;
}

export const TransactionFiltersBar: React.FC<TransactionFiltersBarProps> = ({
  filters,
  onChange,
  categories,
  accounts,
  onReset,
}) => {
  const isDateRangeInvalid = Boolean(
    filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
  );

  const activeFiltersCount = [
    Boolean(filters.type),
    Boolean(filters.categoryId),
    Boolean(filters.accountId),
    Boolean(filters.startDate),
    Boolean(filters.endDate),
    Boolean(filters.search),
  ].filter(Boolean).length;

  const handleTypeChange = (type?: TransactionType) => {
    onChange({ ...filters, type });
  };

  const handleApplyPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL') => {
    const now = new Date();
    if (preset === 'ALL') {
      onChange({
        ...filters,
        startDate: undefined,
        endDate: undefined,
      });
      return;
    }

    if (preset === 'THIS_MONTH') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      onChange({
        ...filters,
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
      });
      return;
    }

    if (preset === 'LAST_MONTH') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, prevMonthDate.getMonth() + 1, 0).getDate();
      onChange({
        ...filters,
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
      });
      return;
    }

    if (preset === 'THIS_YEAR') {
      const year = now.getFullYear();
      onChange({
        ...filters,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      });
    }
  };

  const [isMobileExpanded, setIsMobileExpanded] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Top row: Search input & Type pills & Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                search: e.target.value.trim() ? e.target.value : undefined,
              })
            }
            placeholder="Buscar por descripción o notas..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
          />
        </div>

        {/* Type pills: Todos / Gastos / Ingresos */}
        <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => handleTypeChange(undefined)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !filters.type
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('EXPENSE')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              filters.type === 'EXPENSE'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('INCOME')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              filters.type === 'INCOME'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ingresos</span>
          </button>
        </div>

        {/* Clear filters button if active */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title="Restablecer todos los filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Mobile Toggle Button for Advanced Slicers */}
      <div className="flex md:hidden items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors py-1 cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isMobileExpanded ? 'Ocultar filtros avanzados' : 'Filtros avanzados (categoría, cuenta, fechas)'}</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Advanced Filters Section */}
      <div className={`${isMobileExpanded ? 'block' : 'hidden'} md:block space-y-4 pt-2 border-t md:border-t-0 border-slate-100`}>
        {/* Dropdowns for Category, Account and Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Categoría */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Categoría</span>
          </label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                categoryId: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'})
              </option>
            ))}
          </select>
        </div>

        {/* Cuenta */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-slate-400" />
            <span>Cuenta</span>
          </label>
          <select
            value={filters.accountId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                accountId: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (${acc.balance.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Fecha Desde */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Fecha Desde</span>
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                startDate: e.target.value || undefined,
              })
            }
            className={`w-full px-3 py-1.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer ${
              isDateRangeInvalid ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
            }`}
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Fecha Hasta</span>
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                endDate: e.target.value || undefined,
              })
            }
            className={`w-full px-3 py-1.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer ${
              isDateRangeInvalid ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
            }`}
          />
        </div>
      </div>

      {/* Date presets shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Accesos rápidos:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('THIS_MONTH')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('LAST_MONTH')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Mes anterior
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('THIS_YEAR')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Este año
          </button>
          {(filters.startDate || filters.endDate) && (
            <button
              type="button"
              onClick={() => handleApplyPreset('ALL')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Cualquier fecha
            </button>
          )}
        </div>

        {isDateRangeInvalid && (
          <div className="flex items-center gap-1 text-red-600 text-[11px] font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>La fecha de inicio debe ser menor o igual a la de fin</span>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
