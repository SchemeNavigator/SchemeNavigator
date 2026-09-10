import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DisclaimerBannerProps {
  variant?: 'inline' | 'compact' | 'footer';
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  variant = 'inline',
  className = '',
}) => {
  if (variant === 'compact') {
    return (
      <div className={`p-3 bg-teal-900/5 border border-teal-800/15 rounded-xl flex items-center justify-between text-xs text-slate-700 ${className}`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-teal-800 shrink-0" />
          <span>
            <strong>Informational Guidance Platform:</strong> SchemeNavigator is not a government body. Final eligibility & approval belong to official departments.
          </span>
        </div>
        <Link to="/about" className="text-teal-800 font-semibold hover:underline shrink-0 ml-2 hidden sm:inline">
          Learn More
        </Link>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-slate-900 to-slate-950 text-white py-3 px-4 text-xs ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
            NOTICE
          </span>
          <span className="text-slate-300">
            SchemeNavigator is an independent citizen discovery & guidance navigation layer. Final eligibility, approval, and disbursements are executed by respective Government Ministries.
          </span>
        </div>
        <Link
          to="/about#disclaimer"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap"
        >
          <span>Read Full Mission & Transparency Notice</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
