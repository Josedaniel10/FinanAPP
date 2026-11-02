import { Category } from '../modules/categories/category.model';

export const DEFAULT_SYSTEM_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Gastos
  {
    userId: null,
    name: 'Alimentación y Bebidas',
    type: 'EXPENSE',
    icon: 'Utensils',
    color: '#EF4444',
  },
  {
    userId: null,
    name: 'Transporte y Combustible',
    type: 'EXPENSE',
    icon: 'Car',
    color: '#F97316',
  },
  {
    userId: null,
    name: 'Vivienda y Servicios',
    type: 'EXPENSE',
    icon: 'Home',
    color: '#F59E0B',
  },
  {
    userId: null,
    name: 'Salud y Farmacia',
    type: 'EXPENSE',
    icon: 'HeartPulse',
    color: '#10B981',
  },
  {
    userId: null,
    name: 'Educación y Cursos',
    type: 'EXPENSE',
    icon: 'GraduationCap',
    color: '#3B82F6',
  },
  {
    userId: null,
    name: 'Entretenimiento y Ocio',
    type: 'EXPENSE',
    icon: 'Gamepad2',
    color: '#8B5CF6',
  },
  {
    userId: null,
    name: 'Ropa y Calzado',
    type: 'EXPENSE',
    icon: 'Shirt',
    color: '#EC4899',
  },
  {
    userId: null,
    name: 'Otros Gastos',
    type: 'EXPENSE',
    icon: 'CircleDollarSign',
    color: '#6B7280',
  },

  // Ingresos
  {
    userId: null,
    name: 'Salario / Nómina',
    type: 'INCOME',
    icon: 'Banknote',
    color: '#10B981',
  },
  {
    userId: null,
    name: 'Ventas y Negocios',
    type: 'INCOME',
    icon: 'Briefcase',
    color: '#059669',
  },
  {
    userId: null,
    name: 'Inversiones y Rendimientos',
    type: 'INCOME',
    icon: 'TrendingUp',
    color: '#2563EB',
  },
  {
    userId: null,
    name: 'Regalos / Bonos',
    type: 'INCOME',
    icon: 'Gift',
    color: '#7C3AED',
  },
  {
    userId: null,
    name: 'Otros Ingresos',
    type: 'INCOME',
    icon: 'Coins',
    color: '#0D9488',
  },
];
