/**
 * Persists the last completed date-planning selection so the wizard can offer
 * a "Wie letztes Mal" quick start.
 */

const STORAGE_KEY = 'hioutz-last-date-preferences';

export interface LastDatePreferences {
  categoryId: string | null;
  cuisines: string[];
  vibes: string[];
  priceRange: string[];
  timePreferences: string[];
  venueTypes: string[];
  savedAt: string;
}

export const saveLastDatePreferences = (prefs: Omit<LastDatePreferences, 'savedAt'>): void => {
  if (typeof window === 'undefined') return;
  const hasAnything =
    prefs.cuisines.length > 0 || prefs.vibes.length > 0 ||
    prefs.priceRange.length > 0 || prefs.timePreferences.length > 0 ||
    prefs.venueTypes.length > 0;
  if (!hasAnything) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prefs, savedAt: new Date().toISOString() }),
    );
  } catch { /* storage unavailable */ }
};

export const readLastDatePreferences = (): LastDatePreferences | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastDatePreferences>;
    return {
      categoryId: parsed.categoryId ?? null,
      cuisines: parsed.cuisines ?? [],
      vibes: parsed.vibes ?? [],
      priceRange: parsed.priceRange ?? [],
      timePreferences: parsed.timePreferences ?? [],
      venueTypes: parsed.venueTypes ?? [],
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const clearLastDatePreferences = (): void => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
};
