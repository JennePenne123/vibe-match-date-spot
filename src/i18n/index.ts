import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import de from './locales/de.json';

export const languages = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

type LanguageCode = 'de' | 'en' | 'es';

// Only non-default locales are code-split; German ships with the app shell.
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('./locales/en.json'),
  es: () => import('./locales/es.json'),
};

const loaded = new Set<string>(['de']);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
    },
    fallbackLng: 'de',
    partialBundledLanguages: true,
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
  const code = lng.slice(0, 2);
  if (!(code in loaders) || loaded.has(code)) return;
  loaded.add(code);
  const mod = await loaders[code]();
  i18n.addResourceBundle(code, 'translation', mod.default, true, true);
  await i18n.changeLanguage(code);
}

// Load the detected language (if it is not the bundled default) right away.
void ensureLanguageLoaded(i18n.language || 'de');

// Set document language on change
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = lng;
  void ensureLanguageLoaded(lng);
});

export default i18n;
