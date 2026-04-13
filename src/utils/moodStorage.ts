const MOOD_STORAGE_KEY = 'hioutz-daily-mood';

export type DailyMood = 'great' | 'okay' | 'me-time';
export type StoredMood = DailyMood | 'skipped';

const DAILY_MOODS = new Set<DailyMood>(['great', 'okay', 'me-time']);

const getTodayDateKey = () => new Date().toISOString().split('T')[0];

const readMoodStorage = (): { date: string; mood: string } | null => {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      date: typeof parsed.date === 'string' ? parsed.date : '',
      mood: typeof parsed.mood === 'string' ? parsed.mood : '',
    };
  } catch {
    return null;
  }
};

export const hasMoodToday = (): boolean => {
  const stored = readMoodStorage();
  return stored?.date === getTodayDateKey();
};

export const getTodayMood = (): DailyMood | null => {
  const stored = readMoodStorage();

  if (!stored || stored.date !== getTodayDateKey()) {
    return null;
  }

  return DAILY_MOODS.has(stored.mood as DailyMood)
    ? (stored.mood as DailyMood)
    : null;
};

export const storeMoodForToday = (mood: StoredMood): void => {
  localStorage.setItem(
    MOOD_STORAGE_KEY,
    JSON.stringify({ mood, date: getTodayDateKey() })
  );
};