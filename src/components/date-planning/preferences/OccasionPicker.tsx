import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { occasionOptions, type DateOccasion } from './preferencesData';

interface Props {
  selectedOccasion: DateOccasion | null;
  onSelectOccasion: (occasion: DateOccasion | null) => void;
}

const OccasionPicker: React.FC<Props> = ({ selectedOccasion, onSelectOccasion }) => (
  <div>
    <p className="text-sm font-semibold text-foreground mb-1">Was ist der Anlass?</p>
    <p className="text-xs text-muted-foreground mb-3">Hilft der KI, den perfekten Ort zu finden</p>
    <div className="grid grid-cols-2 gap-2">
      {occasionOptions.map(o => {
        const sel = selectedOccasion === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelectOccasion(sel ? null : o.id)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              'p-3 rounded-xl border-2 text-left select-none active:scale-[0.97] transition-transform',
              sel ? 'border-primary bg-primary/5' : 'border-border bg-card'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{o.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">{o.label}</p>
                <p className="text-[11px] text-muted-foreground">{o.desc}</p>
              </div>
              {sel && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default OccasionPicker;
