import React from 'react';
import { Check, Sparkles, ThumbsUp, Leaf, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DailyMood, getTodayMood, storeMoodForToday } from '@/utils/moodStorage';

interface MoodOption {
  id: DailyMood;
  icon: LucideIcon;
  label: string;
  desc: string;
}

const moodOptions: MoodOption[] = [
  { id: 'great', icon: Sparkles, label: 'Großartig', desc: 'Abenteuer & Neues' },
  { id: 'okay', icon: ThumbsUp, label: 'Passt schon', desc: 'Gemütlich & vertraut' },
  { id: 'me-time', icon: Leaf, label: 'Ruhig', desc: 'Entspannt & ruhig' },
];

export function getTodayMoodFromStorage(): DailyMood | null {
  return getTodayMood();
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
      storeMoodForToday(mood);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-1">Wie fühlst du dich?</p>
      <p className="text-xs text-muted-foreground mb-3">Passt die Venue-Auswahl an deine Stimmung an</p>
      <div className="grid grid-cols-3 gap-2">
        {moodOptions.map(o => {
          const sel = selectedMood === o.id;
          const Icon = o.icon;
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
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5',
                sel ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="w-5 h-5" />
              </div>
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

export default MoodPicker;
