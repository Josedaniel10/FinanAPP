import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { dsTokens } from '../tokens';

export interface DSAlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: ReactNode;
  message: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const DSAlert: React.FC<DSAlertProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
    },
  };

  const { bg, icon } = config[type];

  return (
    <div
      role="alert"
      className={`border p-4 ${dsTokens.radius.md} flex items-start gap-3 ${bg} ${className}`}
    >
      {icon}
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5 leading-snug">{title}</p>}
        <div className="text-xs leading-relaxed opacity-90">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
