import React, { useState } from 'react';
import { Mic, ArrowRight, Keyboard } from 'lucide-react';

interface VoiceIdleStateProps {
  onStartListening: () => void;
  onSubmitManualText: (text: string) => void;
  isBrave?: boolean;
}

export const VoiceIdleState: React.FC<VoiceIdleStateProps> = ({
  onStartListening,
  onSubmitManualText,
  isBrave = false,
}) => {
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      onSubmitManualText(manualText.trim());
    }
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-2 select-none">
      {/* Title */}
      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
        ¿Qué quieres registrar?
      </h2>
      <p className="text-xs text-slate-500 mt-0.5 max-w-[280px]">
        Presiona el micrófono y describe tu gasto, ingreso o transferencia.
      </p>

      {/* Main Emerald Microphone Button with Pulsing Glow */}
      <div className="my-4 relative flex items-center justify-center">
        {/* Soft breathing ring background */}
        <div className="absolute w-22 h-22 rounded-full bg-emerald-100/80 animate-pulse pointer-events-none" />

        <button
          type="button"
          onClick={onStartListening}
          aria-label="Iniciar grabación de voz"
          className="relative w-18 h-18 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-95 transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-emerald-500/25 min-h-[48px] min-w-[48px] bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Mic className="w-8 h-8 text-white transition-transform duration-200 group-hover:scale-110 stroke-[2.2]" />
        </button>
      </div>

      <span className="text-xs font-semibold text-slate-400 mb-3">
        Toca para hablar
      </span>

      {/* Alternative: Escribir a mano (Toggleable & Compact) */}
      <div className="w-full pt-2 border-t border-slate-100">
        {!showManualInput ? (
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>O escribe tu movimiento a mano</span>
          </button>
        ) : (
          <form onSubmit={handleSubmitText} className="mt-1 text-left w-full">
            <div className="relative flex items-center">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Ej: Gasté 15000 en el almuerzo..."
                autoFocus
                className="w-full px-3.5 py-2 pr-10 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                disabled={!manualText.trim()}
                aria-label="Procesar texto escrito"
                className="absolute right-1.5 p-1.5 rounded-lg bg-emerald-600 disabled:opacity-40 text-white cursor-pointer hover:bg-emerald-700 transition-all shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {isBrave && (
        <p className="text-[10px] text-slate-400 mt-2">
          Estás en Brave: Si la API de voz es bloqueada, puedes escribir el texto directamente.
        </p>
      )}
    </div>
  );
};
