/**
 * Design Tokens for Voice AI Transaction Modal
 * Matching FinanAPP page light theme: Emerald #059669 / Slate-50 / Pure White cards
 */

export const voiceTokens = {
  colors: {
    primary: '#059669', // Emerald 600 (FinanAPP brand)
    primaryHover: '#047857', // Emerald 700
    primaryLight: '#D1FAE5', // Emerald 100
    primaryGlow: 'rgba(5, 150, 105, 0.20)',
    income: '#059669', // Emerald
    incomeBg: '#ECFDF5', // Emerald 50
    incomeBorder: '#A7F3D0', // Emerald 200
    expense: '#E11D48', // Rose 600
    expenseBg: '#FFF1F2', // Rose 50
    expenseBorder: '#FECDD3', // Rose 200
    transfer: '#0D9488', // Teal 600
    transferBg: '#F0FDFA', // Teal 50
    transferBorder: '#99F6E4', // Teal 200
    neutralDark: '#0F172A', // Slate 900
    neutralGray: '#64748B', // Slate 500
    neutralLight: '#F8FAFC', // Slate 50
    surface: '#FFFFFF', // Pure White
    border: '#E2E8F0', // Slate 200
  },
  radii: {
    sheetTop: '24px',
    card: '16px',
    button: '12px',
    pill: '9999px',
  },
  shadows: {
    sheet: '0 -10px 40px rgba(0, 0, 0, 0.08)',
    buttonPrimary: '0 4px 14px rgba(5, 150, 105, 0.25)',
    card: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Format currency in Colombian Pesos (COP) with thousands separator
 * Example: 15000 -> "$ 15.000"
 * Example: 1500000 -> "$ 1.500.000"
 */
export function formatCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount).replace('COP', '').trim();
}

/**
 * Mobile subtle haptic feedback
 */
export function triggerHaptic(type: 'start' | 'confirm' | 'tap' = 'tap') {
  if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
    try {
      if (type === 'start') {
        window.navigator.vibrate([15]);
      } else if (type === 'confirm') {
        window.navigator.vibrate([20, 40, 20]);
      } else {
        window.navigator.vibrate([10]);
      }
    } catch {
      // Haptics not allowed or supported on this device
    }
  }
}
