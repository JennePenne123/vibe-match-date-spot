import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, Settings } from 'lucide-react';
import SafeComponent from '@/components/SafeComponent';
import { emojiMap, timePreferences, type UserPreferences } from './preferencesData';

interface Props {
  onboardingPrefs: UserPreferences;
  onKeep: () => void;
  onCustomize: () => void;
}

const PreviewBadges = ({ items, fallback }: { items: string[]; fallback: string }) =>
  items.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <Badge key={item} variant="secondary" className="text-xs">
          {emojiMap[item] || fallback} {item}
        </Badge>
      ))}
    </div>
  ) : null;

const PreferencesConfirmScreen: React.FC<Props> = ({ onboardingPrefs, onKeep, onCustomize }) => (
  <SafeComponent>
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Deine Vorlieben</h2>
        <p className="text-sm text-muted-foreground">Aus deinem Onboarding — übernehmen oder anpassen?</p>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
        {onboardingPrefs.preferred_cuisines.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Küche</p>
            <PreviewBadges items={onboardingPrefs.preferred_cuisines} fallback="🍽️" />
          </div>
        )}
        {onboardingPrefs.preferred_vibes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Vibe</p>
            <PreviewBadges items={onboardingPrefs.preferred_vibes} fallback="✨" />
          </div>
        )}
        {onboardingPrefs.preferred_price_range.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Budget</p>
            <PreviewBadges items={onboardingPrefs.preferred_price_range} fallback="💰" />
          </div>
        )}
        {onboardingPrefs.preferred_times.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Tageszeit</p>
            <div className="flex flex-wrap gap-1.5">
              {onboardingPrefs.preferred_times.map(t => {
                const tp = timePreferences.find(p => p.id === t);
                return <Badge key={t} variant="secondary" className="text-xs">{tp?.emoji || '🕐'} {tp?.name || t}</Badge>;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button onClick={onKeep} className="w-full h-12 text-base font-semibold active:scale-[0.97] transition-transform">
          <Check className="w-5 h-5 mr-2" />
          So übernehmen
        </Button>
        <Button onClick={onCustomize} variant="outline" className="w-full h-12 text-base active:scale-[0.97] transition-transform">
          <Settings className="w-4 h-4 mr-2" />
          Heute anders
        </Button>
      </div>
    </div>
  </SafeComponent>
);

export default PreferencesConfirmScreen;
