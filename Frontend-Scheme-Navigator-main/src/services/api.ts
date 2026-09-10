import { UserProfile, SchemeMatchResult, TrackerItem, Scheme } from '../types';
import { HttpApiClient } from './httpClient';
import { ALL_SCHEMES } from '../data/allSchemes';
import { rankSchemesForProfile } from './matchingEngine';
import {
  getSavedProfile,
  saveUserProfile,
  getSavedSchemeIds,
  toggleSaveScheme,
  getTrackerItems,
  saveTrackerItem,
} from './storageService';

// In-memory survey draft — cleared on page close/refresh
let _surveyDraft: { answers: any; currentStep: number } | null = null;

class MockFrontendApiClient {
  // --- Profile & Survey ---
  async getProfile(): Promise<UserProfile | null> {
    return getSavedProfile();
  }

  async getProfileStatus(): Promise<{ exists: boolean; isComplete: boolean; completionPercentage: number }> {
    const prof = getSavedProfile();
    return {
      exists: !!prof,
      isComplete: Boolean(prof?.age && prof?.state),
      completionPercentage: prof ? 100 : 0,
    };
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    saveUserProfile(profile as UserProfile);
    return (getSavedProfile() || profile) as UserProfile;
  }

  async submitSurvey(profile: UserProfile): Promise<{
    profile: UserProfile;
    recommendations: SchemeMatchResult[];
  }> {
    saveUserProfile(profile);
    _surveyDraft = null;
    const recommendations = rankSchemesForProfile(profile, ALL_SCHEMES);
    return { profile, recommendations };
  }

  // --- Draft Management ---
  async getSurveyDraft() {
    return _surveyDraft;
  }

  async saveSurveyDraft(answers: any, currentStep: number) {
    _surveyDraft = { answers, currentStep };
  }

  // --- Recommendations ---
  async getRecommendations(profile?: UserProfile): Promise<SchemeMatchResult[]> {
    const currentProfile = profile || getSavedProfile();
    return rankSchemesForProfile(currentProfile || ({} as any), ALL_SCHEMES);
  }

  // --- Schemes Catalog ---
  async getSchemes(params?: { category?: string; state?: string; search?: string; page?: number }) {
    let filtered = [...ALL_SCHEMES];
    if (params?.category && params.category !== 'All') {
      filtered = filtered.filter((s) => s.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.state && params.state !== 'All India') {
      filtered = filtered.filter(
        (s) => s.coveredStates.includes('All India') || s.coveredStates.includes(params.state!)
      );
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return {
      schemes: filtered,
      pagination: { page: 1, limit: filtered.length, total: filtered.length, totalPages: 1 },
    };
  }

  async getScheme(idOrSlug: string): Promise<Scheme | undefined> {
    return ALL_SCHEMES.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  }

  // --- Saved Schemes ---
  async getSavedSchemes(): Promise<Scheme[]> {
    const savedIds = getSavedSchemeIds();
    return ALL_SCHEMES.filter((s) => savedIds.includes(s.id));
  }

  async saveScheme(schemeId: string) {
    toggleSaveScheme(schemeId);
  }

  async removeSavedScheme(schemeId: string) {
    toggleSaveScheme(schemeId);
  }

  // --- Guidance Applications ---
  async getApplications(): Promise<TrackerItem[]> {
    return getTrackerItems();
  }

  async updateApplication(item: TrackerItem) {
    saveTrackerItem(item);
  }

  // --- AI Assistance ---
  async askAI(query: string): Promise<{ answer: string; referencedSchemes?: any[] }> {
    const matches = ALL_SCHEMES.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some((t) => query.toLowerCase().includes(t)) ||
        s.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);

    if (matches.length > 0) {
      const top = matches[0];
      return {
        answer: `Based on your question, **${top.name}** is a strong match. It provides ${top.shortDescription}. You can check your eligibility or proceed to the official portal: ${top.verification.officialPortalUrl}.`,
        referencedSchemes: matches,
      };
    }

    return {
      answer:
        'To find the exact government schemes you qualify for, we recommend completing the personalized 2-minute eligibility survey.',
    };
  }
}

// ---------------------------------------------------------------------------
// API instance selection
// ---------------------------------------------------------------------------
// If VITE_API_BASE_URL is set (e.g. http://localhost:8000), the real backend
// is used. Otherwise the fully-offline MockFrontendApiClient is used as
// fallback — useful for demos, development without a backend, and tests.
// ---------------------------------------------------------------------------

const _backendUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const api: MockFrontendApiClient | HttpApiClient = _backendUrl
  ? new HttpApiClient(_backendUrl)
  : new MockFrontendApiClient();

export default api;
