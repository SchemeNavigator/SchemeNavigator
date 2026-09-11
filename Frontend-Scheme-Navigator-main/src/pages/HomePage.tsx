import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { TrustStrip } from '../components/home/TrustStrip';
import { StatsSection } from '../components/home/StatsSection';
import { HowItWorks } from '../components/home/HowItWorks';
import { PersonaShowcase } from '../components/home/PersonaShowcase';
import { PopularSchemesSection } from '../components/home/PopularSchemesSection';
import { FAQSection } from '../components/home/FAQSection';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {

  return (

    <div className="space-y-0 w-full max-w-full overflow-x-hidden">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Trust Strip */}
      <TrustStrip />

      {/* 3. Statistics Strip */}
      <StatsSection />

      {/* 4. How It Works (4 Connected Steps) */}
      <HowItWorks />

      {/* 5. Citizen Persona Showcase */}
      <PersonaShowcase />

      {/* 6. Popular Schemes Spotlight */}
      <PopularSchemesSection />

      {/* 7. FAQ Section */}
      <FAQSection />

      {/* 8. Bottom CTA Banner */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 text-white relative overflow-hidden border-t border-teal-800/40">
        <div className="absolute inset-0 bg-dot-pattern opacity-15 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/90 border border-teal-500/40 text-emerald-300 text-xs font-bold shadow-xs">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Start Your 2-Minute Eligibility Check</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Ready to Discover Government Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">Tailored for You?</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100/90 max-w-2xl mx-auto leading-relaxed font-normal">
            Answer a few simple questions. Our matching compass will guide you through verified eligibility conditions, benefits, and direct application links.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/survey"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-950/60 hover:shadow-2xl transition-all duration-300 active:scale-[0.98] group cursor-pointer"
            >
              <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              <span>Check My Eligibility Now</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 bg-teal-900/60 hover:bg-teal-900/90 text-white font-bold text-base rounded-2xl border border-teal-600/50 backdrop-blur-md transition-all shadow-md"
            >
              <span>Explore 3,866 Schemes</span>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-teal-200/80 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Free Service
            </span>
            <span className="hidden sm:inline text-teal-700">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              No Login or Aadhaar Required
            </span>
            <span className="hidden sm:inline text-teal-700">•</span>
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              Direct Official Government Portals
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
