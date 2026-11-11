import { useState, useEffect, useRef, useCallback } from 'react';

interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useSpeechRecognition(options: { lang?: string } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const transcriptAccumulatorRef = useRef('');

  // Check support on mount
  useEffect(() => {
    const win = window as unknown as WindowWithSpeech;
    const hasSpeech = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
    const hasMedia = Boolean(navigator.mediaDevices?.getUserMedia);
    setIsSupported(hasSpeech || hasMedia);
  }, []);

  const stopCleanup = useCallback(() => {
    isListeningRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setIsListening(false);
  }, []);

  // Spawn a fresh, brand new SpeechRecognition session for each recording attempt
  const createFreshRecognition = useCallback(() => {
    const win = window as unknown as WindowWithSpeech;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      return null;
    }

    try {
      const recognition = new SpeechClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Select natural Spanish dialect based on browser
      const browserLang = navigator.language || 'es-ES';
      recognition.lang = browserLang.toLowerCase().startsWith('es')
        ? browserLang
        : options.lang || 'es-ES';

      recognition.onstart = () => {
        console.log('🎤 [SpeechRecognition] Sesión activa con idioma:', recognition.lang);
      };

      recognition.onspeechstart = () => {
        setSpeechDetected(true);
      };

      recognition.onresult = (event: any) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          transcriptAccumulatorRef.current = transcriptAccumulatorRef.current
            ? `${transcriptAccumulatorRef.current} ${currentFinal.trim()}`
            : currentFinal.trim();
          setTranscript(transcriptAccumulatorRef.current);
          setSpeechDetected(true);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.info(`[SpeechRecognition] Nota: ${event.error}. Grabación local sigue activa.`);
        if (event.error === 'not-allowed') {
          setError('Permiso de micrófono no otorgado en el navegador.');
        }
      };

      recognition.onend = () => {
        // If still supposed to be listening and continuous was cut by the browser, revive with a fresh instance
        if (isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current) {
              try {
                const fresh = createFreshRecognition();
                if (fresh) {
                  recognitionRef.current = fresh;
                  fresh.start();
                }
              } catch (e) {
                console.info('SpeechRecognition revive note:', e);
              }
            }
          }, 250);
        }
      };

      return recognition;
    } catch (err) {
      console.warn('No se pudo instanciar SpeechRecognition:', err);
      return null;
    }
  }, [options.lang]);

  const startListening = useCallback(async () => {
    setError(null);
    setAudioLevel(0);
    setRecordingSeconds(0);
    setHasRecordedAudio(false);
    setSpeechDetected(false);
    setTranscript('');
    setInterimTranscript('');
    transcriptAccumulatorRef.current = '';
    audioChunksRef.current = [];
    isListeningRef.current = true;
    setIsListening(true);

    // 1. Immediately instantiate fresh SpeechRecognition synchronously in user gesture
    const freshRec = createFreshRecognition();
    if (freshRec) {
      recognitionRef.current = freshRec;
      try {
        freshRec.start();
      } catch (e) {
        console.info('Initial SpeechRecognition start note:', e);
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador o entorno no soporta captura de micrófono.');
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    try {
      // 2. Open microphone stream locally
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. Setup AudioContext for waveform visualization and VAD (Voice Activity Detection)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateLevel = () => {
            if (!analyserRef.current || !isListeningRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            const normalized = Math.min(1, avg / 110);
            setAudioLevel(normalized);

            if (normalized > 0.08) {
              setSpeechDetected(true);
            }

            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (err) {
        console.warn('AudioContext meter setup note:', err);
      }

      // 4. Start local MediaRecorder (chunks raw audio for backup and AI verification)
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(200); // chunk every 200ms
      }

      // 5. Timer counter for recording duration
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de micrófono denegado. Permite el acceso al micrófono en la barra de tu navegador.');
      } else {
        setError(`No se pudo iniciar la grabación: ${err.message || 'Error desconocido'}`);
      }
      isListeningRef.current = false;
      setIsListening(false);
      stopCleanup();
    }
  }, [createFreshRecognition, stopCleanup]);

  const stopListening = useCallback((): Promise<{
    audioBlob?: Blob;
    audioBase64?: string;
    mimeType?: string;
    transcript: string;
  }> => {
    return new Promise((resolve) => {
      isListeningRef.current = false;
      setIsListening(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recorder = mediaRecorderRef.current;
      const finalAccumulatedText = transcriptAccumulatorRef.current || transcript;

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = async () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          let base64 = '';
          try {
            if (blob.size > 0) {
              base64 = await blobToBase64(blob);
              setHasRecordedAudio(true);
            }
          } catch (e) {
            console.warn('Error converting audio blob to base64:', e);
          }

          stopCleanup();
          resolve({
            audioBlob: blob.size > 0 ? blob : undefined,
            audioBase64: base64 || undefined,
            mimeType,
            transcript: finalAccumulatedText.trim(),
          });
        };

        try {
          recorder.stop();
        } catch {
          stopCleanup();
          resolve({ transcript: finalAccumulatedText.trim() });
        }
      } else {
        stopCleanup();
        resolve({ transcript: finalAccumulatedText.trim() });
      }
    });
  }, [stopCleanup, transcript]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptAccumulatorRef.current = '';
    setError(null);
    setAudioLevel(0);
    setRecordingSeconds(0);
    setSpeechDetected(false);
    setHasRecordedAudio(false);
    audioChunksRef.current = [];
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: `${transcript} ${interimTranscript}`.trim(),
    setTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
    audioLevel,
    recordingSeconds,
    hasRecordedAudio,
    speechDetected,
  };
}
