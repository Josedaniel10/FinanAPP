import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Check,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  HeartPulse,
  GraduationCap,
  Briefcase,
  DollarSign,
  PiggyBank,
  Sparkles,
  Plane,
  Music,
  Film,
  Gamepad2,
  Gift,
  Fuel,
  Coffee,
  LucideIcon,
} from 'lucide-react';
import { Category, CategoryType, CreateCategoryPayload } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryPayload) => Promise<Category | void>;
  initialCategory?: Category | null;
  defaultType?: CategoryType;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#0D9488', // Teal
  '#0284C7', // Sky
  '#2563EB', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#9333EA', // Purple
  '#C026D3', // Fuchsia
  '#E11D48', // Rose
  '#DC2626', // Red
  '#EA580C', // Orange
  '#D97706', // Amber
  '#65A30D', // Lime
  '#475569', // Slate
];

const AVAILABLE_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Tag', label: 'Etiqueta', icon: Tag },
  { name: 'Utensils', label: 'Comida', icon: Utensils },
  { name: 'ShoppingCart', label: 'Compras', icon: ShoppingCart },
  { name: 'Home', label: 'Vivienda', icon: Home },
  { name: 'Car', label: 'Auto', icon: Car },
  { name: 'Fuel', label: 'Combustible', icon: Fuel },
  { name: 'Coffee', label: 'Café', icon: Coffee },
  { name: 'HeartPulse', label: 'Salud', icon: HeartPulse },
  { name: 'GraduationCap', label: 'Educación', icon: GraduationCap },
  { name: 'Briefcase', label: 'Trabajo', icon: Briefcase },
  { name: 'DollarSign', label: 'Dinero', icon: DollarSign },
  { name: 'PiggyBank', label: 'Ahorro', icon: PiggyBank },
  { name: 'Gift', label: 'Regalo', icon: Gift },
  { name: 'Plane', label: 'Viajes', icon: Plane },
  { name: 'Music', label: 'Música', icon: Music },
  { name: 'Film', label: 'Cine', icon: Film },
  { name: 'Gamepad2', label: 'Juegos', icon: Gamepad2 },
  { name: 'Sparkles', label: 'Varios', icon: Sparkles },
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCategory,
  defaultType = 'EXPENSE',
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType);
  const [color, setColor] = useState('#059669');
  const [icon, setIcon] = useState('Tag');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialCategory) {
        setName(initialCategory.name);
        setType(initialCategory.type);
        setColor(initialCategory.color || '#059669');
        setIcon(initialCategory.icon || 'Tag');
      } else {
        setName('');
        setType(defaultType);
        setColor(defaultType === 'INCOME' ? '#059669' : '#DC2626');
        setIcon('Tag');
      }
    }
  }, [isOpen, initialCategory, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('El nombre de la categoría debe tener al menos 2 caracteres.');
      return;
    }

    if (trimmed.length > 50) {
      setError('El nombre de la categoría no puede exceder los 50 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: trimmed,
        type,
        color,
        icon,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const SelectedIconComponent =
    AVAILABLE_ICONS.find((i) => i.name === icon)?.icon || Tag;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner"
              style={{ backgroundColor: color }}
            >
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <p className="text-xs text-emerald-100">
                {type === 'INCOME' ? 'Categoría de Ingreso' : 'Categoría de Gasto'}
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Gasto vs Ingreso) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Categoría *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  if (!initialCategory && color === '#059669') setColor('#DC2626');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Gasto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  if (!initialCategory && color === '#DC2626') setColor('#059669');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Ingreso</span>
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Nombre de la Categoría *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Gimnasio, Freelance, Mascotas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Color Picker Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center border-2 border-white shadow-xs hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Icono Representativo
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white shadow-xs ring-2 ring-emerald-500 text-emerald-700 font-bold'
                        : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                    title={item.label}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
                : initialCategory
                ? 'Actualizar'
                : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
