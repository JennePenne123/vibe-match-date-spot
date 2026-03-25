import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyMood } from '@/pages/MoodCheckIn';

interface MoodOption {
  id: DailyMood;
  emoji: string;
  label: string;
  desc: string;
}

const moodOptions: MoodOption[] = [
  { id: 'great', emoji: '✨', label: 'Großartig', desc: 'Abenteuer & Neues' },
  { id: 'okay', emoji: '👍', label: 'Passt schon', desc: 'Gemütlich & vertraut' },
  { id: 'me-time', emoji: '🧘', label: 'Ruhig', desc: 'Entspannt & ruhig' },
];

const MOOD_STORAGE_KEY = 'vybe-daily-mood';

function getTodayMoodFromStorage(): DailyMood | null {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    if (parsed.date === today) return parsed.mood as DailyMood;
    return null;
  } catch {
    return null;
  }
}

function setTodayMoodInStorage(mood: DailyMood) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify({ mood, date: today }));
}

interface Props {
  selectedMood: DailyMood | null;
  onSelectMood: (mood: DailyMood | null) => void;
}

const MoodPicker: React.FC<Props> = ({ selectedMood, onSelectMood }) => {
  const handleSelect = (mood: DailyMood) => {
    if (selectedMood === mood) {
      onSelectMood(null);
    } else {
      onSelectMood(mood);
      // Persist to localStorage so moodScoring.ts picks it up
      setTodayMoodInStorage(mood);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-1">Wie fühlst du dich?</p>
      <p className="text-xs text-muted-foreground mb-3">Passt die Venue-Auswahl an deine Stimmung an</p>
      <div className="grid grid-cols-3 gap-2">
        {moodOptions.map(o => {
          const sel = selectedMood === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => handleSelect(o.id)}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={cn(
                'p-3 rounded-xl border-2 text-center select-none active:scale-[0.97] transition-transform',
                sel ? 'border-primary bg-primary/5' : 'border-border bg-card'
              )}
            >
              <span className="text-2xl block mb-1">{o.emoji}</span>
              <p className="font-semibold text-xs leading-tight">{o.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
              {sel && (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center mx-auto mt-1.5">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { getTodayMoodFromStorage };
export default MoodPicker;
