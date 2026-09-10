import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ALL_SCHEMES } from '../data/allSchemes';
import { Scheme, SchemeCategory } from '../types';
import { SCHEME_CATEGORIES, INDIAN_STATES } from '../constants';
import { StatusPill } from '../components/common/StatusPill';
import { useTranslation } from '../hooks/useTranslation';
import {
  Search,
  Bookmark,
  ArrowRight,
  Building,
  MapPin,
  X,
  Compass,
} from 'lucide-react';
import { isSchemeSaved, toggleSaveScheme } from '../services/storageService';

export const ExplorePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialState = searchParams.get('state') || 'All India';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [, setForceUpdate] = useState(0);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, selectedCategory, selectedState, selectedLevel]);

  const handleSaveToggle = (e: React.MouseEvent, schemeId: string) => {
    e.preventDefault();
    toggleSaveScheme(schemeId);
    setForceUpdate((p) => p + 1);
  };

  const filteredSchemes = useMemo(() => {
    return ALL_SCHEMES.filter((scheme) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        scheme.name.toLowerCase().includes(q) ||
        scheme.tagline.toLowerCase().includes(q) ||
        scheme.shortDescription.toLowerCase().includes(q) ||
        scheme.verification?.ministryOrAuthority?.toLowerCase().includes(q) ||
        (Array.isArray(scheme.tags) && scheme.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesCat =
        selectedCategory === 'All' || scheme.category === selectedCategory;

      const matchesState =
        selectedState === 'All India' ||
        scheme.coveredStates.includes('All India') ||
        scheme.coveredStates.includes(selectedState);

      const matchesLevel =
        selectedLevel === 'All' || scheme.level === selectedLevel;

      return matchesSearch && matchesCat && matchesState && matchesLevel;
    });
  }, [searchQuery, selectedCategory, selectedState, selectedLevel]);

  const displayedSchemes = useMemo(() => {
    return filteredSchemes.slice(0, visibleCount);
  }, [filteredSchemes, visibleCount]);

  return (
    <div className="bg-slate-50/80 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>National Scheme Directory</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('explore.title')}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/85 leading-relaxed">
              {t('explore.subtitle')}
            </p>
          </div>

          <Link
            to="/survey"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950/40 shrink-0 self-start md:self-center transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>{t('hero.checkEligibility')}</span>
          </Link>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Bar */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('explore.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* State Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
              >
                <option value="All India">All States / All India</option>
                {INDIAN_STATES.filter((s) => s !== 'All India').map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
              >
                <option value="All">All Levels (Central & State)</option>
                <option value="Central">Central Govt Schemes</option>
                <option value="State">State Govt Schemes</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              All Categories (3000+)
            </button>

            {SCHEME_CATEGORIES.map((cat) => {
              const count = ALL_SCHEMES.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {cat} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>
            Found <strong className="text-slate-900">{filteredSchemes.length}</strong> verified government {filteredSchemes.length === 1 ? 'scheme' : 'schemes'}
          </span>
          {(selectedCategory !== 'All' || selectedState !== 'All India' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedState('All India');
                setSelectedLevel('All');
                setSearchQuery('');
              }}
              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Directory Grid */}
        {filteredSchemes.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedSchemes.map((scheme) => {
                const isSaved = isSchemeSaved(scheme.id || scheme.slug);
                const mainBenefit = Array.isArray(scheme.benefits) ? scheme.benefits[0] : null;

                return (
                  <div
                    key={scheme.id || scheme.slug}
                    className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-teal-400"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <StatusPill type="category" value={scheme.category} size="sm" />
                        <div className="flex items-center gap-1.5">
                          <StatusPill type="level" value={scheme.level} size="sm" />
                          <button
                            onClick={(e) => handleSaveToggle(e, scheme.id || scheme.slug)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? 'bg-teal-50 border-teal-300 text-teal-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                            }`}
                            title="Save scheme"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-700' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors leading-snug line-clamp-2">
                        <Link to={`/schemes/${scheme.slug}`}>{scheme.name}</Link>
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{scheme.verification?.ministryOrAuthority || 'Government of India'}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {scheme.shortDescription || scheme.tagline}
                      </p>

                      {mainBenefit && (
                        <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
                          <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                            Benefit Value:
                          </span>
                          <div className="font-bold text-slate-900 text-xs mt-0.5 truncate">
                            {mainBenefit.amountOrValue || mainBenefit.title || mainBenefit.description}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[120px]">
                          {Array.isArray(scheme.coveredStates) && scheme.coveredStates.includes('All India')
                            ? 'All India'
                            : Array.isArray(scheme.coveredStates)
                            ? scheme.coveredStates.join(', ')
                            : 'All India'}
                        </span>
                      </div>

                      <Link
                        to={`/schemes/${scheme.slug}`}
                        className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 group-hover:translate-x-0.5 transition-all"
                      >
                        <span>{t('explore.viewDetails')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSchemes.length > visibleCount && (
              <div className="text-center pt-4 pb-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                  className="px-8 py-3.5 bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-teal-900/20 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Load More Schemes</span>
                  <span className="text-teal-200 text-xs">
                    (Showing {visibleCount} of {filteredSchemes.length})
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">No schemes found matching your search</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or resetting category filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedState('All India');
                setSelectedLevel('All');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
