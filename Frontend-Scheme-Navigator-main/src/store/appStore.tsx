import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserProfile, SchemeMatchResult, Scheme, TrackerItem } from '../types';
import { api } from '../services/api';
import { getSavedProfile, getSavedSchemeIds, getTrackerItems } from '../services/storageService';
import { ALL_SCHEMES } from '../data/allSchemes';
import { TOP_INDIAN_LANGUAGES, LanguageInfo, getLanguageByCode } from '../constants/languages';

export interface ProfileStatus {
  exists: boolean;
  isComplete: boolean;
  completionPercentage: number;
}

export interface AppState {
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  surveyDraft: any;
  surveyAnswers: Partial<UserProfile>;
  surveyProgress: number;
  recommendations: SchemeMatchResult[];
  selectedScheme: Scheme | null;
  savedSchemes: Scheme[];
  savedSchemeIds: string[];
  applications: TrackerItem[];
  selectedLanguage: LanguageInfo;
  isTourActive: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  setSurveyProgress: (step: number) => void;
  saveDraft: (answers: any, currentStep: number) => Promise<void>;
  submitSurvey: (profile: UserProfile) => Promise<SchemeMatchResult[]>;
  toggleBookmark: (schemeId: string) => Promise<void>;
  updateApplicationStatus: (item: TrackerItem) => Promise<void>;
  setSelectedScheme: (scheme: Scheme | null) => void;
  setSelectedLanguage: (lang: LanguageInfo | string) => void;
  handleCheckEligibility: (navigate: (path: string) => void) => void;
  startTour: () => void;
  stopTour: () => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(() => getSavedProfile());
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(() => {
    const saved = getSavedProfile();
    return {
      exists: !!saved,
      isComplete: Boolean(saved?.age && saved?.state),
      completionPercentage: saved ? 100 : 0,
    };
  });
  const [surveyDraft, setSurveyDraft] = useState<any>(null);
  const [surveyProgress, setSurveyProgress] = useState<number>(1);
  const [recommendations, setRecommendations] = useState<SchemeMatchResult[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>(() => getSavedSchemeIds());
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>(() =>
    ALL_SCHEMES.filter((s) => getSavedSchemeIds().includes(s.id))
  );
  const [applications, setApplications] = useState<TrackerItem[]>(() => getTrackerItems());
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageInfo>(() => {
    try {
      const savedCode = localStorage.getItem('scheme_navigator_language');
      if (savedCode) {
        return getLanguageByCode(savedCode);
      }
    } catch {
      // ignore
    }
    return TOP_INDIAN_LANGUAGES[0];
  });
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startTour = useCallback(() => {
    setIsTourActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
  }, []);

  const setSelectedLanguage = (lang: LanguageInfo | string) => {
    const target = typeof lang === 'string' ? getLanguageByCode(lang) : lang;
    setSelectedLanguageState(target);
    try {
      localStorage.setItem('scheme_navigator_language', target.code);
    } catch {
      // ignore
    }
  };

  const setProfile = (fields: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const updated = { ...(prev || {}), ...fields } as UserProfile;
      api.updateProfile(updated);
      setProfileStatus({
        exists: true,
        isComplete: Boolean(updated.age && updated.state),
        completionPercentage: 100,
      });
      return updated;
    });
  };

  const saveDraft = async (answers: any, currentStep: number) => {
    setSurveyDraft({ answers, currentStep });
    await api.saveSurveyDraft(answers, currentStep);
  };

  const submitSurvey = async (surveyProfile: UserProfile): Promise<SchemeMatchResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.submitSurvey(surveyProfile);
      setProfileState(result.profile);
      setProfileStatus({
        exists: true,
        isComplete: true,
        completionPercentage: 100,
      });
      setSurveyDraft(null);
      setRecommendations(result.recommendations);
      return result.recommendations;
    } catch (err: any) {
      setError(err?.message || "We couldn't process your profile right now. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (schemeId: string) => {
    const isSaved = savedSchemeIds.includes(schemeId);
    if (isSaved) {
      setSavedSchemeIds((prev) => prev.filter((id) => id !== schemeId));
      setSavedSchemes((prev) => prev.filter((s) => s.id !== schemeId));
      await api.removeSavedScheme(schemeId);
    } else {
      setSavedSchemeIds((prev) => [...prev, schemeId]);
      const found = ALL_SCHEMES.find((s) => s.id === schemeId);
      if (found) {
        setSavedSchemes((prev) => [found, ...prev]);
      }
      await api.saveScheme(schemeId);
    }
  };

  const updateApplicationStatus = async (item: TrackerItem) => {
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.schemeId === item.schemeId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
    await api.updateApplication(item);
  };

  const handleCheckEligibility = useCallback(
    (navigate: (path: string) => void) => {
      const currentProf = profile || getSavedProfile();
      const hasCompleteProfile = profileStatus.isComplete || (!!currentProf?.age && !!currentProf?.state);

      if (hasCompleteProfile) {
        navigate('/recommendations');
      } else {
        navigate('/survey');
      }
    },
    [profile, profileStatus]
  );

  return (
    <AppContext.Provider
      value={{
        profile,
        profileStatus,
        surveyDraft,
        surveyAnswers: profile || {},
        surveyProgress,
        recommendations,
        selectedScheme,
        savedSchemes,
        savedSchemeIds,
        applications,
        selectedLanguage,
        isTourActive,
        loading,
        error,
        setProfile,
        setSurveyProgress,
        saveDraft,
        submitSurvey,
        toggleBookmark,
        updateApplicationStatus,
        setSelectedScheme,
        setSelectedLanguage,
        handleCheckEligibility,
        startTour,
        stopTour,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = (): AppState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
