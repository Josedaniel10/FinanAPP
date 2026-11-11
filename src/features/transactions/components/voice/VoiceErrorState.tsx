import React, { useState } from 'react';
import { AlertCircle, RotateCcw, Keyboard, ArrowRight } from 'lucide-react';

interface VoiceErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  onSubmitManualText: (text: string) => void;
}

export const VoiceErrorState: React.FC<VoiceErrorStateProps> = ({
  errorMessage,
  onRetry,
  onSubmitManualText,
}) => {
  const [manualText, setManualText] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      onSubmitManualText(manualText.trim());
    }
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-4 select-none">
      {/* Friendly Error Icon */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
        No pudimos procesar tu audio
      </h3>

      <p className="text-xs text-slate-500 max-w-[280px] mb-4">
        {errorMessage || 'Verifica los permisos de tu micrófono o escribe la frase a mano.'}
      </p>

      {/* Action buttons */}
      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={onRetry}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Intentar de nuevo</span>
        </button>

        {!showInput ? (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="w-full min-h-[44px] py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Keyboard className="w-4 h-4" />
            <span>Escribir movimiento a mano</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-1.5 text-left w-full">
            <div className="relative flex items-center">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Ej: Gasté 15 mil en almuerzo..."
                autoFocus
                className="w-full min-h-[44px] px-3.5 py-2 pr-12 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualText.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 cursor-pointer transition-colors shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
