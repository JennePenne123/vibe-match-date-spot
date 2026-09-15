import React from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, Sparkles, Wallet, MapPin, Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getVisiblePriorityDimensions,
  getCategoryPriorityWeights,
  type PriorityDimensionId,
} from '@/lib/categoryWizardConfig';
import type { SituationalCategoryId } from '@/lib/situationalCategories';
import CategoryPriorityHint from '@/components/category/CategoryPriorityHint';
import { useLearnedPriorityWeights, LEARNED_WEIGHTS_MIN_RATINGS } from '@/hooks/useLearnedPriorityWeights';

export interface PriorityWeights {
  cuisine: number;
  vibe: number;
  price: number;
  location: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  cuisine: 1.0,
  vibe: 1.0,
  price: 1.0,
  location: 1.0,
};

/** Category-aware defaults used to preset the sliders. */
export const priorityWeightsForCategory = (
  categoryId: SituationalCategoryId | null | undefined,
): PriorityWeights => ({ ...DEFAULT_PRIORITY_WEIGHTS, ...getCategoryPriorityWeights(categoryId) });

/** Learned feature-weight keys mapped onto the four priority dimensions. */
const LEARNED_KEY_MAP: Record<keyof PriorityWeights, string> = {
  cuisine: 'cuisine',
  vibe: 'vibe',
  price: 'price',
  location: 'distance',
};

const clampWeight = (w: number) => Math.max(0.6, Math.min(1.6, w));

/**
 * Blends the category preset with what the AI learned about this user.
 * Confidence (0..1) grows with the number of rated dates, so early on the
 * category preset still dominates.
 */
export const blendLearnedPriorityWeights = (
  preset: PriorityWeights,
  learned: Record<string, number> | null | undefined,
  confidence: number,
): PriorityWeights => {
  if (!learned || confidence <= 0) return preset;
  const out = { ...preset };
  (Object.keys(preset) as (keyof PriorityWeights)[]).forEach(k => {
    const raw = learned[LEARNED_KEY_MAP[k]];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return;
    const target = clampWeight(raw);
    out[k] = Math.round(clampWeight(preset[k] * (1 - confidence) + target * confidence) * 100) / 100;
  });
  return out;
};

interface PriorityDimension {
  key: PriorityDimensionId;
  icon: LucideIcon;
  labelKey: string;
  fallback: string;
}

const dimensions: Record<PriorityDimensionId, PriorityDimension> = {
  cuisine: { key: 'cuisine', icon: UtensilsCrossed, labelKey: 'preferences.priorityDimCuisine', fallback: 'Essen' },
  vibe: { key: 'vibe', icon: Sparkles, labelKey: 'preferences.priorityDimVibe', fallback: 'Atmosphäre' },
  price: { key: 'price', icon: Wallet, labelKey: 'preferences.priorityDimPrice', fallback: 'Preis' },
  location: { key: 'location', icon: MapPin, labelKey: 'preferences.priorityDimLocation', fallback: 'Nähe' },
};

interface Props {
  weights: PriorityWeights;
  onChangeWeights: (weights: PriorityWeights) => void;
  /** Active situational category — drives which sliders are shown */
  categoryId?: SituationalCategoryId | null;
}

/** Relaxed 3-step input: low / normal / high map to internal weights. */
const LEVELS = [
  { id: 'low', weight: 0.6, labelKey: 'preferences.priorityLevelLow', fallback: 'Egal' },
  { id: 'normal', weight: 1.0, labelKey: 'preferences.priorityLevelNormal', fallback: 'Wichtig' },
  { id: 'high', weight: 1.6, labelKey: 'preferences.priorityLevelHigh', fallback: 'Sehr wichtig' },
] as const;

const weightToLevel = (w: number): (typeof LEVELS)[number]['id'] =>
  w <= 0.7 ? 'low' : w >= 1.3 ? 'high' : 'normal';

const PriorityPicker: React.FC<Props> = ({ weights, onChangeWeights, categoryId = null }) => {
  const { t } = useTranslation();

  const handleSelect = (key: PriorityDimensionId, weight: number) => {
    onChangeWeights({ ...weights, [key]: weight });
  };

  const visible = getVisiblePriorityDimensions(categoryId).map(id => dimensions[id]);

  // "Skip: KI entscheidet" — active as long as the weights still match the
  // category preset (untouched). Tapping resets to the preset; picking any
  // level below deactivates it automatically.
  const { data: learned } = useLearnedPriorityWeights();
  const isPersonalized = !!learned && learned.totalRatings >= LEARNED_WEIGHTS_MIN_RATINGS;
  const basePreset = priorityWeightsForCategory(categoryId);
  const preset = isPersonalized
    ? blendLearnedPriorityWeights(basePreset, learned!.featureWeights, learned!.confidence)
    : basePreset;
  const aiDecides = (Object.keys(preset) as (keyof PriorityWeights)[])
    .every(k => weights[k] === preset[k]);

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-1">{t('preferences.priorityTitle', 'Was ist dir am wichtigsten?')}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {categoryId
          ? t('preferences.priorityIntro')
          : t('preferences.priorityIntroGeneric', 'Wähle, welche Faktoren die KI stärker berücksichtigen soll')}
      </p>
      {categoryId && <CategoryPriorityHint categoryId={categoryId} className="mb-3" />}

      <button
        type="button"
        onClick={() => onChangeWeights({ ...preset })}
        aria-pressed={aiDecides}
        className={cn(
          'w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all mb-3',
          aiDecides
            ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/15'
            : 'border-border/60 bg-card shadow-sm shadow-foreground/5 hover:border-primary/30'
        )}
      >
        <span className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
          aiDecides ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          <Sparkles className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className={cn('block text-sm font-semibold', aiDecides ? 'text-primary' : 'text-foreground')}>
            {t('preferences.aiDecides', 'Überspringen: KI entscheidet')}
          </span>
          <span className="block text-xs text-muted-foreground">
            {t('preferences.aiDecidesHint', 'Die KI gewichtet alles passend zu deiner Kategorie.')}
          </span>
        </span>
        {aiDecides && (
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
        )}
      </button>

      {!aiDecides && (
      <div className="space-y-3">
        {visible.map(d => {
          const level = weightToLevel(weights[d.key]);
          const isHighlighted = level === 'high';
          const Icon = d.icon;
          return (
            <div
              key={d.key}
              className={cn(
                'p-3 rounded-xl border transition-colors',
                isHighlighted ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              )}
            >
              <span className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <Icon className={cn(
                  'w-4 h-4',
                  isHighlighted ? 'text-primary' : 'text-muted-foreground'
                )} />
                {t(d.labelKey, d.fallback)}
              </span>
              <div className="flex gap-2" role="radiogroup" aria-label={t(d.labelKey, d.fallback)}>
                {LEVELS.map(l => {
                  const active = level === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleSelect(d.key, l.weight)}
                      className={cn(
                        'flex-1 rounded-full border px-2 py-1.5 text-xs font-semibold transition-colors',
                        active
                          ? l.id === 'high'
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {t(l.labelKey, l.fallback)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default PriorityPicker;
