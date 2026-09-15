import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { durationModels } from './preferencesData';

interface Props {
  selectedDuration: string | null;
  onSelectDuration: (id: string) => void;
}

const DurationPicker: React.FC<Props> = ({ selectedDuration, onSelectDuration }) => {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-1">{t('preferences.howLong')}</p>
      <p className="text-xs text-muted-foreground mb-3">{t('preferences.chooseDuration')}</p>
      <div className="grid grid-cols-2 gap-2">
        {durationModels.map(m => {
          const sel = selectedDuration === m.id;
          return (
            <button
              key={m.id} type="button" onClick={() => onSelectDuration(m.id)}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={cn(
                'p-3 rounded-2xl border text-left select-none transition-all duration-200 active:scale-[0.97]',
                sel
                  ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/15'
                  : 'border-border/60 bg-card shadow-sm shadow-foreground/5 hover:border-primary/25'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm leading-tight', sel && 'text-primary')}>{t(m.title)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(m.desc)}</p>
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
};

export default DurationPicker;
