import React from 'react';
import {
  getCurrencyInfo,
  getCurrencyGuidance,
  formatMoney,
} from '../constants/currencies';
import { Sparkles, Info, Check } from 'lucide-react';

export interface CurrencyAmountInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  autoFocus?: boolean;
  id?: string;
  helperText?: string;
  className?: string;
}

export const CurrencyAmountInput: React.FC<CurrencyAmountInputProps> = ({
  label = 'Monto',
  value,
  onChange,
  currency = 'USD',
  placeholder,
  required = true,
  min = 0,
  autoFocus = false,
  id,
  helperText,
  className = '',
}) => {
  const currencyInfo = getCurrencyInfo(currency);
  const guidance = getCurrencyGuidance(currency);

  const parsed = parseFloat(value);
  const hasValue = value.trim() !== '' && !isNaN(parsed);
  const isPositive = hasValue && parsed > 0;

  // Check if user typed decimal on a non-decimal currency
  const hasInvalidDecimals =
    currencyInfo.decimals === 0 && value.includes('.') && parseFloat(value.split('.')[1] || '0') > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Prevent negative numbers if min >= 0
    if (min >= 0 && val.startsWith('-')) {
      val = val.replace('-', '');
    }
    onChange(val);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      {/* Input container with symbol and currency badge */}
      <div className="relative rounded-2xl shadow-2xs transition-all focus-within:ring-2 focus-within:ring-emerald-500/20">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700 font-mono font-bold text-base select-none">
          {currencyInfo.symbol}
        </div>

        <input
          id={id}
          type="number"
          step={guidance.step}
          min={min}
          required={required}
          autoFocus={autoFocus}
          value={value}
          onChange={handleChange}
          placeholder={placeholder || guidance.placeholder}
          className="w-full min-h-[48px] pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono text-lg font-bold tracking-tight focus:bg-white focus:outline-none focus:border-emerald-600 transition-all placeholder:text-slate-300"
        />

        {/* Currency code badge */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none select-none">
          <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 text-slate-700 font-bold text-[11px] font-mono tracking-wider">
            {currencyInfo.code}
          </span>
        </div>
      </div>

      {/* Interactive Guidance & Real-time formatting */}
      <div className="pt-0.5">
        {hasInvalidDecimals ? (
          <p className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              {currencyInfo.name} ({currencyInfo.code}) no utiliza centavos. Se registrará como{' '}
              <strong className="font-mono">{formatMoney(Math.round(parsed), currencyInfo.code)}</strong>.
            </span>
          </p>
        ) : isPositive ? (
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>Vista previa:</span>
              <strong className="font-mono font-bold text-slate-900">
                {formatMoney(parsed, currencyInfo.code)}
              </strong>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {currencyInfo.decimals === 0 ? 'Sin centavos' : '2 decimales'}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
            <span>{helperText || guidance.hint}</span>
            <span className="text-[10px] text-slate-300 font-mono">
              Ej: {guidance.typicalAmount}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};
