import React from 'react';
import { Link } from 'react-router-dom';

interface CompassLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  isAnimated?: boolean;
}

export const CompassLogo: React.FC<CompassLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  isAnimated = false,
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textStyles = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group ${className}`}>
      {/* Compass Icon Badge */}
      <div className={`relative ${iconDimensions[size]} rounded-xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-1.5 shadow-md shadow-teal-900/20 border border-teal-600/30 flex items-center justify-center transition-transform group-hover:scale-105`}>
        {/* Radar Ring Glow */}
        <div className="absolute inset-0 rounded-xl bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xs" />
        
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-full h-full text-teal-100 ${isAnimated ? 'animate-spin-slow' : 'group-hover:rotate-45 transition-transform duration-700 ease-out'}`}
        >
          <circle cx="12" cy="12" r="9.5" className="stroke-teal-300/40" />
          <line x1="12" y1="2.5" x2="12" y2="5" className="stroke-emerald-300" strokeWidth="2" />
          <line x1="12" y1="19" x2="12" y2="21.5" className="stroke-teal-400/50" />
          <line x1="2.5" y1="12" x2="5" y2="12" className="stroke-teal-400/50" />
          <line x1="19" y1="12" x2="21.5" y2="12" className="stroke-teal-400/50" />
          {/* Compass Needle */}
          <polygon
            points="16.24 7.76 13.5 13.5 7.76 16.24 10.5 10.5 16.24 7.76"
            className="fill-emerald-400 stroke-emerald-300"
            strokeWidth="1.2"
          />
          <circle cx="12" cy="12" r="1.5" className="fill-white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className={`font-bold tracking-tight text-slate-900 ${textStyles[size]}`}>
              Scheme<span className="text-teal-700">Navigator</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 rounded border border-emerald-200">
              INDIA
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[11px] font-medium text-slate-700 tracking-wide -mt-1 hidden md:block">
              Simplified Citizen Guidance
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
