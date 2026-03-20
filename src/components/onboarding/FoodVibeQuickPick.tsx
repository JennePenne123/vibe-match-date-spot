import React from 'react';
import { cn } from '@/lib/utils';
import { Pizza, Fish, Flame, Croissant, Soup, Leaf, Beef, CookingPot } from 'lucide-react';
import { Icon } from 'lucide-react';
import { bowlChopsticks } from '@lucide/lab';

interface FoodVibeQuickPickProps {
  selectedCuisines: string[];
  selectedVibes: string[];
  onCuisinesChange: (cuisines: string[]) => void;
  onVibesChange: (vibes: string[]) => void;
}

const cuisineOptions = [
  { id: 'italian', label: 'Italienisch', emoji: '🍝', icon: Pizza, color: 'text-red-400' },
  { id: 'japanese', label: 'Japanisch', emoji: '🍣', icon: Fish, color: 'text-orange-400' },
  { id: 'mexican', label: 'Mexikanisch', emoji: '🌮', icon: Flame, color: 'text-yellow-500' },
  { id: 'french', label: 'Französisch', emoji: '🥐', icon: Croissant, color: 'text-amber-400' },
  { id: 'indian', label: 'Indisch', emoji: '🍛', icon: Soup, color: 'text-orange-500' },
  { id: 'mediterranean', label: 'Mediterran', emoji: '🫒', icon: Leaf, color: 'text-emerald-400' },
  { id: 'american', label: 'Amerikanisch', emoji: '🍔', icon: Beef, color: 'text-sky-400' },
  { id: 'thai', label: 'Thai', emoji: '🍜', icon: CookingPot, color: 'text-lime-400' },
  { id: 'chinese', label: 'Chinesisch', emoji: '🥢', icon: null, color: 'text-rose-400' },
  { id: 'korean', label: 'Koreanisch', emoji: '🍲', icon: CookingPot, color: 'text-violet-400' },
];

const vibeOptions = [
  { id: 'romantic', label: 'Romantisch', emoji: '💕' },
  { id: 'casual', label: 'Entspannt', emoji: '😊' },
  { id: 'outdoor', label: 'Draußen', emoji: '🌳' },
  { id: 'nightlife', label: 'Nachtleben', emoji: '🌃' },
  { id: 'cultural', label: 'Kultur', emoji: '🎭' },
  { id: 'adventurous', label: 'Abenteuer', emoji: '🗺️' },
];

const FoodVibeQuickPick: React.FC<FoodVibeQuickPickProps> = ({
  selectedCuisines, selectedVibes, onCuisinesChange, onVibesChange,
}) => {
  const toggleCuisine = (id: string) => {
    onCuisinesChange(
      selectedCuisines.includes(id)
        ? selectedCuisines.filter((c) => c !== id)
        : [...selectedCuisines, id]
    );
  };

  const toggleVibe = (id: string) => {
    onVibesChange(
      selectedVibes.includes(id)
        ? selectedVibes.filter((v) => v !== id)
        : [...selectedVibes, id]
    );
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Essen & Stimmung
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Was isst du gerne und welche Vibes magst du?
        </p>
      </div>

      {/* Cuisines */}
      <div>
        <p className="text-sm font-medium text-foreground/80 mb-2.5">🍽️ Lieblingsküchen</p>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((opt) => {
            const isActive = selectedCuisines.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleCuisine(opt.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.96]',
                  isActive
                    ? 'bg-primary/10 border-primary/40 text-foreground'
                    : 'bg-card/40 border-border/30 text-muted-foreground hover:bg-card/60'
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vibes */}
      <div>
        <p className="text-sm font-medium text-foreground/80 mb-2.5">✨ Deine Vibes</p>
        <div className="flex flex-wrap gap-2">
          {vibeOptions.map((opt) => {
            const isActive = selectedVibes.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleVibe(opt.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.96]',
                  isActive
                    ? 'bg-primary/10 border-primary/40 text-foreground'
                    : 'bg-card/40 border-border/30 text-muted-foreground hover:bg-card/60'
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FoodVibeQuickPick;
