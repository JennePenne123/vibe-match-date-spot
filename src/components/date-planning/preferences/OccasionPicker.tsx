import React from 'react';
import { Check, Bird, Heart, Coffee, Cake, Users, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { occasionOptions, type DateOccasion } from './preferencesData';

const iconMap: Record<string, LucideIcon> = {
  Butterfly: Bird, Heart, Coffee, Cake, Users, Sparkles,
};

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
        const Icon = iconMap[o.emoji];
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelectOccasion(sel ? null : o.id)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              'p-3 rounded-2xl border text-left select-none transition-all duration-200 active:scale-[0.97]',
              sel
                ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/15'
                : 'border-border/60 bg-card shadow-sm shadow-foreground/5 hover:border-primary/25'
            )}
          >
            <div className="flex items-center gap-2">
              {Icon && (
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                  sel ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm leading-tight', sel && 'text-primary')}>{o.label}</p>
                <p className="text-[11px] text-muted-foreground">{o.desc}</p>
              </div>
              {sel ? (
                <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-border/70 flex-shrink-0" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default OccasionPicker;
