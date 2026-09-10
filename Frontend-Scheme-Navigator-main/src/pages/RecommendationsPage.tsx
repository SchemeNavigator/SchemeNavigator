import React, { useState, useEffect, useMemo } from 'react';
import { getSavedProfile } from '../services/storageService';
import { rankSchemesForProfile } from '../services/matchingEngine';
import { ALL_SCHEMES } from '../data/allSchemes';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { SchemeFilterBar } from '../components/schemes/SchemeFilterBar';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { SchemeCategory, SchemeMatchResult } from '../types';

import {
  Edit3,
  Sparkles,
  Info,
  AlertCircle,
  GraduationCap,
  Sprout,
  Briefcase,
  Home,
  HeartPulse,
  ShieldCheck,
  Banknote,
  Wrench,
  Users,
  ChevronDown,
} from 'lucide-react';

// ─── Occupation → Primary + secondary category priority map ──────────────────
const OCCUPATION_CATEGORY_MAP: Record<string, { primary: SchemeCategory[]; secondary: SchemeCategory[] }> = {
  Student: {
    primary: ['Education', 'Skill Development'],
    secondary: ['Financial Assistance', 'Social Security', 'Healthcare', 'Employment'],
  },
  Farmer: {
    primary: ['Agriculture', 'Financial Assistance'],
    secondary: ['Housing', 'Healthcare', 'Social Security', 'Skill Development'],
  },
  'Business owner': {
    primary: ['Business', 'Employment', 'Skill Development'],
    secondary: ['Financial Assistance', 'Social Security', 'Healthcare'],
  },
  Employed: {
    primary: ['Employment', 'Social Security', 'Financial Assistance'],
    secondary: ['Healthcare', 'Housing', 'Skill Development'],
  },
  Unemployed: {
    primary: ['Employment', 'Skill Development', 'Financial Assistance'],
    secondary: ['Social Security', 'Healthcare', 'Education'],
  },
  'Self-employed': {
    primary: ['Business', 'Employment', 'Financial Assistance'],
    secondary: ['Skill Development', 'Social Security', 'Healthcare'],
  },
  Homemaker: {
    primary: ['Women & Child', 'Social Security', 'Healthcare'],
    secondary: ['Financial Assistance', 'Housing', 'Skill Development'],
  },
  Retired: {
    primary: ['Social Security', 'Healthcare', 'Financial Assistance'],
    secondary: ['Housing', 'Employment'],
  },
  Other: {
    primary: ['Financial Assistance', 'Social Security'],
    secondary: ['Healthcare', 'Education', 'Employment', 'Skill Development'],
  },
};

// Occupation-specific labels for sections
const OCCUPATION_SECTION_LABELS: Record<string, string> = {
  Student: 'Education & Skill Schemes',
  Farmer: 'Agriculture & Farming Schemes',
  'Business owner': 'Business & Entrepreneurship Schemes',
  Employed: 'Employment & Social Security Schemes',
  Unemployed: 'Employment & Upskilling Schemes',
  'Self-employed': 'Business & Self-Employment Schemes',
  Homemaker: 'Women, Child & Welfare Schemes',
  Retired: 'Senior Citizen & Pension Schemes',
  Other: 'General Welfare Schemes',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Education: <GraduationCap className="w-4 h-4 text-blue-700" />,
  Agriculture: <Sprout className="w-4 h-4 text-emerald-700" />,
  Employment: <Wrench className="w-4 h-4 text-cyan-700" />,
  Business: <Briefcase className="w-4 h-4 text-indigo-700" />,
  'Women & Child': <Users className="w-4 h-4 text-rose-600" />,
  Housing: <Home className="w-4 h-4 text-amber-700" />,
  Healthcare: <HeartPulse className="w-4 h-4 text-red-600" />,
  'Social Security': <ShieldCheck className="w-4 h-4 text-teal-700" />,
  'Financial Assistance': <Banknote className="w-4 h-4 text-green-700" />,
  'Skill Development': <Sparkles className="w-4 h-4 text-violet-600" />,
};

interface CategoryGroup {
  label: string;
  isPrimary: boolean;
  results: SchemeMatchResult[];
}

