import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Scheme } from '../types';
import { SCHEME_CATEGORIES, INDIAN_STATES, DEFAULT_CATEGORY_COUNTS } from '../constants';
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
  Loader2,
} from 'lucide-react';
import { isSchemeSaved, toggleSaveScheme } from '../services/storageService';
import { translateSchemeContent } from '../utils/schemeTranslator';

export const ExplorePage: React.FC = () => {
  const { t, tCategory, tState, langCode } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialState = searchParams.get('state') || 'All India';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(DEFAULT_CATEGORY_COUNTS);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [, setForceUpdate] = useState(0);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    setPage(1);
  };

  const handleLevelChange = (lvl: string) => {
    setSelectedLevel(lvl);
    setPage(1);
  };

  const handleSaveToggle = (e: React.MouseEvent, scheme: Scheme) => {
    e.preventDefault();
    toggleSaveScheme(scheme);
    setForceUpdate((p) => p + 1);
  };

  const fetchSchemes = useCallback(
    async (currentPage: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.getSchemes({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          state: selectedState !== 'All India' ? selectedState : undefined,
          search: debouncedSearch || undefined,
          page: currentPage,
        });

        if (res?.categoryCounts) {
          setCategoryCounts(res.categoryCounts);
        }

        if (res?.schemes) {
          let list = res.schemes;
          if (selectedLevel !== 'All') {
            list = list.filter((s) => s.level === selectedLevel);
          }
          if (append) {
            setSchemes((prev) => [...prev, ...list]);
          } else {
            setSchemes(list);
          }
          setTotalCount(res.pagination?.total ?? list.length);
          setTotalPages(res.pagination?.totalPages ?? 1);
        }
      } catch (err) {
        console.error('Failed to fetch schemes:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, selectedState, debouncedSearch, selectedLevel]
  );

  useEffect(() => {
    fetchSchemes(page, page > 1);
  }, [fetchSchemes, page]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const allCategoriesTotal = useMemo(() => {
    const sum = Object.values(categoryCounts).reduce(
      (acc, c) => acc + (typeof c === 'number' ? c : 0),
      0
    );
    return sum;
  }, [categoryCounts]);

  const displayedSchemes = useMemo(() => {
    if (selectedLevel === 'All') return schemes;
    return schemes.filter((s) => s.level === selectedLevel);
  }, [schemes, selectedLevel]);

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-6 sm:py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>{t('explore.title')}</span>
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Bar */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('explore.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* State Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
              >
                <option value="All India" className="dark:bg-slate-800 dark:text-white">{tState('All India')}</option>
                {INDIAN_STATES.filter((s) => s !== 'All India').map((st) => (
                  <option key={st} value={st} className="dark:bg-slate-800 dark:text-white">
                    {tState(st)}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-800 dark:text-white">{t('explore.allLevels')}</option>
                <option value="Central" className="dark:bg-slate-800 dark:text-white">{t('explore.central')}</option>
                <option value="State" className="dark:bg-slate-800 dark:text-white">{t('explore.state')}</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
            <button
              onClick={() => handleCategoryChange('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              <span>{t('explore.allCategories')}</span>
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === 'All'
                    ? 'bg-teal-700 text-teal-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {allCategoriesTotal}
              </span>
            </button>

            {SCHEME_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat];
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-800 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tCategory(cat)}</span>
                  {count !== undefined && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat
                        ? 'bg-teal-700 text-teal-100'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
          <span>
            {t('explore.showingCount', { count: displayedSchemes.length, total: totalCount })}
          </span>
          {(selectedCategory !== 'All' || selectedState !== 'All India' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedState('All India');
                setSelectedLevel('All');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold cursor-pointer"
            >
              {t('explore.resetFilters')}
            </button>
          )}
        </div>

        {/* Directory Grid */}
        {loading && schemes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4 h-64"
              >
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded-md w-full"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded-md w-5/6"></div>
              </div>
            ))}
          </div>
        ) : displayedSchemes.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedSchemes.map((rawScheme) => {
                const scheme = translateSchemeContent(rawScheme, langCode);
                const isSaved = isSchemeSaved(scheme.id || scheme.slug);
                const mainBenefit = Array.isArray(scheme.benefits) ? scheme.benefits[0] : null;

                return (
                  <div
                    key={scheme.id || scheme.slug}
                    className="rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-teal-400 dark:hover:border-teal-600"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <StatusPill type="category" value={scheme.category} size="sm" />
                        <div className="flex items-center gap-1.5">
                          <StatusPill type="level" value={scheme.level} size="sm" />
                          <button
                            onClick={(e) => handleSaveToggle(e, scheme)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title="Save scheme"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-700 dark:fill-teal-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-800 dark:group-hover:text-teal-400 transition-colors leading-snug line-clamp-2">
                        <Link to={`/schemes/${scheme.slug || scheme.id}`}>{scheme.name}</Link>
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{scheme.verification?.ministryOrAuthority || 'Government of India'}</span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {scheme.shortDescription || scheme.tagline}
                      </p>

                      {mainBenefit && (
                        <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/60">
                          <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                            {t('explore.benefits')}
                          </span>
                          <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 truncate">
                            {mainBenefit.amountOrValue || mainBenefit.title || mainBenefit.description}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[120px]">
                          {Array.isArray(scheme.coveredStates) && scheme.coveredStates.includes('All India')
                            ? tState('All India')
                            : Array.isArray(scheme.coveredStates)
                            ? scheme.coveredStates.map((s: string) => tState(s)).join(', ')
                            : tState('All India')}
                        </span>
                      </div>

                      <Link
                        to={`/schemes/${scheme.slug || scheme.id}`}
                        className="inline-flex items-center gap-1 font-bold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-300 group-hover:translate-x-0.5 transition-all"
                      >
                        <span>{t('explore.viewDetails')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {page < totalPages && (
              <div className="text-center pt-4 pb-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-teal-900/20 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>{t('explore.loadMore')}</span>
                      <span className="text-teal-200 text-xs">
                        ({t('explore.showingCount', { count: displayedSchemes.length, total: totalCount })})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">{t('explore.noResults')}</h3>
            <p className="text-xs text-slate-500">{t('explore.noResults')}</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedState('All India');
                setSelectedLevel('All');
                setSearchQuery('');
                setPage(1);
              }}
              className="px-5 py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('explore.resetFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

