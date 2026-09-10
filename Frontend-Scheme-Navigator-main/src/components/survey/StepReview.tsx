import React from 'react';
import { UserProfile } from '../../types';
import { formatIndianRupee } from '../../utils/formatIndianNumber';
import {
  User,
  MapPin,
  Briefcase,
  IndianRupee,
  ShieldCheck,
  Edit2,
  Lock,
} from 'lucide-react';

interface StepReviewProps {
  profile: UserProfile;
  onEditStep: (stepNumber: number) => void;
}

export const StepReview: React.FC<StepReviewProps> = ({ profile, onEditStep }) => {
  const hasDisability = Boolean(profile.hasDisability ?? profile.isDisability);
  const isBpl = Boolean(profile.hasBPLCard ?? profile.isBPL);

  const maritalStatusLabels: Record<string, string> = {
    single: 'Unmarried / Single',
    married: 'Married',
    divorced: 'Divorced',
    deserted: 'Deserted',
  };

  const summaryItems = [
    {
      step: 1,
      title: 'Personal Info',
      icon: User,
      items: [
        { label: 'Age', value: profile.age ? `${profile.age} years` : 'Not specified' },
        {
          label: 'Gender',
          value: profile.gender
            ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
            : 'Not specified',
        },
        {
          label: 'Marital Status',
          value: profile.maritalStatus ? maritalStatusLabels[profile.maritalStatus] || 'Not specified' : 'Not specified',
        },
      ],
    },
    {
      step: 2,
      title: 'Location & Domicile',
      icon: MapPin,
      items: [
        { label: 'State', value: profile.state || 'Haryana' },
        { label: 'District', value: profile.district || 'Any / All' },
        { label: 'Locality', value: profile.residenceArea || profile.areaType || 'Urban' },
      ],
    },
    {
      step: 3,
      title: 'Social Category & Status',
      icon: ShieldCheck,
      items: [
        { label: 'Category', value: profile.category || 'General' },
        {
          label: 'Disability',
          value: hasDisability
            ? `Yes (${profile.disabilityPercentage ?? 40}%)`
            : 'No',
        },
        { label: 'Minority Status', value: profile.isMinority ? 'Yes' : 'No' },
        { label: 'BPL Status', value: isBpl ? 'Yes' : 'No' },
      ],
    },
    {
      step: 4,
      title: 'Occupation & Livelihood',
      icon: Briefcase,
      items: [
        {
          label: 'Employment Status',
          value: profile.employmentStatus || profile.employmentType || 'Student',
        },
        {
          label: 'Occupation',
          value: profile.occupation || profile.employmentType || 'Student',
        },
      ],
    },
    {
      step: 5,
      title: 'Household Income',
      icon: IndianRupee,
      items: [
        {
          label: 'Annual Income',
          value:
            profile.annualIncome !== undefined && profile.annualIncome !== ''
            ? formatIndianRupee(Number(profile.annualIncome))
            : profile.incomeRange || 'Not specified',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
          Step 6 of 6 • Review & Confirmation
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          Your Eligibility Profile Summary
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Review your answers before our matching engine evaluates thousands of scheme conditions.
        </p>
      </div>

      {/* Review Summary Grid */}
      <div className="space-y-4">
        {summaryItems.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.step}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider">
                  <Icon className="w-4 h-4 text-teal-700" />
                  <span>{section.title}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx}>
                      <span className="text-[11px] text-slate-600 font-medium block">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate block">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditStep(section.step)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-bold transition-colors shrink-0 self-start sm:self-center cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Privacy Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-slate-700 flex items-start gap-3">
        <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-teal-950 block mb-0.5">Privacy Assurance:</span>
          Your profile signals are evaluated securely according to data minimization principles. We use these parameters solely to calculate statutory eligibility compatibility scores.
        </div>
      </div>
    </div>
  );
};
