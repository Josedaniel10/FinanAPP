import React, { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';
import { dsTokens } from '../tokens';

export interface DSOption {
  value: string;
  label: string;
}

export interface DSSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: DSOption[];
  leftIcon?: ReactNode;
  isRequired?: boolean;
}

export const DSSelect = forwardRef<HTMLSelectElement, DSSelectProps>(
  (
    {
      label,
      error,
      options,
      children,
      leftIcon,
      isRequired,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseSelectStyles =
      'w-full bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ' +
      dsTokens.radius.md +
      ' ' +
      dsTokens.transitions.default;

    const stateStyles = error
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30'
      : 'border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20';

    const paddingStyles = `${leftIcon ? 'pl-10' : 'pl-3.5'} pr-8 py-2.5`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label}
            {isRequired && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`${baseSelectStyles} ${stateStyles} ${paddingStyles} ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
        </div>
        {error && (
          <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
            <span>•</span> {error}
          </p>
        )}
      </div>
    );
  }
);

DSSelect.displayName = 'DSSelect';
