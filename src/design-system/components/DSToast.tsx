import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { dsTokens } from '../tokens';

export const DSToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 max-w-md mx-auto pointer-events-none">
      {toasts.map((toast) => {
        const iconConfig = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
        };

        const bgConfig = {
          success: 'bg-slate-900/95 text-white border-emerald-500/30',
          error: 'bg-slate-900/95 text-white border-rose-500/30',
          warning: 'bg-slate-900/95 text-white border-amber-500/30',
          info: 'bg-slate-900/95 text-white border-blue-500/30',
        };

        const type = toast.type || 'success';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 border shadow-xl backdrop-blur-md ${bgConfig[type]} ${dsTokens.radius.md} animate-in fade-in slide-in-from-bottom-3 duration-200`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {iconConfig[type]}
              <div className="text-xs font-medium truncate">
                {toast.title && <span className="font-semibold block">{toast.title}</span>}
                <span className="opacity-95">{toast.message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 -mr-2"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
