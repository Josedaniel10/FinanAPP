import React from 'react';
import { Square, X } from 'lucide-react';

interface VoiceListeningStateProps {
  audioLevel: number;
  transcript: string;
  recordingSeconds: number;
  onStop: () => void;
  onCancel: () => void;
}

export const VoiceListeningState: React.FC<VoiceListeningStateProps> = ({
  audioLevel,
  transcript,
  recordingSeconds,
  onStop,
  onCancel,
}) => {
  // Generate 7 reactive audio waveform bars based on audioLevel
  const barHeights = [
    Math.max(10, Math.min(36, 10 + audioLevel * 40)),
    Math.max(14, Math.min(48, 14 + audioLevel * 55)),
    Math.max(18, Math.min(58, 18 + audioLevel * 70)),
    Math.max(24, Math.min(68, 24 + audioLevel * 85)),
    Math.max(18, Math.min(58, 18 + audioLevel * 70)),
    Math.max(14, Math.min(48, 14 + audioLevel * 55)),
    Math.max(10, Math.min(36, 10 + audioLevel * 40)),
  ];

  return (
    <div className="flex flex-col items-center text-center px-4 py-2 select-none">
      {/* Listening Indicator */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
          Escuchando {recordingSeconds > 0 ? `(${recordingSeconds}s)` : '...'}
        </span>
      </div>

      <h2 className="text-sm font-bold text-slate-900">
        Te estamos escuchando
      </h2>

      {/* Pulsing Mic with Animated Waves */}
      <div className="relative my-3.5 flex items-center justify-center">
        {/* Outer expanding pulse ring */}
        <div
          className="absolute rounded-full transition-all duration-150 pointer-events-none bg-emerald-100"
          style={{
            width: `${76 + audioLevel * 45}px`,
            height: `${76 + audioLevel * 45}px`,
            opacity: 0.4 + audioLevel * 0.4,
          }}
        />

        {/* Second ring */}
        <div
          className="absolute rounded-full transition-all duration-100 pointer-events-none bg-emerald-200/60"
          style={{
            width: `${66 + audioLevel * 20}px`,
            height: `${66 + audioLevel * 20}px`,
          }}
        />

        {/* Central stop button */}
        <button
          type="button"
          onClick={onStop}
          aria-label="Detener y procesar audio"
          className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-95 transition-transform z-10 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Square className="w-5 h-5 text-white fill-white" />
        </button>
      </div>

      {/* Reactive Audio Waveform Bars */}
      <div className="flex items-center justify-center gap-1.5 h-9 mb-2.5">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full transition-all duration-75 bg-emerald-500"
            style={{
              height: `${h}px`,
              opacity: 0.4 + (audioLevel > 0.05 ? 0.6 : 0.2),
            }}
          />
        ))}
      </div>

      {/* Live Transcript in Big Clear Font (No Scroll, overflow hidden) */}
      <div className="w-full h-13 overflow-hidden px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-left mb-3 flex items-center">
        {transcript ? (
          <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            "{transcript}"
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Esperando tu voz... Di: "Gasté 15000 en transporte"
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>

        <button
          type="button"
          onClick={onStop}
          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-700"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>Finalizar</span>
        </button>
      </div>
    </div>
  );
};
