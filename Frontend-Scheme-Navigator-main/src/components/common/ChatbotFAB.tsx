import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, X, Sparkles, ArrowRight } from 'lucide-react';

export const ChatbotFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  // Don't show on the assistant page itself
  if (location.pathname === '/assistant') return null;
  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Pop-out card panel */}
      {isOpen && (
        <div className="w-72 bg-white rounded-2xl border border-teal-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Card header */}
          <div className="bg-gradient-to-r from-teal-800 to-teal-900 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-700/60 border border-teal-600/50 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">AI Scheme Advisor</p>
                <p className="text-teal-300 text-[11px]">SchemeNavigator Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-teal-700/60 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Card body */}
          <div className="p-4 space-y-3">
            <p className="text-slate-700 text-xs leading-relaxed">
              Namaste! Tell me your age, state, or occupation and I'll suggest the most relevant government schemes for you.
            </p>

            {/* Sample prompts */}
            <div className="space-y-1.5">
              {[
                'I am a student in Maharashtra',
                'Farmer looking for subsidies',
                'Need housing assistance',
              ].map((prompt) => (
                <Link
                  key={prompt}
                  to={`/assistant`}
                  state={{ initialQuery: prompt }}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-300 text-xs text-slate-700 hover:text-teal-900 transition-all cursor-pointer"
                >
                  <span>"{prompt}"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>

            {/* CTA */}
            <Link
              to="/assistant"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Open Full Advisor</span>
            </Link>
          </div>

          {/* Dismiss */}
          <div className="px-4 pb-3 flex justify-end">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsDismissed(true); }}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* FAB trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI Scheme Advisor"
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-teal-900 shadow-teal-900/40 rotate-[8deg]'
            : 'bg-gradient-to-br from-teal-700 to-teal-900 hover:from-teal-600 hover:to-teal-800 shadow-teal-900/30 hover:shadow-teal-700/50 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Compass className="w-6 h-6 text-emerald-300" />
        )}
      </button>

      {/* Pulse ring when closed */}
      {!isOpen && (
        <span className="absolute bottom-0 right-0 w-14 h-14 rounded-2xl bg-teal-600/30 animate-ping pointer-events-none" />
      )}
    </div>
  );
};
