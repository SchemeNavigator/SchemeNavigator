import React from 'react';
import { SchemeMatchResult } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { MatchScoreBadge } from '../common/MatchScoreBadge';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { isSchemeSaved, toggleSaveScheme } from '../../services/storageService';

interface SchemeCardProps {
  matchResult: SchemeMatchResult;
  onSaveChange?: () => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ matchResult, onSaveChange }) => {
  const { scheme, matchScore, matchGrade, matchedReasons, unmatchedWarnings, factors } = matchResult;
  const isSaved = isSchemeSaved(scheme.id);
  const mainBenefit = scheme.benefits[0];

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleSaveScheme(scheme.id);
    if (onSaveChange) onSaveChange();
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-teal-400">
      <div className="space-y-4">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusPill type="category" value={scheme.category} size="sm" />
            <StatusPill type="level" value={scheme.level} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <MatchScoreBadge score={matchScore} grade={matchGrade} factors={factors} size="sm" />
            <button
              onClick={handleToggle}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Saved to bookmarks' : 'Save scheme'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scheme Name & Department */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors leading-snug">
            <Link to={`/schemes/${scheme.slug}`}>{scheme.name}</Link>
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{scheme.verification.ministryOrAuthority}</span>
          </div>
        </div>

        {/* Tagline / Plain Language Summary */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {scheme.shortDescription}
        </p>

        {/* Primary Benefit Callout */}
        {mainBenefit && (
          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                Primary Benefit
              </span>
              <span className="font-bold text-slate-900 text-sm block">
                {mainBenefit.amountOrValue || mainBenefit.title}
              </span>
              <span className="text-[11px] text-slate-600 line-clamp-1">
                {mainBenefit.description}
              </span>
            </div>
            <span className="px-2 py-1 rounded-lg bg-teal-100/80 text-[10px] font-semibold text-teal-900 shrink-0">
              {mainBenefit.type}
            </span>
          </div>
        )}

        {/* "Why This Matches" Explainability Signals */}
        {matchedReasons.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Why this scheme appears relevant:
            </span>
            <ul className="space-y-1 text-xs text-slate-700">
              {matchedReasons.map((reason, rIdx) => (
                <li key={rIdx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings / Special note if any */}
        {unmatchedWarnings.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-tight">{unmatchedWarnings[0]}</span>
          </div>
        )}
      </div>

      {/* Footer CTAs */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{scheme.coveredStates.includes('All India') ? 'All India' : scheme.coveredStates.join(', ')}</span>
        </div>

        <Link
          to={`/schemes/${scheme.slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all group-hover:scale-102"
        >
          <span>View Scheme Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
