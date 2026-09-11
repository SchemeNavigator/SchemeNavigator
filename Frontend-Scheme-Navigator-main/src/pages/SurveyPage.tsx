import React from 'react';
import { SurveyWizard } from '../components/survey/SurveyWizard';
import { Compass } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const SurveyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-[calc(100vh-80px)] py-6 sm:py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Survey Meta Badge */}
        <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 text-xs font-bold border border-teal-200 dark:border-teal-800">
            <Compass className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('howItWorks.step1Title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('howItWorks.step1Desc')}
          </p>
        </div>

        {/* Wizard Container */}
        <SurveyWizard />
      </div>
    </div>
  );
};
