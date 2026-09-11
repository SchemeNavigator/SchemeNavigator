import React from 'react';
import { UserProfile, AreaType } from '../../types';
import { INDIAN_STATES, POPULAR_DISTRICTS } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { MapPin, Building2, Trees, Landmark } from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';

interface StepLocationProps {
  profile: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
  onOpenVoice?: () => void;
}

export const StepLocation: React.FC<StepLocationProps> = ({ profile, onChange, onOpenVoice }) => {
  const { t, tp, tState } = useTranslation();
  const currentState = profile.state || '';
  const availableDistricts = currentState && POPULAR_DISTRICTS[currentState]
    ? POPULAR_DISTRICTS[currentState]
    : ['Capital / Main District', 'North District', 'South District', 'Others'];

  const areaOptions: { id: AreaType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'Urban',
      label: t('survey.urban'),
      desc: 'Municipal corporation, cities, or towns',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
    },
    {
      id: 'Rural',
      label: t('survey.rural'),
      desc: 'Gram Panchayat, villages, farm areas',
      icon: <Trees className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'Semi-Urban',
      label: tp('Semi-Urban'),
      desc: 'Suburban outgrowths, tehsils',
      icon: <Landmark className="w-5 h-5 text-purple-600" />,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            {t('survey.stepOf', { step: 2, total: 6 })} {t('survey.stepLocation')}
          </span>
          {onOpenVoice && (
            <VoiceMicButton
              onClick={onOpenVoice}
              variant="pill"
              label={t('survey.speak')}
              sublabel="बोलें"
            />
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          {t('survey.stepLocation')}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {t('howItWorks.subtitle')}
        </p>
      </div>

      {/* State Dropdown */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('survey.stateLabel')} <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-teal-700" />
          <select
            value={profile.state || ''}
            onChange={(e) => onChange({ state: e.target.value, district: '' })}
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-2xl text-slate-900 text-sm font-semibold outline-hidden transition-all appearance-none cursor-pointer"
          >
            <option value="">-- {t('survey.select_state', undefined, 'Select Your State')} --</option>
            {INDIAN_STATES.filter((s) => s !== 'All India').map((st) => (
              <option key={st} value={st}>
                {tState(st)}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* District Dropdown */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('survey.districtLabel')} <span className="text-slate-500 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <select
            value={profile.district || ''}
            onChange={(e) => onChange({ district: e.target.value })}
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-2xl text-slate-900 text-sm font-medium outline-hidden transition-all appearance-none cursor-pointer"
          >
            <option value="">-- {t('survey.districtPlaceholder')} --</option>
            {availableDistricts.map((dst) => (
              <option key={dst} value={dst}>
                {dst}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* Area Type Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('survey.areaType')} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {areaOptions.map((opt) => {
            const isSelected = profile.areaType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ areaType: opt.id })}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/80 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-slate-100">{opt.icon}</div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-teal-700 bg-teal-700' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-bold ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                    {opt.label}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
