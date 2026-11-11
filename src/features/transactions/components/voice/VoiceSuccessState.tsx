import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { formatCOP } from './voiceDesignTokens';
import { CreateTransactionPayload } from '../../types';

interface VoiceSuccessStateProps {
  payload?: CreateTransactionPayload;
  onAutoClose: () => void;
}

export const VoiceSuccessState: React.FC<VoiceSuccessStateProps> = ({
  payload,
  onAutoClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAutoClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onAutoClose]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-6 select-none">
      {/* Animated Checkmark Circle (FinanAPP Emerald) */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-md shadow-emerald-600/30 bg-emerald-600">
        <Check className="w-7 h-7 text-white stroke-[3]" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
        ¡Movimiento Registrado!
      </h3>

      {payload && (
        <div className="mt-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm shadow-2xs">
          <span className="font-extrabold text-slate-900 block font-mono">
            {formatCOP(payload.amount)}
          </span>
          <span className="text-slate-500 truncate block max-w-[240px]">
            {payload.description}
          </span>
        </div>
      )}

      <span className="text-[11px] text-slate-400 mt-3">
        Cerrando automáticamente…
      </span>
    </div>
  );
};
