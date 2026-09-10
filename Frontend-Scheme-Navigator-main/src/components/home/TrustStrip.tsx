import React from 'react';
import { CheckCircle2, Lock, Clock, Compass } from 'lucide-react';
import { TRUST_PILLARS } from '../../constants';

export const TrustStrip: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle2':
        return <CheckCircle2 className="w-6 h-6 text-teal-700" />;
      case 'Lock':
        return <Lock className="w-6 h-6 text-emerald-700" />;
      case 'Clock':
        return <Clock className="w-6 h-6 text-blue-700" />;
      case 'Compass':
      default:
        return <Compass className="w-6 h-6 text-amber-700" />;
    }
  };

  return (
    <section className="bg-white py-10 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {TRUST_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/60 hover:bg-slate-50 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-200 shrink-0">
                {getIcon(pillar.icon)}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
