import React from 'react';
import { Scheme, UserProfile } from '../../types';
import { formatIncomeInLakh } from '../../utils/formatIndianNumber';
import { CheckCircle2, AlertCircle, HelpCircle, Check, Info } from 'lucide-react';

interface EligibilityChecklistProps {
  scheme: Scheme;
  userProfile: UserProfile | null;
}

export const EligibilityChecklist: React.FC<EligibilityChecklistProps> = ({
  scheme,
  userProfile,
}) => {
  const { eligibility } = scheme;

  // Build conditions checklist
  const criteriaList: { title: string; desc: string; isMatched: boolean; userValue?: string }[] = [];

  // Age condition
  const minAge = eligibility.minAge ?? 0;
  const maxAge = eligibility.maxAge ?? 100;
  const userAge = typeof userProfile?.age === 'number' ? userProfile.age : null;
  const ageMatched = userAge === null || (userAge >= minAge && userAge <= maxAge);

  criteriaList.push({
    title: 'Age Eligibility',
    desc: `Applicant must fall within ${minAge} to ${maxAge} years.`,
    isMatched: ageMatched,
    userValue: userAge !== null ? `Your age: ${userAge} yrs` : undefined,
  });

  // Location condition
  const isAllIndia = scheme.coveredStates.includes('All India');
  const userState = userProfile?.state;
  const stateMatched = isAllIndia || (userState ? scheme.coveredStates.includes(userState) : true);

  criteriaList.push({
    title: 'State & Territory Coverage',
    desc: isAllIndia
      ? 'Open to eligible citizens residing across all Indian states and Union Territories.'
      : `Restricted to permanent residents / domiciles of ${scheme.coveredStates.join(', ')}.`,
    isMatched: stateMatched,
    userValue: userState ? `Your location: ${userState}` : undefined,
  });

  // Occupation condition
  if (eligibility.allowedOccupations && eligibility.allowedOccupations.length > 0) {
    const userOcc = userProfile?.employmentType;
    const occMatched = !userOcc || eligibility.allowedOccupations.includes(userOcc as any);


    criteriaList.push({
      title: 'Target Occupation / Category',
      desc: `Open to: ${eligibility.allowedOccupations.join(', ')}.`,
      isMatched: occMatched,
      userValue: userOcc ? `Your occupation: ${userOcc}` : undefined,
    });
  }

  // Income condition
  if (eligibility.maxAnnualIncome && eligibility.maxAnnualIncome > 0) {
    criteriaList.push({
      title: 'Annual Income Ceiling',
      desc: `Gross household annual income must not exceed ${formatIncomeInLakh(eligibility.maxAnnualIncome)} per annum.`,
      isMatched: true,
      userValue: userProfile?.incomeRange ? `Your income bracket: ${userProfile.incomeRange}` : undefined,
    });
  }

  // Custom conditions
  if (eligibility.customConditions) {
    eligibility.customConditions.forEach((c) => {
      criteriaList.push({
        title: 'Statutory Guideline',
        desc: c,
        isMatched: true,
      });
    });
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Who May Qualify? (Eligibility Criteria)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified conditions extracted from official government scheme gazettes.
          </p>
        </div>

        {userProfile && (
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold self-start sm:self-auto">
            Live Profile Calibration
          </span>
        )}
      </div>

      {/* Conditions Checklist Items */}
      <div className="space-y-3">
        {criteriaList.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
              item.isMatched
                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  item.isMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-200 text-amber-800'
                }`}
              >
                {item.isMatched ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <AlertCircle className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {item.title}
                  </span>
                  {item.userValue && (
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                      {item.userValue}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-100/70 text-[11px] text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Official verifications may require uploading income, caste, or domicile certificates during final application on the government portal.</span>
      </div>
    </div>
  );
};
