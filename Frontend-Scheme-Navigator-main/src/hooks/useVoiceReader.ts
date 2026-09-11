import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export interface UseVoiceReaderOptions {
  defaultRate?: number;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export const useVoiceReader = (options: UseVoiceReaderOptions = {}) => {
  const { selectedLanguage } = useAppStore();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(options.defaultRate || 1.0);
  const [progress, setProgress] = useState<number>(0);
  const [currentText, setCurrentText] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeLangCode = selectedLanguage?.speechCode || selectedLanguage?.code || 'en-IN';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } catch (e) {
        console.warn('SpeechSynthesis pause error:', e);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } catch (e) {
        console.warn('SpeechSynthesis resume error:', e);
      }
    }
  }, []);

  const play = useCallback(
    (textToSpeak: string, customLang?: string) => {
      if (!textToSpeak || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      // Cancel any ongoing speech first
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      const cleanText = textToSpeak.replace(/[\n\r]+/g, ' ').trim();
      setCurrentText(cleanText);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = customLang || activeLangCode;
      utterance.lang = targetLang;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Match system voices if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = targetLang.split('-')[0].toLowerCase();
        const bestVoice =
          voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
          voices.find((v) => v.lang.includes('IN')) ||
          voices[0];
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setProgress(0);
      };

      utterance.onboundary = (event) => {
        if (cleanText.length > 0 && event.charIndex !== undefined) {
          const pct = Math.min(100, Math.round((event.charIndex / cleanText.length) * 100));
          setProgress(pct);
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        options.onEnd?.();
      };

      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error:', err);
        setIsPlaying(false);
        setIsPaused(false);
        options.onError?.(err);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [activeLangCode, rate, options]
  );

  // Cleanup on unmount or language change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isPlaying,
    isPaused,
    progress,
    rate,
    setRate,
    currentText,
    activeLangCode,
    play,
    pause,
    resume,
    stop,
  };
};
