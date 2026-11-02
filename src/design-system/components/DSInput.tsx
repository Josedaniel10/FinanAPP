import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { dsTokens } from '../tokens';

export interface DSInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isRequired?: boolean;
}

export const DSInput = forwardRef<HTMLInputElement, DSInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isRequired,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseInputStyles =
      'w-full bg-slate-50 border text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ' +
      dsTokens.radius.md +
      ' ' +
      dsTokens.transitions.default;

    const stateStyles = error
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30'
      : 'border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20';

    const paddingStyles = `${leftIcon ? 'pl-10' : 'pl-3.5'} ${
      rightIcon ? 'pr-10' : 'pr-3.5'
    } py-2.5`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
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
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${baseInputStyles} ${stateStyles} ${paddingStyles} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
            <span>•</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

DSInput.displayName = 'DSInput';
