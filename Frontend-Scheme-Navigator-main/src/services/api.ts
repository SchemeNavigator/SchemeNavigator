import { UserProfile, SchemeMatchResult, TrackerItem, Scheme } from '../types';
import { HttpApiClient } from './httpClient';

const _backendUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

export const API_BASE_URL = _backendUrl;
export const api = new HttpApiClient(_backendUrl);

export default api;

