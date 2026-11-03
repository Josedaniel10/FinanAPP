import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { dsTokens } from '../tokens';

export interface DSBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: '50' | '65' | '75' | '85';
}

export const DSBottomSheet: React.FC<DSBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '75',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const heightClasses = {
    '50': 'max-h-[50vh]',
    '65': 'max-h-[65vh]',
    '75': 'max-h-[75vh]',
    '85': 'max-h-[85vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container: Bottom sheet on mobile, centered modal on desktop */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-lg mx-auto bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-slate-200/80 z-10 flex flex-col ${heightClasses[maxHeight]} md:max-h-[85vh] animate-in slide-in-from-bottom md:zoom-in-95 duration-200 ease-out`}
      >
        {/* Visual Drag Handle: Mobile Only */}
        <div
          className="pt-3 pb-1.5 flex md:hidden justify-center cursor-grab active:cursor-grabbing select-none"
          onClick={onClose}
          aria-label="Cerrar deslizando"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Sheet Header */}
        {(title || subtitle) && (
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="min-w-0 pr-3">
              {title && (
                <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Sheet Content */}
        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>

        {/* Action Footer */}
        {footer && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
