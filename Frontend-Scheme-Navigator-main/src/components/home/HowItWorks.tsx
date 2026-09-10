import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import {
  UserCheck,
  Cpu,
  FileText,
  ExternalLink,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorks: React.FC = () => {
  const { t } = useTranslation();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck className="w-6 h-6 text-teal-700" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-emerald-700" />;
      case 'FileText':
        return <FileText className="w-6 h-6 text-blue-700" />;
      case 'ExternalLink':
      default:
        return <ExternalLink className="w-6 h-6 text-purple-700" />;
    }
  };

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-100/80 text-teal-900 text-xs font-bold border border-teal-200 shadow-2xs">
            <Compass className="w-4 h-4 text-teal-700" />
            <span>{t('howItWorks.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* 4 Connected Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {HOW_IT_WORKS_STEPS.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl bg-white p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              {/* Step Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    {getIcon(item.icon)}
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-300 group-hover:text-teal-600 transition-colors">
                    {item.step}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-950">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Step Footer Badge */}
              <div className="pt-5 mt-6 border-t border-slate-100">
                <span className="inline-flex items-center text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                  ✓ {item.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Flow CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/survey"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-slate-900 text-white font-bold text-sm rounded-2xl shadow-md shadow-teal-900/20 hover:shadow-lg transition-all"
          >
            <span>Start Step 1: Tell Us About Yourself</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
