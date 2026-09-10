import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CompassVisual } from './CompassVisual';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { handleCheckEligibility } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50/80 pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/60">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Category / Compass Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-bold shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>{t('hero.badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              {t('hero.title1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-700">
                {t('hero.title2')}
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleCheckEligibility(navigate)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 hover:from-teal-800 hover:to-slate-900 text-white text-base font-bold rounded-2xl shadow-lg shadow-teal-900/25 hover:shadow-xl transition-all duration-200 active:scale-[0.98] group cursor-pointer"
              >
                <Compass className="w-5 h-5 text-emerald-300 group-hover:rotate-45 transition-transform" />
                <span>{t('hero.checkEligibility')}</span>
                <ArrowRight className="w-4 h-4 text-teal-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                to="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-100/90 text-slate-800 hover:text-slate-950 text-base font-bold rounded-2xl border border-slate-300/90 shadow-2xs hover:shadow-md transition-all"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>{t('hero.exploreSchemes')}</span>
              </Link>
            </div>

            {/* Trust Message below CTA */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('hero.verified')}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>{t('hero.secure')}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('hero.guidance')}</span>
              </div>
            </div>

            {/* Citizen Persona Quick Bar */}
            <div className="pt-4 border-t border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                {t('hero.popularPaths')}
              </span>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
                {[
                  { label: t('hero.students'), link: '/explore?category=Education' },
                  { label: t('hero.farmers'), link: '/explore?category=Agriculture' },
                  { label: t('hero.entrepreneurs'), link: '/explore?category=Business' },
                  { label: t('hero.women'), link: '/explore?category=Women%20%26%20Child' },
                  { label: t('hero.jobSeekers'), link: '/explore?category=Employment' },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.link}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-medium transition-all shadow-2xs"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Compass & Scheme Visual */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <CompassVisual />
          </div>
        </div>
      </div>
    </section>
  );
};
