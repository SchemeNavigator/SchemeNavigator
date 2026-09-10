import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSchemeById, getSchemeBySlug, getRelatedSchemes } from '../data/allSchemes';
import { getSavedProfile, toggleSaveScheme, isSchemeSaved } from '../services/storageService';
import { SchemeDetailHero } from '../components/schemes/SchemeDetailHero';
import { BenefitCard } from '../components/schemes/BenefitCard';
import { EligibilityChecklist } from '../components/schemes/EligibilityChecklist';
import { ExplainabilityBox } from '../components/schemes/ExplainabilityBox';
import { DocumentList } from '../components/schemes/DocumentList';
import { ApplicationTimeline } from '../components/schemes/ApplicationTimeline';
import { ExternalPortalModal } from '../components/common/ExternalPortalModal';
import { StatusPill } from '../components/common/StatusPill';
import {
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';



export const SchemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setForceUpdate] = useState(0);

  const scheme = id ? (getSchemeBySlug(id) || getSchemeById(id)) : undefined;
  const userProfile = getSavedProfile();

  if (!scheme) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 max-w-md shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Scheme Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested scheme may have been archived or updated in our catalog.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl"
          >
            <span>Explore All Schemes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const related = getRelatedSchemes(scheme.id, 3);

  const handleSaveToggle = () => {
    toggleSaveScheme(scheme.id);
    setForceUpdate((prev) => prev + 1);
  };

  return (
    <div className="bg-slate-50/80 min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-teal-900 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Schemes</span>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/explore" className="hover:underline">Schemes</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-[200px]">{scheme.shortName || scheme.name}</span>
          </div>
        </div>

        {/* 1. Scheme Hero with Verified Metadata */}
        <SchemeDetailHero
          scheme={scheme}
          onOpenApplyModal={() => setIsModalOpen(true)}
          onSaveToggle={handleSaveToggle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 2. What Is This Scheme? (Plain Language Explanation) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Plain Language Summary
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  What Is This Scheme?
                </h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {scheme.detailedDescription}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {scheme.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Key Benefits Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Key Scheme Benefits
                </h3>
                <p className="text-xs text-slate-500">
                  Direct financial support, subsidies, or institutional entitlements provided under this scheme.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scheme.benefits.map((benefit, idx) => (
                  <BenefitCard key={idx} benefit={benefit} />
                ))}
              </div>
            </div>

            {/* 4. Who May Qualify? (Eligibility Checklist) */}
            <EligibilityChecklist scheme={scheme} userProfile={userProfile} />

            {/* 5. Documents You May Need */}
            <DocumentList documents={scheme.documents} />

            {/* 6. Step-by-Step Application Roadmap */}
            <ApplicationTimeline
              scheme={scheme}
              onOpenApplyModal={() => setIsModalOpen(true)}
            />
          </div>

          {/* Sidebar Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            {/* Explainability Box ("Why It Was Recommended To You") */}
            <ExplainabilityBox scheme={scheme} userProfile={userProfile} />

            {/* Official Source & Verification Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Information Authenticity</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-400 block">Department:</span>
                  <span className="font-bold text-slate-900 text-sm">{scheme.verification.sourceDepartment}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Official Website:</span>
                  <a
                    href={scheme.verification.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-teal-800 hover:underline break-all"
                  >
                    {scheme.verification.officialPortalUrl}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Last Verified Date:</span>
                  <span className="font-medium text-slate-800">{scheme.verification.lastUpdated}</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Related Schemes */}
            {related.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Similar Schemes to Explore
                </h4>

                <div className="space-y-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/schemes/${rel.slug}`}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-200 block transition-all group"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <StatusPill type="category" value={rel.category} size="sm" />
                        <span className="text-[10px] text-slate-500 font-medium">{rel.level}</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1">
                        {rel.name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* External Official Portal Confirmation Modal */}
      <ExternalPortalModal
        scheme={scheme}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
