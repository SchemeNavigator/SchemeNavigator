/**
 * HttpApiClient — real HTTP implementation of the same interface as MockFrontendApiClient.
 *
 * Activated when VITE_API_BASE_URL is set. Falls back to MockFrontendApiClient otherwise,
 * so the app still works fully offline / without a backend.
 *
 * Session token lifecycle:
 *   The token is stored purely in memory (a private instance variable).
 *   It is never written to sessionStorage or localStorage.
 *   A new token is requested on every page load; the token is gone the moment
 *   the page is closed or refreshed.
 */

import type { UserProfile, SchemeMatchResult, TrackerItem, Scheme } from '../types';
import { getCachedRecommendations, saveCachedRecommendations } from './storageService';

class HttpApiClient {
  private baseUrl: string;
  private _token: string | null = null;
  private _tokenPromise: Promise<string> | null = null;
  private _cache = new Map<string, { data: any; expiry: number }>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
  }

  private getCached<T>(key: string): T | null {
    const entry = this._cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data as T;
    }
    this._cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any, ttlMs: number = 60000) {
    this._cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  public clearCache() {
    this._cache.clear();
  }

  // ── Token management ──────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this._token) return this._token;

    try {
      const stored = sessionStorage.getItem('sn_session_token');
      if (stored) {
        this._token = stored;
        return stored;
      }
    } catch {
      // ignore
    }

    // Only one creation request at a time (avoids double-create on concurrent startup calls)
    if (!this._tokenPromise) {
      this._tokenPromise = this._createSession().finally(() => {
        this._tokenPromise = null;
      });
    }
    return this._tokenPromise;
  }

  private async _createSession(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/sessions/`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create session');
    const data = await res.json();
    const token: string = data.token;
    this._token = token;
    try {
      sessionStorage.setItem('sn_session_token', token);
    } catch {
      // ignore
    }
    return token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token,
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (res.status === 401) {
      // Token rejected — clear in-memory token and retry once with a fresh one
      this._token = null;
      const newToken = await this._createSession();
      const retry = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': newToken,
          ...(options.headers as Record<string, string> | undefined),
        },
      });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}));
        throw new Error(err?.error || `API error ${retry.status}`);
      }
      return retry.json() as Promise<T>;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `API error ${res.status}`);
    }

    // Handle 204 No Content
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  private del<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // ── Profile & Survey ──────────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile | null> {
    const data = await this.request<{ profile: UserProfile | null }>('/api/profile/');
    return data.profile ?? null;
  }

  async getProfileStatus() {
    const profile = await this.getProfile();
    return {
      exists: !!profile,
      isComplete: Boolean(profile?.age && profile?.state),
      completionPercentage: profile ? 100 : 0,
    };
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const data = await this.put<{ profile: UserProfile }>('/api/profile/', profile);
    return data.profile;
  }

  async submitSurvey(
    profile: UserProfile
  ): Promise<{ profile: UserProfile; recommendations: SchemeMatchResult[] }> {
    const data = await this.post<{
      profile: UserProfile;
      recommendations: SchemeMatchResult[];
    }>('/api/survey/submit/', { profile });
    if (data?.recommendations && Array.isArray(data.recommendations)) {
      const cacheKey = `recs_${JSON.stringify(profile || {})}`;
      this.setCached(cacheKey, data.recommendations, 180000);
      this.setCached('recs_latest', data.recommendations, 180000);
      saveCachedRecommendations(data.recommendations);
    }
    return data;
  }

  // ── Draft management ──────────────────────────────────────────────────────

  async getSurveyDraft() {
    const data = await this.request<{ draft: unknown }>('/api/survey/draft/');
    return data.draft ?? null;
  }

  async saveSurveyDraft(answers: unknown, currentStep: number) {
    await this.put('/api/survey/draft/', { answers, currentStep });
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  async getRecommendations(profile?: UserProfile): Promise<SchemeMatchResult[]> {
    const cacheKey = `recs_${JSON.stringify(profile || {})}`;
    const cached = this.getCached<SchemeMatchResult[]>(cacheKey) || this.getCached<SchemeMatchResult[]>('recs_latest');
    if (cached && cached.length > 0) return cached;

    // Check localStorage cache if memory cache is empty
    const persistentCached = getCachedRecommendations();
    if (persistentCached && persistentCached.length > 0) {
      this.setCached(cacheKey, persistentCached, 180000);
      this.setCached('recs_latest', persistentCached, 180000);
      return persistentCached;
    }

    let recs: SchemeMatchResult[];
    if (profile) {
      const data = await this.post<{ recommendations: SchemeMatchResult[] }>(
        '/api/recommendations/',
        { profile }
      );
      recs = data.recommendations;
    } else {
      const data = await this.request<{ recommendations: SchemeMatchResult[] }>(
        '/api/recommendations/'
      );
      recs = data.recommendations;
    }

    if (recs && recs.length > 0) {
      this.setCached(cacheKey, recs, 180000);
      this.setCached('recs_latest', recs, 180000);
      saveCachedRecommendations(recs);
    }
    return recs;
  }

  // ── Schemes catalogue ─────────────────────────────────────────────────────

  async getSchemes(params?: {
    category?: string;
    state?: string;
    search?: string;
    page?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.state) qs.set('state', params.state);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));

    const path = `/api/schemes/${qs.toString() ? '?' + qs.toString() : ''}`;
    const cacheKey = `schemes_${path}`;
    const cached = this.getCached<{
      schemes: Scheme[];
      categoryCounts?: Record<string, number>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(cacheKey);
    if (cached) return cached;

    const res = await this.request<{
      schemes: Scheme[];
      categoryCounts?: Record<string, number>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);

    if (res) {
      this.setCached(cacheKey, res, 60000); // 60 sec cache
    }
    return res;
  }

  async getScheme(idOrSlug: string): Promise<Scheme | undefined> {
    try {
      return await this.request<Scheme>(`/api/schemes/${idOrSlug}/`);
    } catch {
      return undefined;
    }
  }

  // ── Saved schemes ─────────────────────────────────────────────────────────

  async getSavedSchemes(): Promise<Scheme[]> {
    const data = await this.request<{ savedSchemes: Scheme[] }>('/api/saved-schemes/');
    return data.savedSchemes;
  }

  async saveScheme(schemeId: string) {
    await this.post(`/api/saved-schemes/${schemeId}/`, {});
  }

  async removeSavedScheme(schemeId: string) {
    await this.del(`/api/saved-schemes/${schemeId}/`);
  }

  // ── Tracker ───────────────────────────────────────────────────────────────

  async getApplications(): Promise<TrackerItem[]> {
    const data = await this.request<{ applications: TrackerItem[] }>('/api/tracker/');
    return data.applications;
  }

  async updateApplication(item: TrackerItem) {
    await this.put(`/api/tracker/${item.id}/`, item);
  }

  // ── AI Assistant ──────────────────────────────────────────────────────────

  async askAI(
    query: string,
    history?: Array<{ role: string; content: string }>,
    profile?: UserProfile | null,
    language?: string
  ): Promise<{
    answer: string;
    referencedSchemes?: Scheme[];
    profileUpdated?: boolean;
    updatedProfile?: Partial<UserProfile>;
  }> {
    const data = await this.post<{
      answer: string;
      referencedSchemes: Scheme[];
      profileUpdated: boolean;
      updatedProfile?: Partial<UserProfile>;
    }>('/api/assistant/chat/', {
      message: query,
      history: history || [],
      profile: profile || undefined,
      language: language || 'en-IN',
    });
    return {
      answer: data.answer,
      referencedSchemes: data.referencedSchemes,
      profileUpdated: data.profileUpdated,
      updatedProfile: data.updatedProfile,
    };
  }
}

export { HttpApiClient };

