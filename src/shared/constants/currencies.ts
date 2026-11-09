export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Estadounidense',
    flag: '🇺🇸',
    locale: 'en-US',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    locale: 'es-ES',
    decimals: 2,
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso Colombiano',
    flag: '🇨🇴',
    locale: 'es-CO',
    decimals: 2,
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso Mexicano',
    flag: '🇲🇽',
    locale: 'es-MX',
    decimals: 2,
  },
  ARS: {
    code: 'ARS',
    symbol: '$',
    name: 'Peso Argentino',
    flag: '🇦🇷',
    locale: 'es-AR',
    decimals: 2,
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    name: 'Peso Chileno',
    flag: '🇨🇱',
    locale: 'es-CL',
    decimals: 0,
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Sol Peruano',
    flag: '🇵🇪',
    locale: 'es-PE',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'Libra Esterlina',
    flag: '🇬🇧',
    locale: 'en-GB',
    decimals: 2,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileño',
    flag: '🇧🇷',
    locale: 'pt-BR',
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: '$',
    name: 'Dólar Canadiense',
    flag: '🇨🇦',
    locale: 'en-CA',
    decimals: 2,
  },
  UYU: {
    code: 'UYU',
    symbol: '$U',
    name: 'Peso Uruguayo',
    flag: '🇺🇾',
    locale: 'es-UY',
    decimals: 2,
  },
  VES: {
    code: 'VES',
    symbol: 'Bs.',
    name: 'Bolívar Venezolano',
    flag: '🇻🇪',
    locale: 'es-VE',
    decimals: 2,
  },
};

export const POPULAR_CURRENCIES: CurrencyInfo[] = Object.values(CURRENCIES);

export function getCurrencyInfo(code?: string): CurrencyInfo {
  const normalized = (code || 'USD').toUpperCase().trim();
  return (
    CURRENCIES[normalized] || {
      code: normalized,
      symbol: '$',
      name: normalized,
      flag: '🌐',
      locale: 'es-ES',
      decimals: 2,
    }
  );
}

export function formatMoney(
  amount: number,
  currencyCode?: string,
  options?: {
    showCode?: boolean;
    showSign?: boolean;
  }
): string {
  const curr = getCurrencyInfo(currencyCode);
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const isNegative = safeAmount < 0;
  const absoluteAmount = Math.abs(safeAmount);

  const formattedNum = absoluteAmount.toLocaleString(curr.locale, {
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals,
  });

  const sign = isNegative ? '-' : options?.showSign && safeAmount > 0 ? '+' : '';
  const codeSuffix = options?.showCode ? ` ${curr.code}` : '';

  return `${sign}${curr.symbol} ${formattedNum}${codeSuffix}`;
}

export interface CurrencyGuidance {
  decimals: number;
  step: string;
  placeholder: string;
  hint: string;
  typicalAmount: string;
}

export function getCurrencyGuidance(currencyCode?: string): CurrencyGuidance {
  const info = getCurrencyInfo(currencyCode);
  if (info.decimals === 0) {
    return {
      decimals: 0,
      step: '1',
      placeholder: '50000',
      hint: `${info.code} no utiliza centavos. Ingresa valores enteros.`,
      typicalAmount: formatMoney(50000, info.code),
    };
  }

  return {
    decimals: info.decimals,
    step: '0.01',
    placeholder: '150.00',
    hint: `Usa punto o coma para decimales (hasta ${info.decimals} centavos).`,
    typicalAmount: formatMoney(150, info.code),
  };
}

