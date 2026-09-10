import React from 'react';
import { ShieldAlert, Scale, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-slate-50/80 min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            <Scale className="w-3.5 h-3.5 text-teal-700" />
            <span>Legal Notice & Terms</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Terms of Guidance & Service
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Please read these terms explaining the scope of SchemeNavigator's informational guidance services.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Important Notice:</strong>
              SchemeNavigator provides navigational guidance based on publicly notified scheme guidelines. Final eligibility determinations, application processing, and benefits transfers are executed exclusively by the respective government department or state nodal agency.
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">1. Scope of Service</h3>
              <p className="text-slate-600">
                SchemeNavigator is an independent discovery platform. We do not act as an official government intermediary, representative, or broker. Use of our service does not guarantee scheme admission or monetary approval.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">2. Accuracy of Scheme Information</h3>
              <p className="text-slate-600">
                While we continuously audit and verify guidelines against official ministry publications and gazettes, government policies and fund allocations may change. Users should verify requirements on the official portal before incurring expenses.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">3. Third-Party Portals & Security</h3>
              <p className="text-slate-600">
                We provide direct navigation links to verified .gov.in and .nic.in domains. SchemeNavigator is not responsible for the uptime, technical maintenance, or privacy practices of external government web services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
