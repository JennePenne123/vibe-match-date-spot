import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, Settings, UtensilsCrossed, Heart, Wallet, Clock } from 'lucide-react';
import SafeComponent from '@/components/SafeComponent';
import { emojiMap, timePreferences, type UserPreferences } from './preferencesData';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  onboardingPrefs: UserPreferences;
  onKeep: () => void;
  onCustomize: () => void;
}

/** Case-insensitive dedupe, keeps the nicest looking variant. */
const dedupe = (items: string[]) => {
  const seen = new Map<string, string>();
  items.forEach(raw => {
    const key = raw.trim().toLowerCase();
    if (!key) return;
    const existing = seen.get(key);
    if (!existing || (raw[0] === raw[0]?.toUpperCase() && existing[0] !== existing[0]?.toUpperCase())) {
      seen.set(key, raw.trim());
    }
  });
  return Array.from(seen.values());
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const emojiFor = (item: string, fallback: string) => {
  const direct = emojiMap[item] || emojiMap[titleCase(item.toLowerCase())] || emojiMap[item.toLowerCase()];
  return direct || fallback;
};

interface SectionProps {
  icon: React.ElementType;
  label: string;
  items: { key: string; emoji: string; label: string }[];
}

const Section: React.FC<SectionProps> = ({ icon: Icon, label, items }) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary/80" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/60">{items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span
            key={item.key}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10',
              'px-2.5 py-1 text-xs font-medium text-foreground/90'
            )}
          >
            <span aria-hidden className="text-sm leading-none">{item.emoji}</span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const PreferencesConfirmScreen: React.FC<Props> = ({ onboardingPrefs, onKeep, onCustomize }) => {
  const { t } = useTranslation();

  const translateWith = (prefix: string, raw: string) => {
    const key = `datePlanning.${prefix}${titleCase(raw.toLowerCase())}`;
    const translated = t(key);
    return translated === key ? titleCase(raw) : translated;
  };

  const cuisines = useMemo(
    () => dedupe(onboardingPrefs.preferred_cuisines).map(c => ({
      key: c, emoji: emojiFor(c, '🍽️'), label: translateWith('cuisine', c),
    })),
    [onboardingPrefs.preferred_cuisines] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const vibes = useMemo(
    () => dedupe(onboardingPrefs.preferred_vibes).map(v => ({
      key: v, emoji: emojiFor(v, '✨'), label: translateWith('vibe', v),
    })),
    [onboardingPrefs.preferred_vibes] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const budgets = useMemo(
    () => dedupe(onboardingPrefs.preferred_price_range).map(b => ({
      key: b, emoji: '💰', label: titleCase(b),
    })),
    [onboardingPrefs.preferred_price_range]
  );

  const times = useMemo(
    () => dedupe(onboardingPrefs.preferred_times).map(id => {
      const tp = timePreferences.find(p => p.id === id);
      return { key: id, emoji: tp?.emoji || '🕐', label: tp ? t(tp.name) : titleCase(id) };
    }),
    [onboardingPrefs.preferred_times] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const total = cuisines.length + vibes.length + budgets.length + times.length;

  return (
    <SafeComponent>
      <div className="space-y-6">
        <div className="text-center">
          <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/20 blur-xl" aria-hidden />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/5">
              <Sparkles className="h-7 w-7 text-primary" />
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t('datePlanning.confirmTitle')}</h2>
          <p className="mx-auto mt-1 max-w-[19rem] text-sm leading-relaxed text-muted-foreground">
            {t('datePlanning.confirmSubtitle')}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <div className="relative space-y-4">
            <Section icon={UtensilsCrossed} label={t('datePlanning.cuisine')} items={cuisines} />
            {cuisines.length > 0 && vibes.length > 0 && <div className="h-px bg-border/50" />}
            <Section icon={Heart} label={t('datePlanning.vibe')} items={vibes} />
            {vibes.length > 0 && budgets.length > 0 && <div className="h-px bg-border/50" />}
            <Section icon={Wallet} label={t('datePlanning.budget')} items={budgets} />
            {budgets.length > 0 && times.length > 0 && <div className="h-px bg-border/50" />}
            <Section icon={Clock} label={t('datePlanning.timeOfDay')} items={times} />
            {total === 0 && (
              <p className="py-2 text-center text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <Button
            onClick={onKeep}
            className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-transform active:scale-[0.97]"
          >
            <Check className="mr-2 h-5 w-5" />
            {t('datePlanning.confirmKeep')}
          </Button>
          <Button
            onClick={onCustomize}
            variant="outline"
            className="h-12 w-full rounded-xl border-border/60 text-base transition-transform active:scale-[0.97]"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('datePlanning.confirmCustomize')}
          </Button>
        </div>
      </div>
    </SafeComponent>
  );
};

export default PreferencesConfirmScreen;
