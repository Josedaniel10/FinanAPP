import { useMemo } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import {
  CURRENCIES,
  POPULAR_CURRENCIES,
  getCurrencyInfo,
  formatMoney,
  CurrencyInfo,
} from '../constants/currencies';

export function useCurrency() {
  const { user } = useAuth();

  const preferredCurrency = useMemo(() => {
    return (user?.preferredCurrency || 'USD').toUpperCase();
  }, [user?.preferredCurrency]);

  const currencyInfo: CurrencyInfo = useMemo(() => {
    return getCurrencyInfo(preferredCurrency);
  }, [preferredCurrency]);

  const format = useMemo(() => {
    return (
      amount: number,
      currencyOverride?: string,
      options?: { showCode?: boolean; showSign?: boolean }
    ) => {
      const targetCurrency = currencyOverride || preferredCurrency;
      return formatMoney(amount, targetCurrency, options);
    };
  }, [preferredCurrency]);

  return {
    preferredCurrency,
    currencyInfo,
    currencySymbol: currencyInfo.symbol,
    currencyFlag: currencyInfo.flag,
    currencyName: currencyInfo.name,
    allCurrencies: POPULAR_CURRENCIES,
    currenciesMap: CURRENCIES,
    format,
  };
}
