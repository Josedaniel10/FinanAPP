import React, { ReactNode } from 'react';
import { Plus } from 'lucide-react';

export interface DSFabProps {
  onClick: () => void;
  icon?: ReactNode;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export const DSFab: React.FC<DSFabProps> = ({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label,
  ariaLabel = 'Añadir nuevo registro',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed bottom-20 right-4 z-40 h-14 min-w-[56px] px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-700/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 select-none ${className}`}
    >
      <span className="shrink-0">{icon}</span>
      {label && <span className="text-sm font-semibold pr-1">{label}</span>}
    </button>
  );
};
