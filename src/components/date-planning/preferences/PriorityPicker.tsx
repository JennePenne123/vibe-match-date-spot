import React from 'react';
import { UtensilsCrossed, Sparkles, Wallet, MapPin, type LucideIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

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

interface PriorityDimension {
  key: keyof PriorityWeights;
  icon: LucideIcon;
  label: string;
  low: string;
  high: string;
}

const dimensions: PriorityDimension[] = [
  { key: 'cuisine', icon: UtensilsCrossed, label: 'Essen', low: 'Egal', high: 'Sehr wichtig' },
  { key: 'vibe', icon: Sparkles, label: 'Atmosphäre', low: 'Egal', high: 'Sehr wichtig' },
  { key: 'price', icon: Wallet, label: 'Preis', low: 'Egal', high: 'Sehr wichtig' },
  { key: 'location', icon: MapPin, label: 'Nähe', low: 'Egal', high: 'Sehr wichtig' },
];

interface Props {
  weights: PriorityWeights;
  onChangeWeights: (weights: PriorityWeights) => void;
}

const PriorityPicker: React.FC<Props> = ({ weights, onChangeWeights }) => {
  const handleChange = (key: keyof PriorityWeights, value: number[]) => {
    onChangeWeights({ ...weights, [key]: value[0] });
  };

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-1">Was ist dir am wichtigsten?</p>
      <p className="text-xs text-muted-foreground mb-3">Gewichte, welche Faktoren die KI stärker berücksichtigen soll</p>
      <div className="space-y-3">
        {dimensions.map(d => {
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
                  {d.label}
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
                <span>{d.low}</span>
                <span>{d.high}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityPicker;
