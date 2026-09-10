import React from 'react';
import { ExternalLink, ShieldCheck, AlertTriangle, X, CheckSquare } from 'lucide-react';
import { Scheme } from '../../types';

interface ExternalPortalModalProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExternalPortalModal: React.FC<ExternalPortalModalProps> = ({
  scheme,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !scheme) return null;

  const handleProceed = () => {
    window.open(scheme.verification.officialPortalUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white p-5 pr-12 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Government Portal Exit</span>
          </div>
          <h3 className="text-lg font-bold leading-snug">
            Continuing to Official Application Channel
          </h3>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-medium text-slate-700 block mb-0.5">Destination Scheme:</span>
            <div className="font-bold text-slate-900 text-base">{scheme.name}</div>
            <div className="text-xs text-teal-800 font-medium mt-1 flex items-center gap-1">
              <span>Managed by:</span>
              <span className="text-slate-800">{scheme.verification.ministryOrAuthority}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span>Target Website:</span>
              <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {scheme.verification.officialPortalUrl}
              </span>
            </div>
          </div>

          <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice:</strong> You are now leaving SchemeNavigator. Application submission, document verification, and benefits approval take place exclusively on the official government website.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
              <span>Recommended Quick Pre-flight Checklist:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Keep your Aadhaar linked mobile number handy for OTP verification.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Prepare scanned copies of mandatory documents under 200KB / 2MB.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Never pay any unofficial third party agent or private middlemen.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Stay on SchemeNavigator
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-900/20 hover:shadow-lg transition-all"
          >
            <span>Go to Official Portal</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
