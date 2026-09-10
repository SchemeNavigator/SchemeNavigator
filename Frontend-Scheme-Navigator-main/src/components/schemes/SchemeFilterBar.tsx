import React from 'react';
import { SchemeCategory } from '../../types';
import { SCHEME_CATEGORIES, INDIAN_STATES } from '../../constants';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

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
}) => {
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
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      {/* Top Search & Primary Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Bar */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search schemes by name, keyword, or ministry (e.g. Kisan, Scholarship, Loan)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
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
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
          >
            <option value="All India">All India / Any State</option>
            {INDIAN_STATES.filter((s) => s !== 'All India').map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-600 rounded-2xl text-xs sm:text-sm font-semibold outline-hidden cursor-pointer"
          >
            <option value="relevance">Most Relevant / Best Match</option>
            <option value="highest_match">Highest Match Score</option>
            <option value="popular">Most Popular</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
        <button
          onClick={() => onCategoryChange('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-teal-800 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
          }`}
        >
          All Categories
        </button>

        {SCHEME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Match Score Threshold Slider (for Recommendations view) */}
      {showMatchFilter && onMinScoreChange && (
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">Filter by Min Match %:</span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minMatchScore}
              onChange={(e) => onMinScoreChange(parseInt(e.target.value, 10))}
              className="accent-teal-700 cursor-pointer"
            />
            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {minMatchScore > 0 ? `≥ ${minMatchScore}%` : 'All Scores'}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
