import React from 'react';
import { SurveyWizard } from '../components/survey/SurveyWizard';
import { Compass, ShieldCheck } from 'lucide-react';

export const SurveyPage: React.FC = () => {
  return (
    <div className="bg-slate-50/80 min-h-[calc(100vh-80px)] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Survey Meta Badge */}
        <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-900 text-xs font-bold border border-teal-200">
            <Compass className="w-3.5 h-3.5 text-teal-700" />
            <span>Eligibility Navigator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tell us about yourself
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            We will cross-reference your answers to find government schemes you may qualify for.
          </p>
        </div>

        {/* Wizard Container */}
        <SurveyWizard />
      </div>
    </div>
  );
};
