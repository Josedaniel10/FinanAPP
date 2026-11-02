import React, { HTMLAttributes, ReactNode } from 'react';
import { dsTokens } from '../tokens';

export interface DSCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

export const DSCard: React.FC<DSCardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  noPadding = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 shadow-xs ${dsTokens.radius.lg} overflow-hidden ${className}`}
      {...props}
    >
      {(title || action || subtitle) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-semibold text-slate-900 text-sm tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
