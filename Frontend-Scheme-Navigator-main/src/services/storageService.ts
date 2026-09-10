/**
 * storageService — in-memory only.
 *
 * All user data (profile, saved schemes, tracker items, auth state) is held
 * purely in module-level variables.  Nothing is written to sessionStorage or
 * localStorage.  All data is gone the moment the page is closed or refreshed.
 */

import { UserProfile, TrackerItem, ApplicationStatus, SchemeCategory } from '../types';

// Clear any previously persisted data left by older versions of this app.
(function clearLegacyStorage() {
  try {
    const keys = [
      'sn_user_profile',
      'sn_saved_schemes',
      'sn_tracker_items',
      'sn_auth_user',
      'sn_recent_searches',
      'sn_survey_draft',
      'sn_session_token',
    ];
    keys.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch {
    // ignore — storage may be blocked in some environments
  }
})();

// ── In-memory store ──────────────────────────────────────────────────────────

let _profile: UserProfile | null = null;
let _savedSchemeIds: string[] = [];
let _trackerItems: TrackerItem[] = [];
let _authUser: AuthUser | null = null;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
}

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'deserted';

export const DEFAULT_DEMO_PROFILE: UserProfile = {
  age: 20,
  gender: 'male',
  state: 'Haryana',
  district: 'Gurugram',
  areaType: 'Urban',
  category: 'General',
  isDisability: false,
  isMinority: false,
  hasBPLCard: false,
  employmentType: 'Student',
  studentCourse: 'Bachelor of Technology (B.Tech)',
  incomeRange: '₹1–2.5 lakh',
  completedAt: new Date().toISOString(),
};

// ── User Profile ─────────────────────────────────────────────────────────────

export function getSavedProfile(): UserProfile | null {
  return _profile;
}

export function saveUserProfile(profile: UserProfile): void {
  _profile = { ...profile, completedAt: new Date().toISOString() };
  window.dispatchEvent(new Event('sn_profile_updated'));
}

export function clearUserProfile(): void {
  _profile = null;
  window.dispatchEvent(new Event('sn_profile_updated'));
}

// ── Saved Schemes ─────────────────────────────────────────────────────────────

export function getSavedSchemeIds(): string[] {
  return [..._savedSchemeIds];
}

export function isSchemeSaved(schemeId: string): boolean {
  return _savedSchemeIds.includes(schemeId);
}

export function toggleSaveScheme(schemeId: string): boolean {
  if (_savedSchemeIds.includes(schemeId)) {
    _savedSchemeIds = _savedSchemeIds.filter((id) => id !== schemeId);
    window.dispatchEvent(new Event('sn_saved_updated'));
    return false;
  } else {
    _savedSchemeIds = [..._savedSchemeIds, schemeId];
    window.dispatchEvent(new Event('sn_saved_updated'));
    return true;
  }
}

// ── Application Guidance Tracker ─────────────────────────────────────────────

export function getTrackerItems(): TrackerItem[] {
  return [..._trackerItems];
}

export function updateTrackerStatus(
  schemeId: string,
  schemeName: string,
  category: SchemeCategory,
  status: ApplicationStatus,
  notes?: string
): void {
  const existingIndex = _trackerItems.findIndex((i) => i.schemeId === schemeId);

  if (existingIndex >= 0) {
    _trackerItems = _trackerItems.map((item, idx) =>
      idx === existingIndex
        ? {
            ...item,
            status,
            notes: notes ?? item.notes,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
  } else {
    _trackerItems = [
      {
        id: 'tr-' + Date.now(),
        schemeId,
        schemeName,
        category,
        status,
        notes: notes || 'Started exploring scheme guidance.',
        preparedDocuments: [],
        updatedAt: new Date().toISOString(),
      },
      ..._trackerItems,
    ];
  }

  window.dispatchEvent(new Event('sn_tracker_updated'));
}

export function removeTrackerItem(schemeId: string): void {
  _trackerItems = _trackerItems.filter((i) => i.schemeId !== schemeId);
  window.dispatchEvent(new Event('sn_tracker_updated'));
}

export function saveTrackerItem(item: TrackerItem): void {
  const existingIndex = _trackerItems.findIndex((i) => i.schemeId === item.schemeId);
  if (existingIndex >= 0) {
    _trackerItems = _trackerItems.map((t, idx) =>
      idx === existingIndex ? { ...item, updatedAt: new Date().toISOString() } : t
    );
  } else {
    _trackerItems = [
      { ...item, id: item.id || 'tr-' + Date.now(), updatedAt: new Date().toISOString() },
      ..._trackerItems,
    ];
  }
  window.dispatchEvent(new Event('sn_tracker_updated'));
}

// ── Auth State ────────────────────────────────────────────────────────────────

export function getAuthUser(): AuthUser | null {
  return _authUser;
}

export function setAuthUser(user: AuthUser | null): void {
  _authUser = user;
  window.dispatchEvent(new Event('sn_auth_updated'));
}

export function loginMockUser(name: string = 'User', email: string = 'user@example.com'): AuthUser {
  const user: AuthUser = {
    id: 'usr-101',
    name,
    email,
    isLoggedIn: true,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
  };
  setAuthUser(user);
  return user;
}

export function logoutUser(): void {
  setAuthUser(null);
}

export const logoutMockUser = logoutUser;
