import React, { ReactNode } from 'react';
import { dsTokens } from '../tokens';

export interface DSBadgeProps {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const DSBadge: React.FC<DSBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700 font-medium',
    warning: 'bg-amber-50 text-amber-700 font-medium',
    danger: 'bg-rose-50 text-rose-700 font-medium',
    info: 'bg-blue-50 text-blue-700 font-medium',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 ' + dsTokens.radius.sm,
    md: 'text-xs px-2.5 py-1 ' + dsTokens.radius.sm,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
