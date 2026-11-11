import React from 'react';
import { Sparkles } from 'lucide-react';

export const VoiceProcessingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-8 select-none">
      {/* Sutil AI processing icon */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center animate-spin border-3 border-emerald-100 border-t-emerald-600">
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
        Entendiendo tu movimiento…
      </h3>
      <p className="text-xs text-slate-500 max-w-[260px]">
        Extrayendo monto, categoría, comercio y fecha automáticamente.
      </p>
    </div>
  );
};
