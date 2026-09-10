import React, { useState, useEffect, useRef } from 'react';
import { getSavedProfile, getSavedSchemeIds, getTrackerItems, getAuthUser, updateTrackerStatus } from '../services/storageService';
import { ALL_SCHEMES } from '../data/allSchemes';
import { Scheme } from '../types';
import { ProfileCompletionCard } from '../components/dashboard/ProfileCompletionCard';
import { GuidanceTracker } from '../components/dashboard/GuidanceTracker';
import { SavedSchemesManager } from '../components/dashboard/SavedSchemesManager';
import { Link } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  CheckCircle2,
} from 'lucide-react';


export const DashboardPage: React.FC = () => {

  const [profile, setProfile] = useState(getSavedProfile());
  const [savedIds, setSavedIds] = useState(getSavedSchemeIds());
  const [trackerItems, setTrackerItems] = useState(getTrackerItems());
  const [authUser, setAuthUser] = useState(getAuthUser());
  const [draggedScheme, setDraggedScheme] = useState<Scheme | null>(null);
  const trackerRef = useRef<HTMLDivElement>(null);

  const refreshData = () => {
    setProfile(getSavedProfile());
    setSavedIds(getSavedSchemeIds());
    setTrackerItems(getTrackerItems());
    setAuthUser(getAuthUser());
  };

  const handleDragStart = (scheme: Scheme) => {
    setDraggedScheme(scheme);
    // Scroll the tracker into view so the user can see the drop zone
    setTimeout(() => {
      trackerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  };

  const handleDragEnd = () => {
    setDraggedScheme(null);
  };

  const handleDropScheme = (partial: Scheme) => {
    const scheme = ALL_SCHEMES.find((s) => s.id === partial.id);
    if (!scheme) return;
    // Check not already tracked
    const alreadyTracked = trackerItems.some((t) => t.schemeId === scheme.id);
    if (alreadyTracked) return;
    updateTrackerStatus(scheme.id, scheme.name, scheme.category, 'Exploring');
    refreshData();
    setDraggedScheme(null);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('sn_saved_updated', refreshData);
    window.addEventListener('sn_tracker_updated', refreshData);
    window.addEventListener('sn_profile_updated', refreshData);
    return () => {
      window.removeEventListener('sn_saved_updated', refreshData);
      window.removeEventListener('sn_tracker_updated', refreshData);
      window.removeEventListener('sn_profile_updated', refreshData);
    };
  }, []);

  const savedSchemes = ALL_SCHEMES.filter((s) => savedIds.includes(s.id));

  return (
    <div className="bg-slate-50/80 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {authUser?.name || profile?.name || 'User'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your personal profile signals, bookmarked schemes, and application progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>View Recommendations</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Recommended Matches</span>
              <Compass className="w-4 h-4 text-teal-700" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {ALL_SCHEMES.length}+
            </div>
            <span className="text-[11px] text-emerald-700 font-medium block">
              Based on active profile
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Saved Schemes</span>
              <Bookmark className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {savedSchemes.length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Shortlisted for review
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Application Milestones</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {trackerItems.length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Schemes in guidance tracker
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Profile Status</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              85%
            </div>
            <span className="text-[11px] text-teal-700 font-medium block">
              Calibrated for accuracy
            </span>
          </div>
        </div>

        {/* 1. Profile Completion Card */}
        <ProfileCompletionCard profile={profile} />

        {/* 2. Guidance & Application Tracker */}
        <div ref={trackerRef} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <GuidanceTracker
            items={trackerItems}
            onRefresh={refreshData}
            isDragActive={draggedScheme !== null}
            onDropScheme={handleDropScheme}
          />
        </div>

        {/* 3. Saved Schemes Section */}
        <div id="saved" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <SavedSchemesManager
            schemes={savedSchemes}
            onRefresh={refreshData}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>
    </div>
  );
};
