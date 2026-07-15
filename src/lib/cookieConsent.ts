import { useEffect, useState } from 'react';

export type ConsentCategory = 'necessary' | 'preferences' | 'analytics' | 'marketing';

export interface CookieConsent {
  version: number;
  timestamp: string;
  region?: string;
  categories: Record<ConsentCategory, boolean>;
}

export const CONSENT_STORAGE_KEY = 'hioutz-cookie-consent-v2';
export const CONSENT_EVENT = 'hioutz:cookie-consent-changed';
export const OPEN_SETTINGS_EVENT = 'hioutz:open-cookie-settings';
export const CURRENT_CONSENT_VERSION = 2;

export const DEFAULT_CATEGORIES: Record<ConsentCategory, boolean> = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

export function getStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CURRENT_CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(
  categories: Record<ConsentCategory, boolean>,
  region?: string,
): CookieConsent {
  const consent: CookieConsent = {
    version: CURRENT_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    region,
    categories: { ...categories, necessary: true },
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  return consent;
}

export function clearConsent() {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  // Legacy keys from earlier consent versions
  try {
    localStorage.removeItem('hioutz-privacy-consent-v1');
    localStorage.removeItem('hioutz_tracking_opt_out');
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}

export function hasConsent(category: ConsentCategory): boolean {
  const c = getStoredConsent();
  if (!c) return category === 'necessary';
  return !!c.categories[category];
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => getStoredConsent());

  useEffect(() => {
    const handler = () => setConsent(getStoredConsent());
    window.addEventListener(CONSENT_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CONSENT_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return {
    consent,
    hasConsent: (c: ConsentCategory) =>
      consent ? !!consent.categories[c] : c === 'necessary',
    save: (cats: Record<ConsentCategory, boolean>, region?: string) => saveConsent(cats, region),
    clear: clearConsent,
    openSettings: openCookieSettings,
  };
}