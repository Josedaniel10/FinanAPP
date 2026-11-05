import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  TrendingDown,
  TrendingUp,
  Edit2,
  Trash2,
  Lock,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Category, CategoryType, CreateCategoryPayload } from '../types';
import { categoryService } from '../services/category.service';
import { CategoryModal } from './CategoryModal';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'CUSTOM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    if (category.userId === null) {
      setFeedback({
        type: 'error',
        message: 'Las categorías predefinidas del sistema están protegidas y no pueden modificarse.',
      });
      return;
    }
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: CreateCategoryPayload) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, payload);
        setFeedback({
          type: 'success',
          message: `Categoría "${payload.name}" actualizada con éxito.`,
        });
      } else {
        await categoryService.createCategory(payload);
        setFeedback({
          type: 'success',
          message: `Categoría "${payload.name}" creada con éxito.`,
        });
      }
      await loadCategories();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.userId === null) {
      setFeedback({
        type: 'error',
        message: 'Las categorías predefinidas del sistema están protegidas y no pueden eliminarse.',
      });
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`
    );
    if (!confirmed) return;

    try {
      await categoryService.deleteCategory(category.id);
      setFeedback({
        type: 'success',
        message: `Categoría "${category.name}" eliminada correctamente.`,
      });
      await loadCategories();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'No se pudo eliminar la categoría.',
      });
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (activeFilter === 'EXPENSE' && c.type !== 'EXPENSE') return false;
      if (activeFilter === 'INCOME' && c.type !== 'INCOME') return false;
      if (activeFilter === 'CUSTOM' && c.userId === null) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(term);
      }

      return true;
    });
  }, [categories, activeFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = categories.length;
    const expenses = categories.filter((c) => c.type === 'EXPENSE').length;
    const incomes = categories.filter((c) => c.type === 'INCOME').length;
    const custom = categories.filter((c) => c.userId !== null).length;
    return { total, expenses, incomes, custom };
  }, [categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Categorías Financieras
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestiona y clasifica tus ingresos y gastos con categorías personalizadas y predefinidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCategories}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Actualizar lista"
            aria-label="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Categorías</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Disponibles para ti</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>De Gasto</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-rose-600 mt-2">{stats.expenses}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Egresos y compras</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>De Ingreso</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-2">{stats.incomes}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Salarios y dividendos</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Personalizadas</span>
            <Tag className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-xl font-extrabold text-teal-700 mt-2">{stats.custom}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Creadas por tu cuenta</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Todas ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gastos ({stats.expenses})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('INCOME')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ingresos ({stats.incomes})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('CUSTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'CUSTOM'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Tus Categorías ({stats.custom})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Cargando tus categorías...
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const isCustom = cat.userId !== null;
            const isExpense = cat.type === 'EXPENSE';

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: cat.color || '#059669' }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isExpense
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {isExpense ? 'Gasto' : 'Ingreso'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 truncate" title={cat.name}>
                    {cat.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    {isCustom ? (
                      <span className="inline-flex items-center gap-1 text-teal-600 font-medium">
                        <Tag className="w-3 h-3" />
                        Personalizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Lock className="w-3 h-3" />
                        Sistema
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  {isCustom ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar categoría"
                        aria-label="Editar categoría"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar categoría"
                        aria-label="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic px-1">
                      Predefinida
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-300 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No se encontraron categorías
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Prueba ajustando los filtros o crea una nueva categoría personalizada para tus movimientos.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Categoría</span>
          </button>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialCategory={editingCategory}
      />
    </div>
  );
};
