import React, { useState } from 'react';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { MatchFactor } from '../../types';

interface MatchScoreBadgeProps {
  score: number;
  grade?: string;
  size?: 'sm' | 'md' | 'lg';
  factors?: MatchFactor[];
  showDetails?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  grade,
  size = 'md',
  factors = [],
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getScoreTheme = (val: number) => {
    if (val >= 85) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-500/20',
        bar: 'bg-emerald-600',
        glow: 'text-emerald-700',
        label: 'High Potential Match',
      };
    }
    if (val >= 70) {
      return {
        bg: 'bg-teal-50 text-teal-800 border-teal-300 ring-teal-500/20',
        bar: 'bg-teal-600',
        glow: 'text-teal-700',
        label: 'Good Compatibility',
      };
    }
    if (val >= 50) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20',
        bar: 'bg-amber-500',
        glow: 'text-amber-700',
        label: 'Moderate Match',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-400/20',
      bar: 'bg-slate-500',
      glow: 'text-slate-700',
      label: 'General Match',
    };
  };

  const theme = getScoreTheme(score);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base font-semibold',
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-2 rounded-full border font-medium shadow-xs ring-2 transition-all cursor-pointer select-none ${theme.bg} ${sizeClasses[size]}`}
      >
        {/* Visual percentage ring or dot */}
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.bar}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.bar}`} />
        </span>

        <span className="font-bold tracking-tight">{score}% Profile Match</span>
        {grade && <span className="hidden sm:inline text-xs opacity-85 font-normal">• {grade}</span>}
        <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
      </div>

      {/* Interactive Explainability Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 sm:w-80 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Match Scoring Breakdown</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
              Score: {score}/100
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed mb-2.5">
            This score represents how closely your provided profile matches the listed eligibility conditions.
          </p>

          {factors.length > 0 && (
            <div className="space-y-1.5 mb-2.5 pt-1">
              {factors.slice(0, 4).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="truncate pr-2">{f.criterion}</span>
                  <span className={`font-medium ${f.status === 'matched' ? 'text-emerald-400' : f.status === 'mismatch' ? 'text-amber-400' : 'text-slate-400'}`}>
                    +{f.score} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 rounded bg-slate-800/80 text-[11px] text-amber-300/90 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Important: Informational indicator only. Official eligibility and approval are determined by the concerned government authority.</span>
          </div>
        </div>
      )}
    </div>
  );
};
