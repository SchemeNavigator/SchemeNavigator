import React from 'react';
import { ALL_SCHEMES } from '../../data/allSchemes';
import { StatusPill } from '../common/StatusPill';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ExternalLink, Bookmark, Sparkles } from 'lucide-react';
import { isSchemeSaved, toggleSaveScheme } from '../../services/storageService';

export const PopularSchemesSection: React.FC = () => {
  const popularSchemes = ALL_SCHEMES.slice(0, 6);
  const [, setForceUpdate] = React.useState(0);

  const handleSaveToggle = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    toggleSaveScheme(id);
    setForceUpdate((prev) => prev + 1);
  };

  return (
    <section className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-900 text-xs font-bold border border-teal-200">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>National Welfare Spotlight</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Widely Accessed Government Initiatives
            </h2>
            <p className="text-sm text-slate-600">
              Key central and state welfare programs with high citizen enrollment.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:text-teal-950 transition-colors"
          >
            <span>Browse all {ALL_SCHEMES.length}+ schemes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scheme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularSchemes.map((scheme) => {
            const isSaved = isSchemeSaved(scheme.id);
            const mainBenefit = scheme.benefits[0];

            return (
              <div
                key={scheme.id}
                className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusPill type="category" value={scheme.category} size="sm" />
                    <button
                      onClick={(e) => handleSaveToggle(e, scheme.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        isSaved
                          ? 'text-teal-700 bg-teal-50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={isSaved ? 'Remove from Saved' : 'Save scheme'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700' : ''}`} />
                    </button>
                  </div>

                  {/* Title & Department */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1">
                    <Link to={`/schemes/${scheme.slug}`}>{scheme.name}</Link>
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {scheme.verification.ministryOrAuthority}
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-2">
                    {scheme.shortDescription}
                  </p>

                  {/* Main Benefit Box */}
                  {mainBenefit && (
                    <div className="mt-4 p-3 rounded-2xl bg-teal-50/70 border border-teal-100/80">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                        Key Benefit:
                      </span>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">
                        {mainBenefit.amountOrValue || mainBenefit.title}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                        {mainBenefit.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Link */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Source</span>
                  </div>

                  <Link
                    to={`/schemes/${scheme.slug}`}
                    className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 group-hover:translate-x-1 transition-all"
                  >
                    <span>View Scheme</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
