/**
 * FinanAPP Design System - Design Tokens
 * Centraliza la identidad visual, paleta semántica, tipografía y radios.
 * Fácilmente modificable para cambiar la apariencia de toda la plataforma en un solo lugar.
 */

export const dsTokens = {
  colors: {
    brand: {
      primary: '#059669', // Emerald 600
      primaryHover: '#047857', // Emerald 700
      primaryLight: '#D1FAE5', // Emerald 100
      primaryFocusRing: 'rgba(5, 150, 105, 0.25)',
    },
    neutral: {
      canvas: '#F8FAFC', // Slate 50
      surface: '#FFFFFF',
      surfaceMuted: '#F1F5F9', // Slate 100
      border: '#E2E8F0', // Slate 200
      borderHover: '#CBD5E1', // Slate 300
      textPrimary: '#0F172A', // Slate 900
      textSecondary: '#475569', // Slate 600
      textMuted: '#94A3B8', // Slate 400
    },
    semantic: {
      success: '#10B981', // Income / completed
      successSurface: '#ECFDF5',
      warning: '#F59E0B', // Near budget limit
      warningSurface: '#FFFBEB',
      danger: '#EF4444', // Expense / budget exceeded / error
      dangerSurface: '#FEF2F2',
      info: '#3B82F6', // Neutral info
      infoSurface: '#EFF6FF',
    },
  },
  radius: {
    sm: 'rounded-lg', // 8px
    md: 'rounded-xl', // 12px
    lg: 'rounded-2xl', // 16px
    full: 'rounded-full',
  },
  typography: {
    fontDisplay: 'font-sans font-bold tracking-tight',
    fontBody: 'font-sans text-sm text-slate-700 leading-relaxed',
    fontNumeric: 'font-mono tabular-nums',
  },
  transitions: {
    default: 'transition-all duration-150 ease-out',
  },
} as const;

export type DSTokens = typeof dsTokens;
