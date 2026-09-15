import React from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, Sparkles, Wallet, MapPin, type LucideIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  getVisiblePriorityDimensions,
  getCategoryPriorityWeights,
  type PriorityDimensionId,
} from '@/lib/categoryWizardConfig';
import type { SituationalCategoryId } from '@/lib/situationalCategories';
import CategoryPriorityHint from '@/components/category/CategoryPriorityHint';

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

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-1">Was ist dir am wichtigsten?</p>
      <p className="text-xs text-muted-foreground mb-3">
        {categoryId
          ? t('preferences.priorityIntro')
          : 'Gewichte, welche Faktoren die KI stärker berücksichtigen soll'}
      </p>
      {categoryId && <CategoryPriorityHint categoryId={categoryId} className="mb-3" />}
      <div className="space-y-3">
        {visible.map(d => {
          const val = weights[d.key];
          const isHighlighted = val > 1.2;
          const Icon = d.icon;
          return (
            <div
              key={d.key}
              className={cn(
                'p-3 rounded-xl border transition-colors',
                isHighlighted ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Icon className={cn(
                    'w-4 h-4',
                    isHighlighted ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  {t(d.labelKey, d.fallback)}
                </span>
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  val >= 1.5 ? 'bg-primary/15 text-primary' :
                  val >= 1.2 ? 'bg-primary/10 text-primary/80' :
                  'bg-muted text-muted-foreground'
                )}>
                  {val <= 0.7 ? 'Niedrig' : val <= 1.2 ? 'Normal' : val <= 1.5 ? 'Hoch' : 'Max'}
                </span>
              </div>
              <Slider
                value={[val]}
                onValueChange={v => handleChange(d.key, v)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Egal</span>
                <span>Sehr wichtig</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityPicker;
