import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { TrustStrip } from '../components/home/TrustStrip';
import { StatsSection } from '../components/home/StatsSection';
import { HowItWorks } from '../components/home/HowItWorks';
import { PersonaShowcase } from '../components/home/PersonaShowcase';
import { PopularSchemesSection } from '../components/home/PopularSchemesSection';
import { FAQSection } from '../components/home/FAQSection';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Compass, ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { handleCheckEligibility } = useAppStore();
  const navigate = useNavigate();

  return (

    <div className="space-y-0">
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
      <section className="py-16 lg:py-20 bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Start Your 2-Minute Survey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Ready to Discover Government Support Tailored for You?
          </h2>

          <p className="text-sm sm:text-base text-teal-100/90 max-w-2xl mx-auto leading-relaxed">
            Answer a few simple questions. Our matching compass will guide you through verified eligibility conditions, benefits, and application steps.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-800 hover:bg-teal-700 text-white font-bold text-base rounded-2xl border border-teal-600/60 shadow-lg shadow-teal-950/30 hover:shadow-xl transition-all"
            >
              <Compass className="w-5 h-5 text-emerald-300" />
              <span>Explore Scheme Catalog</span>
              <ArrowRight className="w-4 h-4 text-teal-200" />
            </Link>
          </div>


          <div className="pt-4 flex items-center justify-center gap-4 text-xs text-teal-300/80">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Free Service
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              No Aadhaar Number Required
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
