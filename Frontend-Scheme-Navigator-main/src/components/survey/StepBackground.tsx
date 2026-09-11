import React, { useState } from 'react';
import { UserProfile, Category } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { HelpCircle, Info, ShieldCheck, HeartPulse, Users } from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';

interface StepBackgroundProps {
  profile: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
  onOpenVoice?: () => void;
}

export const StepBackground: React.FC<StepBackgroundProps> = ({ profile, onChange, onOpenVoice }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { t, tp } = useTranslation();

  const categories: { id: Category | string; label: string; desc: string }[] = [
    { id: 'General', label: t('survey.general'), desc: 'No category reservation quota' },
    { id: 'SC', label: t('survey.sc'), desc: 'Applicable central / state welfare schemes' },
    { id: 'ST', label: t('survey.st'), desc: 'Tribal welfare & special scholarship grants' },
    { id: 'OBC', label: t('survey.obc'), desc: 'Non-creamy / central or state list' },
    { id: 'EWS', label: t('survey.ews'), desc: 'Income & asset verified certificate' },
    { id: 'Other', label: tp('Other'), desc: 'General statutory guidelines apply' },
  ];

  const hasDisability = Boolean(profile.hasDisability ?? profile.isDisability);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            {t('survey.stepOf', { step: 3, total: 6 })} {t('survey.stepBackground')}
          </span>
          <div className="flex items-center gap-3">
            {onOpenVoice && (
              <VoiceMicButton
                onClick={onOpenVoice}
                variant="pill"
                label={t('survey.speak')}
                sublabel="बोलें"
              />
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-teal-900 font-semibold cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>Why do we ask this?</span>
              </button>

              {showTooltip && (
                <div className="absolute right-0 top-6 z-30 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Affirmative Welfare Allocation</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Under Indian welfare frameworks, scholarships, fee waivers, and subsidies provide dedicated allocations for SC, ST, OBC, EWS, Minority, and Differently-abled citizens.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          {t('survey.stepBackground')}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {t('howItWorks.subtitle')}
        </p>
      </div>

      {/* Category Grid */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('survey.categoryLabel')} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const isSelected = profile.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({ category: cat.id as any })}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/80 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                    {cat.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-teal-700 bg-teal-700' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{cat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disability Signal */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <HeartPulse className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  {t('survey.disabilityLabel')}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enables assistive device subsidies (ADIP), UDID card benefits, and reservation allowances.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    hasDisability: false,
                    isDisability: false,
                    disabilityPercentage: undefined,
                  })
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !hasDisability
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('survey.no')}
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    hasDisability: true,
                    isDisability: true,
                    disabilityPercentage: profile.disabilityPercentage || 40,
                  })
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  hasDisability
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('survey.yes')}
              </button>
            </div>
          </div>

          {/* Conditional Percentage */}
          {hasDisability && (
            <div className="pt-3 border-t border-slate-200 flex items-center gap-3 animate-in fade-in">
              <label className="text-xs font-bold text-slate-700 shrink-0">
                {t('survey.disabilityPercent')}:
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={profile.disabilityPercentage ?? 40}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChange({ disabilityPercentage: isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100) });
                }}
                className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-teal-600 outline-hidden"
              />
              <span className="text-xs text-slate-500 font-medium">(Benchmark standard is 40%+)</span>
            </div>
          )}
        </div>

        {/* Minority Community (shown when disability is No or independent) */}
        {!hasDisability && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Do you belong to a minority community?
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Muslim, Christian, Sikh, Buddhist, Jain, Parsi notified communities under National Minority Commission.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onChange({ isMinority: false })}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !profile.isMinority
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('survey.no')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ isMinority: true })}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  profile.isMinority
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('survey.yes')}
              </button>
            </div>
          </div>
        )}

        {/* BPL / Ration Card Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {t('survey.bplLabel')}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority for Ayushman Bharat cashless hospital care, housing subsidies, and subsidized rations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onChange({ hasBPLCard: false, isBPL: false })}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                !(profile.hasBPLCard || profile.isBPL)
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t('survey.no')}
            </button>
            <button
              type="button"
              onClick={() => onChange({ hasBPLCard: true, isBPL: true })}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                profile.hasBPLCard || profile.isBPL
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t('survey.yes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
