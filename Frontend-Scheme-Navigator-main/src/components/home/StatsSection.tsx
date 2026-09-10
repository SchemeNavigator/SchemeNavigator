import React from 'react';
import { STATS_DATA } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { Sparkles, Info } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white py-16 lg:py-20 border-y border-teal-800/40">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-600/40 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('stats.schemes')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Empowering Citizens Across Every State & Territory
          </h2>
          <p className="text-sm text-teal-100/80 leading-relaxed">
            {t('stats.schemesSub')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STATS_DATA.map((stat, idx) => (
            <div
              key={idx}
              className="text-center p-6 sm:p-8 rounded-2xl bg-teal-900/30 border border-teal-700/40 backdrop-blur-xs hover:border-teal-500/60 transition-all group"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-teal-300 tracking-tight group-hover:scale-105 transition-transform">
                {stat.value}
              </div>
              <div className="text-base font-bold text-white mt-2">
                {stat.label}
              </div>
              <div className="text-xs text-teal-200/70 mt-1">
                {stat.note}
              </div>
            </div>
          ))}
        </div>


        {/* Disclaimer / Demo Notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-center text-[11px] text-teal-300/70">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            Prototype dataset: Statistics reflect indexed metadata and catalog aggregations for demonstrative guidance purposes.
          </span>
        </div>
      </div>
    </section>
  );
};
