import React, { ReactNode } from 'react';
import { dsTokens } from '../tokens';

export interface DSChipProps {
  label: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  count?: number;
  className?: string;
}

export const DSChip: React.FC<DSChipProps> = ({
  label,
  isActive = false,
  onClick,
  icon,
  count,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] px-3.5 py-2 inline-flex items-center gap-2 text-xs font-semibold select-none cursor-pointer border ${dsTokens.radius.full} transition-all shrink-0 active:scale-95 ${
        isActive
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
