import { useAppStore } from '../store/appStore';
import { getTranslation } from '../i18n/translations';

export const useTranslation = () => {
  const { selectedLanguage, setSelectedLanguage } = useAppStore();
  const langCode = selectedLanguage?.code || 'en-IN';

  const t = (key: string, params?: Record<string, any>, fallback?: string): string => {
    const translated = getTranslation(key, langCode, params);
    if (translated === key && fallback) {
      return fallback;
    }
    return translated;
  };

  return {
    t,
    currentLanguage: selectedLanguage,
    langCode,
    setLanguage: setSelectedLanguage,
  };
};
