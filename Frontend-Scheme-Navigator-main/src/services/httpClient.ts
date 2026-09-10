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

class HttpApiClient {
  private baseUrl: string;
  private _token: string | null = null;
  private _tokenPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
  }

  // ── Token management ──────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this._token) return this._token;

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
    if (profile) {
      const data = await this.post<{ recommendations: SchemeMatchResult[] }>(
        '/api/recommendations/',
        { profile }
      );
      return data.recommendations;
    }
    const data = await this.request<{ recommendations: SchemeMatchResult[] }>(
      '/api/recommendations/'
    );
    return data.recommendations;
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
    return this.request<{
      schemes: Scheme[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);
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

  async askAI(query: string): Promise<{ answer: string; referencedSchemes?: Scheme[] }> {
    const data = await this.post<{
      answer: string;
      referencedSchemes: Scheme[];
      profileUpdated: boolean;
    }>('/api/assistant/chat/', { message: query });
    return {
      answer: data.answer,
      referencedSchemes: data.referencedSchemes,
    };
  }
}

export { HttpApiClient };
