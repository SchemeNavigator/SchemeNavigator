import React, { useState } from 'react';
import { Scheme, ApplicationStatus } from '../../types';
import {
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  BookmarkCheck,
} from 'lucide-react';
import { updateTrackerStatus } from '../../services/storageService';

interface ApplicationTimelineProps {
  scheme: Scheme;
  onOpenApplyModal: () => void;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  scheme,
  onOpenApplyModal,
}) => {
  const [trackerAdded, setTrackerAdded] = useState(false);

  const handleAddToTracker = (status: ApplicationStatus = 'Ready to Apply') => {
    updateTrackerStatus(scheme.id, scheme.name, scheme.category, status, 'Tracking guidance steps on SchemeNavigator');
    setTrackerAdded(true);
    setTimeout(() => setTrackerAdded(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            How to Apply (Application Journey)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow this verified step-by-step roadmap to complete your registration on the government portal.
          </p>
        </div>

        <button
          onClick={() => handleAddToTracker('Ready to Apply')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            trackerAdded
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200'
          }`}
        >
          {trackerAdded ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <PlusCircle className="w-4 h-4 text-teal-700" />}
          <span>{trackerAdded ? 'Added to Tracker' : 'Track in My Dashboard'}</span>
        </button>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-0.5 before:bg-slate-200">
        {scheme.applicationSteps.map((step) => (
          <div key={step.stepNumber} className="relative flex items-start gap-4 sm:gap-6 group">
            {/* Step Number Circle */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-800 text-white font-mono font-extrabold text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md ring-4 ring-white z-10">
              0{step.stepNumber}
            </div>

            {/* Step Content Card */}
            <div className="flex-1 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 group-hover:border-teal-300 group-hover:bg-teal-50/30 transition-all space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {step.title}
                </h4>
                {step.actionUrl && (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    Official Link
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>

              {step.tips && (
                <div className="p-2.5 rounded-xl bg-amber-50/80 text-[11px] text-amber-900 border border-amber-200/60 flex items-start gap-2 mt-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Helpful Tip:</strong> {step.tips}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Official Government Exit Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Ready to Submit Application?</span>
          </div>
          <h4 className="text-lg font-bold text-white">
            Continue to {scheme.verification.sourceDepartment}
          </h4>
          <p className="text-xs text-slate-300 max-w-lg">
            Application submission occurs directly on the official secured government portal. SchemeNavigator never charges any fees.
          </p>
        </div>

        <button
          onClick={onOpenApplyModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-950/40 hover:shadow-xl transition-all shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <span>Go to Official Application Portal</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