function groupSchemesByOccupation(
  results: SchemeMatchResult[],
  employmentType: string | undefined,
): CategoryGroup[] {
  const occ = (employmentType || 'Other') as keyof typeof OCCUPATION_CATEGORY_MAP;
  const mapping = OCCUPATION_CATEGORY_MAP[occ] || OCCUPATION_CATEGORY_MAP['Other'];

  const primary = mapping.primary as SchemeCategory[];
  const secondary = mapping.secondary as SchemeCategory[];

  const primaryResults = results.filter((r) => primary.includes(r.scheme.category));
  const secondaryResults = results.filter((r) => secondary.includes(r.scheme.category));
  const otherResults = results.filter(
    (r) => !primary.includes(r.scheme.category) && !secondary.includes(r.scheme.category),
  );

  const groups: CategoryGroup[] = [];

  if (primaryResults.length > 0) {
    groups.push({
      label: OCCUPATION_SECTION_LABELS[occ] || 'Most Relevant Schemes',
      isPrimary: true,
      results: primaryResults,
    });
  }

  if (secondaryResults.length > 0) {
    groups.push({
      label: 'Other Potentially Relevant Schemes',
      isPrimary: false,
      results: secondaryResults,
    });
  }

  if (otherResults.length > 0) {
    groups.push({
      label: 'Additional Schemes',
      isPrimary: false,
      results: otherResults,
    });
  }

  return groups;
}

// Collapsible section component for "other" groups
const CollapsibleGroup: React.FC<{ group: CategoryGroup; onSaveChange: () => void }> = ({
  group,
  onSaveChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const preview = group.results.slice(0, 3);
  const rest = group.results.slice(3);
  const visibleItems = expanded ? group.results : preview;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-700">{group.label}</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            {group.results.length} {group.results.length === 1 ? 'scheme' : 'schemes'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((result) => (
          <SchemeCard
            key={result.scheme.id}
            matchResult={result}
            onSaveChange={onSaveChange}
          />
        ))}
      </div>

      {rest.length > 0 && !expanded && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
            <span>Show {rest.length} more {rest.length === 1 ? 'scheme' : 'schemes'} in this category</span>
          </button>
        </div>
      )}
    </div>
  );
};


