import React from 'react';
import { ShieldAlert, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

interface DisclaimerBannerProps {
  variant?: 'inline' | 'compact' | 'footer';
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  variant = 'inline',
  className = '',
}) => {
  const { t } = useTranslation();
  const [isDismissedMobile, setIsDismissedMobile] = React.useState(false);

  if (variant === 'compact') {
    return (
      <div className={`p-3.5 bg-teal-950/5 border border-teal-800/20 rounded-2xl flex items-center justify-between text-xs text-slate-700 backdrop-blur-md ${className}`}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="font-medium">
            {t('footer.disclaimer')}
          </span>
        </div>
        <Link to="/about" className="text-teal-800 font-bold hover:text-teal-950 hover:underline shrink-0 ml-2 hidden sm:inline">
          {t('nav.about')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile App Ticker (Compact & non-intrusive) */}
      {!isDismissedMobile && (
        <div className="sm:hidden w-full max-w-full bg-slate-950 text-slate-200 py-1.5 px-3 text-[11px] border-b border-teal-900/40 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-hidden truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="font-bold text-emerald-300 shrink-0">Official Notice:</span>
            <span className="truncate text-slate-300">Independent guidance • .gov.in links only</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/about#what-we-are-not"
              className="text-[10px] font-bold text-teal-300 hover:text-white underline"
            >
              Info
            </Link>
            <button
              type="button"
              onClick={() => setIsDismissedMobile(true)}
              className="text-slate-400 hover:text-white p-0.5 text-xs font-bold"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Desktop Full Banner (Unchanged for laptop) */}
      <div className={`hidden sm:block bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white py-2.5 px-4 text-xs border-b border-teal-800/30 relative overflow-hidden ${className}`}>
        {/* Subtle ambient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 text-left relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold text-[10px] tracking-wide border border-emerald-400/30 shadow-xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OFFICIAL NOTICE
            </span>
            <span className="text-slate-200 text-xs font-normal">
              {t('footer.disclaimer')}
            </span>
          </div>
          <Link
            to="/about#disclaimer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white transition-colors whitespace-nowrap group shrink-0"
          >
            <span>{t('about.title')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
          </Link>
        </div>
      </div>
    </>
  );
};
