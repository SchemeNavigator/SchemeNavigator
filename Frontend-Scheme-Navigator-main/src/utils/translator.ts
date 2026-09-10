/**
 * Universal Website Translator Helper
 * Integrates with Google Translate engine and cookie state to translate
 * the entire website DOM in real time across all 12 Indian Languages.
 */

export const getShortLangCode = (bcp47Code: string): string => {
  if (!bcp47Code) return 'en';
  return bcp47Code.split('-')[0].toLowerCase();
};

export const setGoogleTranslateCookie = (langCode: string) => {
  const shortCode = getShortLangCode(langCode);
  const cookieValue = shortCode === 'en' ? '/en/en' : `/en/${shortCode}`;

  // Clear older versions
  const domains = [
    window.location.hostname,
    `.${window.location.hostname}`,
    '',
  ];

  domains.forEach((d) => {
    const domainStr = d ? `; domain=${d}` : '';
    document.cookie = `googtrans=${cookieValue}; path=/${domainStr}`;
    document.cookie = `googtrans=${cookieValue}; path=/${domainStr}; max-age=31536000`;
  });
};

export const applySiteLanguage = (bcp47Code: string) => {
  const shortCode = getShortLangCode(bcp47Code);

  // 1. Set Google Translate cookies
  setGoogleTranslateCookie(bcp47Code);

  // 2. Try to find the Google Translate combo select element
  const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (selectElem) {
    if (selectElem.value !== shortCode) {
      selectElem.value = shortCode;
      selectElem.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else {
    // If not rendered yet, trigger iframe or reload if cookie is fresh
    const gTranslateFrame = document.querySelector('iframe.goog-te-banner-frame') as HTMLIFrameElement | null;
    if (gTranslateFrame) {
      try {
        const frameDoc = gTranslateFrame.contentDocument || gTranslateFrame.contentWindow?.document;
        const selectInside = frameDoc?.querySelector('select') as HTMLSelectElement | null;
        if (selectInside) {
          selectInside.value = shortCode;
          selectInside.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch {
        // cross-origin frame fallback
      }
    }
  }
};

/**
 * Initialize language from storage on first page load
 */
export const initStoredLanguage = () => {
  try {
    const savedCode = localStorage.getItem('scheme_navigator_language');
    if (savedCode && savedCode !== 'en-IN' && savedCode !== 'en') {
      const shortCode = getShortLangCode(savedCode);
      setGoogleTranslateCookie(savedCode);
      
      // Delay slightly for script initialization
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
        if (selectElem) {
          selectElem.value = shortCode;
          selectElem.dispatchEvent(new Event('change', { bubbles: true }));
          clearInterval(interval);
        } else if (tries > 25) {
          clearInterval(interval);
        }
      }, 200);
    }
  } catch {
    // ignore
  }
};
