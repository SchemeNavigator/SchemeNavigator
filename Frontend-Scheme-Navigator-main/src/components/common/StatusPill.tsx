import React from 'react';
import { SchemeCategory, ApplicationStatus } from '../../types';
import {
  GraduationCap,
  Sprout,
  Briefcase,
  HeartHandshake,
  UserCheck,
  Home,
  ShieldPlus,
  Users,
  Lightbulb,
  Coins,
  ShieldCheck,
} from 'lucide-react';

interface StatusPillProps {
  type: 'category' | 'status' | 'level' | 'verified';
  value: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  type,
  value,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (type === 'verified') {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300/80 rounded-full shadow-2xs ${sizeClasses} ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Verified Department Info</span>
      </span>
    );
  }

  if (type === 'level') {
    const isCentral = value === 'Central';
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClasses} ${
          isCentral
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-purple-50 text-purple-800 border-purple-200'
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isCentral ? 'bg-blue-600' : 'bg-purple-600'}`} />
        <span>{value} Scheme</span>
      </span>
    );
  }

  if (type === 'status') {
    const getStatusStyle = (st: string) => {
      switch (st as ApplicationStatus) {
        case 'Completed':
          return 'bg-emerald-50 text-emerald-800 border-emerald-300';
        case 'Applied Externally':
          return 'bg-blue-50 text-blue-800 border-blue-300';
        case 'Ready to Apply':
          return 'bg-teal-50 text-teal-800 border-teal-300';
        case 'Documents Needed':
          return 'bg-amber-50 text-amber-800 border-amber-300';
        case 'Exploring':
        default:
          return 'bg-slate-100 text-slate-700 border-slate-300';
      }
    };

    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getStatusStyle(value)} ${sizeClasses} ${className}`}>
        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
        <span>{value}</span>
      </span>
    );
  }

  // Category Pills
  const getCategoryIcon = (cat: SchemeCategory) => {
    switch (cat) {
      case 'Education':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-700" />;
      case 'Agriculture':
        return <Sprout className="w-3.5 h-3.5 text-emerald-700" />;
      case 'Business':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-700" />;
      case 'Women & Child':
        return <HeartHandshake className="w-3.5 h-3.5 text-rose-700" />;
      case 'Employment':
        return <UserCheck className="w-3.5 h-3.5 text-teal-700" />;
      case 'Housing':
        return <Home className="w-3.5 h-3.5 text-amber-700" />;
      case 'Healthcare':
        return <ShieldPlus className="w-3.5 h-3.5 text-red-700" />;
      case 'Social Security':
        return <Users className="w-3.5 h-3.5 text-purple-700" />;
      case 'Skill Development':
        return <Lightbulb className="w-3.5 h-3.5 text-cyan-700" />;
      case 'Financial Assistance':
      default:
        return <Coins className="w-3.5 h-3.5 text-yellow-700" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'Education':
        return 'bg-blue-50/90 text-blue-900 border-blue-200';
      case 'Agriculture':
        return 'bg-emerald-50/90 text-emerald-900 border-emerald-200';
      case 'Business':
        return 'bg-indigo-50/90 text-indigo-900 border-indigo-200';
      case 'Women & Child':
        return 'bg-rose-50/90 text-rose-900 border-rose-200';
      case 'Employment':
        return 'bg-teal-50/90 text-teal-900 border-teal-200';
      case 'Housing':
        return 'bg-amber-50/90 text-amber-900 border-amber-200';
      case 'Healthcare':
        return 'bg-red-50/90 text-red-900 border-red-200';
      case 'Social Security':
        return 'bg-purple-50/90 text-purple-900 border-purple-200';
      case 'Skill Development':
        return 'bg-cyan-50/90 text-cyan-900 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border shadow-2xs ${getCategoryBg(
        value
      )} ${sizeClasses} ${className}`}
    >
      {getCategoryIcon(value as SchemeCategory)}
      <span>{value}</span>
    </span>
  );
};
