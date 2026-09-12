import React from 'react';
import { SCHEME_CATEGORIES, INDIAN_STATES, DEFAULT_CATEGORY_COUNTS } from '../../constants';
import { Search, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface SchemeFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedState: string;
  onStateChange: (st: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  minMatchScore?: number;
  onMinScoreChange?: (score: number) => void;
  showMatchFilter?: boolean;
  categoryCounts?: Record<string, number>;
}

export const SchemeFilterBar: React.FC<SchemeFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedState,
  onStateChange,
  sortBy,
  onSortChange,
  minMatchScore = 0,
  onMinScoreChange,
  showMatchFilter = false,
  categoryCounts = DEFAULT_CATEGORY_COUNTS,
}) => {
  const { t, tCategory, tState } = useTranslation();

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedState !== 'All India' ||
    (minMatchScore > 0 && showMatchFilter);

  const clearAllFilters = () => {
    onSearchChange('');
    onCategoryChange('All');
    onStateChange('All India');
    if (onMinScoreChange) onMinScoreChange(0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
      {/* Top Search & Primary Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Bar */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('explore.search_placeholder', undefined, 'Search schemes by name, keyword, or ministry (e.g. Kisan, Scholarship, Loan)...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* State Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
          >
            <option value="All India" className="dark:bg-slate-800 dark:text-white">{t('explore.all_india', undefined, 'All India / Any State')}</option>
            {INDIAN_STATES.filter((s) => s !== 'All India').map((st) => (
              <option key={st} value={st} className="dark:bg-slate-800 dark:text-white">
                {tState(st)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
          >
            <option value="relevance" className="dark:bg-slate-800 dark:text-white">{t('explore.sort_relevance', undefined, 'Most Relevant / Best Match')}</option>
            <option value="highest_match" className="dark:bg-slate-800 dark:text-white">{t('explore.sort_highest_match', undefined, 'Highest Match Score')}</option>
            <option value="popular" className="dark:bg-slate-800 dark:text-white">{t('explore.sort_popular', undefined, 'Most Popular')}</option>
            <option value="alphabetical" className="dark:bg-slate-800 dark:text-white">{t('explore.sort_alphabetical', undefined, 'Alphabetical (A-Z)')}</option>
          </select>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
        {(() => {
          const allCategoriesTotal =
            Object.values(categoryCounts).reduce(
              (acc, c) => acc + (typeof c === 'number' ? c : 0),
              0
            );

          return (
            <button
              onClick={() => onCategoryChange('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750'
              }`}
            >
              <span>{t('explore.all_categories', undefined, 'All Categories')}</span>
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
          );
        })()}

        {SCHEME_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750'
              }`}
            >
              <span>{tCategory(cat)}</span>
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === cat ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Match Score Threshold Slider (for Recommendations view) */}
      {showMatchFilter && onMinScoreChange && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 dark:text-slate-300">{t('recommendations.filter_min_match', undefined, 'Filter by Min Match %:')}</span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minMatchScore}
              onChange={(e) => onMinScoreChange(parseInt(e.target.value, 10))}
              className="accent-teal-700 cursor-pointer"
            />
            <span className="font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              {minMatchScore > 0 ? `≥ ${minMatchScore}%` : t('common.all_scores', undefined, 'All Scores')}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('explore.reset_filters', undefined, 'Reset Filters')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
