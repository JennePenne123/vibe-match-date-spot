import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const languages = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

type LanguageCode = 'de' | 'en' | 'es';

const loaders: Record<LanguageCode, () => Promise<{ default: Record<string, unknown> }>> = {
  de: () => import('./locales/de.json'),
  en: () => import('./locales/en.json'),
  es: () => import('./locales/es.json'),
};

const detectInitialLanguage = (): LanguageCode => {
  try {
    const stored = localStorage.getItem('hioutz-language');
    if (stored && stored.slice(0, 2) in loaders) return stored.slice(0, 2) as LanguageCode;
    const nav = navigator.language?.slice(0, 2);
    if (nav && nav in loaders) return nav as LanguageCode;
  } catch {
    /* ignore */
  }
  return 'de';
};

const initialLanguage = detectInitialLanguage();
const loaded = new Set<string>([initialLanguage]);

// Only the active language is bundled into the initial payload; the other
// locales are fetched on demand when the user switches languages.
const initialResources = await loaders[initialLanguage]();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      [initialLanguage]: { translation: initialResources.default },
    },
    lng: initialLanguage,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'hioutz-language',
    },
  });

export async function ensureLanguageLoaded(lng: string) {
  const code = lng.slice(0, 2) as LanguageCode;
  if (!(code in loaders) || loaded.has(code)) return;
  loaded.add(code);
  const mod = await loaders[code]();
  i18n.addResourceBundle(code, 'translation', mod.default, true, true);
  await i18n.changeLanguage(code);
}

// Set document language on change
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = lng;
  void ensureLanguageLoaded(lng);
});

export default i18n;
