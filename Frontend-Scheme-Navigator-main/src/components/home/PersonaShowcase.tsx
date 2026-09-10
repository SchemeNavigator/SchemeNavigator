import React, { useState } from 'react';
import { AUDIENCE_PERSONAS } from '../../constants';
import {
  GraduationCap,
  Sprout,
  Rocket,
  Heart,
  Briefcase,
  Home,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveUserProfile, DEFAULT_DEMO_PROFILE } from '../../services/storageService';

export const PersonaShowcase: React.FC = () => {
  const [selectedPersonaId, setSelectedPersonaId] = useState('students');
  const navigate = useNavigate();

  const getPersonaIcon = (icon: string) => {
    switch (icon) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5" />;
      case 'Rocket':
        return <Rocket className="w-5 h-5" />;
      case 'Heart':
        return <Heart className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'Home':
        return <Home className="w-5 h-5" />;
      case 'Shield':
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const currentPersona = AUDIENCE_PERSONAS.find((p) => p.id === selectedPersonaId) || AUDIENCE_PERSONAS[0];

  const handleLaunchWithPersona = () => {
    // Pre-populate sample profile and route to recommendations
    const sample = currentPersona.sampleProfile as Partial<typeof DEFAULT_DEMO_PROFILE>;
    const profile = {
      ...DEFAULT_DEMO_PROFILE,
      ...sample,
    };
    saveUserProfile(profile);
    navigate('/recommendations');
  };


  return (
    <section className="py-16 lg:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Built For Every Citizen</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Citizens from All Walks of Life
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            You don't need to know the scheme name in advance. Pick your background to see what's possible.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          {AUDIENCE_PERSONAS.map((p) => {
            const isSelected = p.id === selectedPersonaId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersonaId(p.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-800 text-white shadow-md shadow-teal-900/20 scale-102'
                    : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {getPersonaIcon(p.icon)}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Persona Spotlight Card */}
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white p-8 sm:p-10 shadow-xl border border-teal-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-800/80 text-emerald-300 text-xs font-semibold">
                <span>{currentPersona.label} Discovery Track</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {currentPersona.headline}
              </h3>
              <p className="text-sm text-teal-100/90 leading-relaxed">
                {currentPersona.description}
              </p>

              <div className="pt-2">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block mb-2">
                  Featured Target Schemes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentPersona.keySchemes.map((scheme, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-900/80 border border-teal-700/60 text-xs font-medium text-white shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{scheme}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-teal-900/40 backdrop-blur-md p-6 rounded-2xl border border-teal-700/50 space-y-4 text-center lg:text-left">
              <div>
                <span className="text-xs text-teal-300 font-medium">Instant Test Persona</span>
                <div className="text-base font-bold text-white mt-0.5">
                  See how SchemeNavigator analyzes a {currentPersona.label.toLowerCase()} profile
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-left">
                <div>• Auto-configured eligibility criteria</div>
                <div>• Instant transparent match calculation</div>
                <div>• Full document checklist & application routes</div>
              </div>

              <button
                onClick={handleLaunchWithPersona}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>View {currentPersona.label} Recommendations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
