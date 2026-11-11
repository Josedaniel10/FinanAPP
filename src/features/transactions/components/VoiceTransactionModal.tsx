import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  aiVoiceService,
  VoiceTransactionResponse,
} from '../services/ai-voice.service';
import { Category, Account, CreateTransactionPayload } from '../types';
import { useCurrency } from '../../../shared/hooks/useCurrency';
import { showToast } from '../../../stores/toastStore';
import { triggerHaptic } from './voice/voiceDesignTokens';

// State Components
import { VoiceIdleState } from './voice/VoiceIdleState';
import { VoiceListeningState } from './voice/VoiceListeningState';
import { VoiceProcessingState } from './voice/VoiceProcessingState';
import { VoiceConfirmationState } from './voice/VoiceConfirmationState';
import { VoiceMissingDataState } from './voice/VoiceMissingDataState';
import { VoiceSuccessState } from './voice/VoiceSuccessState';
import { VoiceErrorState } from './voice/VoiceErrorState';

export type VoiceModalState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'confirmation'
  | 'missing_data'
  | 'success'
  | 'error';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  onSaveTransaction: (payload: CreateTransactionPayload) => Promise<void>;
  onOpenFullForm?: (prefilledPayload: Partial<CreateTransactionPayload>) => void;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  onSaveTransaction,
  onOpenFullForm,
}) => {
  const { preferredCurrency } = useCurrency();
  const {
    isListening,
    transcript,
    fullTranscript,
    startListening,
    stopListening,
    resetTranscript,
    audioLevel,
    recordingSeconds,
  } = useSpeechRecognition({ lang: 'es-CO' });

  // Current visual state
  const [modalState, setModalState] = useState<VoiceModalState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<VoiceTransactionResponse | null>(null);
  const [lastSavedPayload, setLastSavedPayload] = useState<CreateTransactionPayload | undefined>();
  const [isBrave, setIsBrave] = useState(false);

  // Check if browser is Brave
  useEffect(() => {
    const checkBrave = async () => {
      try {
        if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
          const isB = await (navigator as any).brave.isBrave();
          setIsBrave(Boolean(isB));
        }
      } catch {}
    };
    checkBrave();
  }, []);

  // Reset modal on open/close
  useEffect(() => {
    if (isOpen) {
      setModalState('idle');
      setErrorMessage('');
      setCurrentResult(null);
      setLastSavedPayload(undefined);
      resetTranscript();
    } else {
      if (isListening) {
        stopListening();
      }
    }
  }, [isOpen]);

  // Synchronize speech recognition status with modalState
  useEffect(() => {
    if (isListening && modalState === 'idle') {
      setModalState('listening');
    }
  }, [isListening, modalState]);

  // Process text or audio with backend AI + client fallback
  const processVoiceInput = useCallback(
    async (args: { text?: string; audioData?: string; mimeType?: string }) => {
      const textToProcess = (args.text || '').trim();

      if (!textToProcess && !args.audioData) {
        setErrorMessage('Por favor di o escribe una frase para registrar tu movimiento.');
        setModalState('error');
        return;
      }

      setModalState('processing');
      setErrorMessage('');

      try {
        const response = await aiVoiceService.processVoice({
          text: textToProcess || undefined,
          audioData: args.audioData,
          mimeType: args.mimeType,
          categories,
          accounts,
          preferredCurrency: preferredCurrency || 'COP',
        });

        setCurrentResult(response);

        // Check if missing critical data (amount or needs confirmation)
        if (
          response.raw.necesita_confirmacion ||
          !response.suggestedPayload.amount ||
          response.suggestedPayload.amount <= 0 ||
          !response.suggestedPayload.accountId
        ) {
          setModalState('missing_data');
        } else {
          setModalState('confirmation');
        }
      } catch (err: any) {
        console.error('Error procesando voz con IA:', err);
        setErrorMessage(
          err.message || 'No se pudo entender el movimiento. Inténtalo de nuevo o escribe la frase.'
        );
        setModalState('error');
      }
    },
    [categories, accounts, preferredCurrency]
  );

  // Start recording
  const handleStartListening = async () => {
    triggerHaptic('start');
    setErrorMessage('');
    resetTranscript();
    setModalState('listening');
    await startListening();
  };

  // Stop recording and process
  const handleStopListening = async () => {
    const recorded = await stopListening();
    const finalTranscript = (recorded.transcript || transcript || fullTranscript || '').trim();

    if (!finalTranscript && !recorded.audioBase64) {
      setErrorMessage(
        isBrave
          ? 'En Brave la red bloquea la transcripción directa. Escribe tu frase en el recuadro a mano.'
          : 'No se detectó audio comprensible. Intenta hablar más cerca del micrófono.'
      );
      setModalState('error');
      return;
    }

    await processVoiceInput({
      text: finalTranscript,
      audioData: recorded.audioBase64,
      mimeType: recorded.mimeType,
    });
  };

  // Cancel recording and return to idle
  const handleCancelListening = async () => {
    await stopListening();
    resetTranscript();
    setModalState('idle');
  };

  // Submit manual text directly
  const handleSubmitManualText = (text: string) => {
    triggerHaptic('tap');
    processVoiceInput({ text });
  };

  // Save transaction to store / backend
  const handleConfirmTransaction = async (payload: CreateTransactionPayload) => {
    try {
      setLastSavedPayload(payload);
      await onSaveTransaction(payload);
      setModalState('success');
      showToast({
        type: 'success',
        title: 'Movimiento guardado',
        message: `${payload.type === 'INCOME' ? 'Ingreso' : 'Gasto'} registrado correctamente`,
      });
    } catch (err: any) {
      console.error('Error al guardar movimiento:', err);
      showToast({
        type: 'error',
        title: 'Error al guardar',
        message: err.message || 'No se pudo guardar la transacción.',
      });
    }
  };

  // Missing data resolved
  const handleCompleteMissingData = (updates: Partial<CreateTransactionPayload>) => {
    if (!currentResult) return;

    const mergedPayload = {
      ...currentResult.suggestedPayload,
      ...updates,
    };

    setCurrentResult({
      ...currentResult,
      suggestedPayload: mergedPayload,
      raw: {
        ...currentResult.raw,
        monto: mergedPayload.amount,
        cuenta_origen:
          accounts.find((a) => a.id === mergedPayload.accountId)?.name || currentResult.raw.cuenta_origen,
        necesita_confirmacion: false,
      },
    });

    setModalState('confirmation');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar movimiento por voz"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none"
    >
      {/* Backdrop (matches page modals: light slate backdrop blur) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
      />

      {/* Bottom Sheet Modal Container (Pure white background matching page card style) */}
      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full md:max-w-[400px] bg-white rounded-t-3xl md:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col border-t md:border border-slate-200/90"
        style={{
          boxShadow: '0 -10px 35px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Mobile Drag Handle */}
        <div className="w-full pt-2.5 pb-1 flex justify-center md:hidden">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Top bar with close button & FinanAPP Emerald brand tag */}
        <div className="flex items-center justify-between px-4 pt-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Registro por voz
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                FinanAPP
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Pure white, scroll-free and compact */}
        <div className="overflow-hidden bg-white px-2.5 pb-3.5 pt-1">
          <AnimatePresence mode="wait">
            {modalState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceIdleState
                  onStartListening={handleStartListening}
                  onSubmitManualText={handleSubmitManualText}
                  isBrave={isBrave}
                />
              </motion.div>
            )}

            {modalState === 'listening' && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceListeningState
                  audioLevel={audioLevel}
                  transcript={fullTranscript || transcript}
                  recordingSeconds={recordingSeconds}
                  onStop={handleStopListening}
                  onCancel={handleCancelListening}
                />
              </motion.div>
            )}

            {modalState === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceProcessingState />
              </motion.div>
            )}

            {modalState === 'confirmation' && currentResult && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceConfirmationState
                  data={currentResult}
                  categories={categories}
                  accounts={accounts}
                  onConfirm={handleConfirmTransaction}
                  onRepeat={handleStartListening}
                  onOpenFullEdit={onOpenFullForm}
                />
              </motion.div>
            )}

            {modalState === 'missing_data' && currentResult && (
              <motion.div
                key="missing_data"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceMissingDataState
                  data={currentResult}
                  accounts={accounts}
                  categories={categories}
                  onCompleteMissingData={handleCompleteMissingData}
                  onCancel={() => setModalState('idle')}
                />
              </motion.div>
            )}

            {modalState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceSuccessState
                  payload={lastSavedPayload}
                  onAutoClose={onClose}
                />
              </motion.div>
            )}

            {modalState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <VoiceErrorState
                  errorMessage={errorMessage}
                  onRetry={handleStartListening}
                  onSubmitManualText={handleSubmitManualText}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
