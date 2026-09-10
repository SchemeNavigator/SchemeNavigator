import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceMicButtonProps {
  onClick: () => void;
  isListening?: boolean;
  label?: string;
  sublabel?: string;
  variant?: 'pill' | 'icon' | 'banner';
  className?: string;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  onClick,
  isListening = false,
  label = 'Speak Answers',
  sublabel = 'बोल कर भरें',
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Speak answer using your microphone"
        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-400'
            : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/80 hover:border-teal-300'
        } ${className}`}
      >
        <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer group ${
          isListening
            ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white border-rose-600 shadow-lg shadow-rose-500/20 ring-2 ring-rose-300'
            : 'bg-gradient-to-r from-teal-50 via-emerald-50/60 to-slate-50 border-teal-200/80 hover:border-teal-300 hover:shadow-md'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
              isListening ? 'bg-white text-rose-600 shadow-sm animate-pulse' : 'bg-teal-700 text-white shadow-xs'
            }`}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold ${isListening ? 'text-white' : 'text-slate-900'}`}>
                {label}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isListening ? 'bg-rose-700 text-white' : 'bg-teal-100 text-teal-800'
                }`}
              >
                {isListening ? 'Listening...' : '12 Languages'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isListening ? 'text-rose-100' : 'text-slate-600'}`}>
              Speak answers in 11+ Indian regional languages (हिन्दी, বাংলা, తెలుగు, தமிழ், मराठी, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, اردو, English)
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
              isListening
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-white text-teal-800 border-teal-200 group-hover:bg-teal-50'
            }`}
          >
            {sublabel}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
        isListening
          ? 'bg-rose-500 text-white border-rose-600 shadow-sm animate-pulse ring-2 ring-rose-300'
          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200 hover:border-teal-300 shadow-2xs'
      } ${className}`}
    >
      <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : 'text-teal-700'}`} />
      <span>{label}</span>
      {sublabel && <span className="opacity-75 font-normal">({sublabel})</span>}
    </button>
  );
};