export const RecommendationsPage: React.FC = () => {
  const [profile, setProfile] = useState(() => getSavedProfile() || {});
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState(profile.state || 'All India');
  const [sortBy, setSortBy] = useState('relevance');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const updated = getSavedProfile();
      if (updated) {
        setProfile(updated);
        setSelectedState(updated.state || 'All India');
      }
    };

    window.addEventListener('sn_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('sn_profile_updated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.getRecommendations(profile).then((res) => {
      if (isMounted && res && res.length > 0) {
        setApiResults(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [profile]);

  // Compute filtered recommendations
  const matchResults = useMemo(() => {
    const sourceList = apiResults.length > 0 ? apiResults : rankSchemesForProfile(profile, ALL_SCHEMES);

    return sourceList.filter((res) => {
      const s = res.scheme;
      if (!s) return false;
      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.verification?.ministryOrAuthority?.toLowerCase().includes(q) ||
        (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(q)));

      const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;

      const matchesState =
        selectedState === 'All India' ||
        s.coveredStates.includes('All India') ||
        s.coveredStates.includes(selectedState);

      const matchesScore = res.matchScore >= minMatchScore;

      return matchesSearch && matchesCat && matchesState && matchesScore;
    });
  }, [apiResults, profile, searchQuery, selectedCategory, selectedState, minMatchScore]);

  // Apply sorting within groups
  const sortedResults = useMemo(() => {
    const list = [...matchResults];
    if (sortBy === 'highest_match') return list.sort((a, b) => b.matchScore - a.matchScore);
    if (sortBy === 'popular') return list.sort((a, b) => b.scheme.popularScore - a.scheme.popularScore);
    if (sortBy === 'alphabetical') return list.sort((a, b) => a.scheme.name.localeCompare(b.scheme.name));
    return list;
  }, [matchResults, sortBy]);

  // Determine effective occupation for grouping (only when no category filter applied)
  const effectiveOccupation = profile.employmentType || profile.employmentStatus || 'Other';
  const isGrouped = selectedCategory === 'All' && searchQuery.trim() === '';

  const categoryGroups = useMemo(() => {
    if (!isGrouped) return null;
    return groupSchemesByOccupation(sortedResults, effectiveOccupation as string);
  }, [isGrouped, sortedResults, effectiveOccupation]);

  const occupationLabel = OCCUPATION_SECTION_LABELS[effectiveOccupation as string] || 'Relevant Schemes';

  return (
    <div className="bg-slate-50/80 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Personalized Recommendations</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Schemes You May Be Eligible For
            </h1>

            {/* Profile Signals Pill */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Active Profile:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                {profile.name || 'User'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                {profile.age || 20} Yrs
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                {profile.state || 'Haryana'} ({profile.areaType || 'Urban'})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                {profile.employmentType || 'Student'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                {profile.incomeRange || '₹1–2.5 lakh'}
              </span>
            </div>
          </div>

          <Link
            to="/survey"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-bold transition-all shrink-0 self-start md:self-center cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-teal-700" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Informational Match Disclaimer */}
        <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-xs text-slate-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>About Match Scores:</strong> The match percentage indicates structural alignment between your profile and publicly listed eligibility criteria. It is an informational navigation guide and does not constitute a government approval.
          </p>
        </div>

        {/* Filter Bar */}
        <SchemeFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          sortBy={sortBy}
          onSortChange={setSortBy}
          minMatchScore={minMatchScore}
          onMinScoreChange={setMinMatchScore}
          showMatchFilter={true}
        />

        {/* Match Count Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>
            Showing <strong className="text-slate-900">{sortedResults.length}</strong> matching potential{' '}
            {sortedResults.length === 1 ? 'scheme' : 'schemes'}
            {isGrouped && (
              <span className="text-slate-400 font-normal ml-1">
                — grouped by relevance to your occupation
              </span>
            )}
          </span>
          {selectedCategory !== 'All' && (
            <span className="text-teal-800">
              Filtered by Category: <strong>{selectedCategory}</strong>
            </span>
          )}
        </div>

        {/* Schemes Results */}
        {sortedResults.length > 0 ? (
          isGrouped && categoryGroups && categoryGroups.length > 0 ? (
            // ── Grouped view: occupation-aware sections ──────────────────────
            <div className="space-y-12">
              {categoryGroups.map((group, idx) => (
                <div key={idx} className="space-y-5">
                  {/* Section header */}
                  <div className={`flex items-center gap-3 pb-3 border-b ${group.isPrimary ? 'border-teal-200' : 'border-slate-200'}`}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      group.isPrimary
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {group.isPrimary
                        ? (CATEGORY_ICONS[
                            (OCCUPATION_CATEGORY_MAP[effectiveOccupation as string] || OCCUPATION_CATEGORY_MAP['Other'])
                              .primary[0]
                          ] || <Sparkles className="w-4 h-4 text-teal-600" />)
                        : null}
                      <span>{group.label}</span>
                    </div>
                  </div>

                  {group.isPrimary ? (
                    // Primary group – all cards visible
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.results.map((result) => (
                        <SchemeCard
                          key={result.scheme.id}
                          matchResult={result}
                          onSaveChange={() => setForceUpdate((p) => p + 1)}
                        />
                      ))}
                    </div>
                  ) : (
                    // Secondary / other groups – collapsible
                    <CollapsibleGroup
                      group={group}
                      onSaveChange={() => setForceUpdate((p) => p + 1)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            // ── Flat view: when filter/search applied ────────────────────────
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResults.map((result) => (
                <SchemeCard
                  key={result.scheme.id}
                  matchResult={result}
                  onSaveChange={() => setForceUpdate((p) => p + 1)}
                />
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-10 sm:p-16 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              No matching schemes found for these filters
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              We couldn't find a strong match based on your current filters. Try resetting the category/state filters or explore all schemes across India.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedState('All India');
                  setMinMatchScore(0);
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
              <Link
                to="/explore"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Explore All Schemes Directory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
