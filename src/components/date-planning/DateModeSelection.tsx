
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Users, UsersIcon, Sparkles, Heart, PartyPopper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type DateModeType = 'solo' | 'single' | 'group';

interface DateModeSelectionProps {
  onSelectMode: (mode: DateModeType) => void;
}

const modes: { mode: DateModeType; icon: React.ElementType; accentIcon: React.ElementType; gradient: string; border: string }[] = [
  { mode: 'solo', icon: User, accentIcon: Sparkles, gradient: 'from-amber-500/10 to-orange-500/10', border: 'hover:border-amber-400/50' },
  { mode: 'single', icon: Heart, accentIcon: Users, gradient: 'from-rose-500/10 to-pink-500/10', border: 'hover:border-rose-400/50' },
  { mode: 'group', icon: PartyPopper, accentIcon: UsersIcon, gradient: 'from-violet-500/10 to-indigo-500/10', border: 'hover:border-violet-400/50' },
];

const DateModeSelection: React.FC<DateModeSelectionProps> = ({ onSelectMode }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t('datePlanning.howDoYouWantToDate')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('datePlanning.chooseDateMode')}
        </p>
      </div>

      <div className="grid gap-4">
        {modes.map(({ mode, icon: Icon, accentIcon: AccentIcon, gradient, border }) => (
          <button
            key={mode}
            onClick={() => onSelectMode(mode)}
            className={cn(
              'group relative w-full text-left rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200',
              'hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]',
              border
            )}
          >
            <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity', gradient)} />
            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-background/80 transition-colors">
                <Icon className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-base">
                    {t(`datePlanning.mode_${mode}_title`)}
                  </h3>
                  <AccentIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(`datePlanning.mode_${mode}_desc`)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateModeSelection;
