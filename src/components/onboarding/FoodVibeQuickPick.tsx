import React from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface FoodVibeQuickPickProps {
  selectedCuisines: string[];
  selectedVibes: string[];
  selectedDietary: string[];
  onCuisinesChange: (cuisines: string[]) => void;
  onVibesChange: (vibes: string[]) => void;
  onDietaryChange: (dietary: string[]) => void;
}

// Cuisine IDs MUST match those in src/components/date-planning/preferences/preferencesData.ts
// (capitalised English) so onboarding & plan-flow share the same AI signal space.
type CuisineGroup = 'europe' | 'asia' | 'americas' | 'mideast_africa' | 'other';
interface CuisineOption {
  id: string;
  label: string;
  emoji: string;
  group: CuisineGroup;
  popular?: boolean;
}

const cuisineOptions: CuisineOption[] = [
  // ── Europe ──
  { id: 'Italian', label: 'Italienisch', emoji: '🍝', group: 'europe', popular: true },
  { id: 'French', label: 'Französisch', emoji: '🥐', group: 'europe', popular: true },
  { id: 'Spanish', label: 'Spanisch', emoji: '🥘', group: 'europe', popular: true },
  { id: 'Greek', label: 'Griechisch', emoji: '🥙', group: 'europe', popular: true },
  { id: 'German', label: 'Deutsch', emoji: '🥨', group: 'europe', popular: true },
  { id: 'Mediterranean', label: 'Mediterran', emoji: '🫒', group: 'europe', popular: true },
  { id: 'Portuguese', label: 'Portugiesisch', emoji: '🐟', group: 'europe' },
  { id: 'Austrian', label: 'Österreichisch', emoji: '🥟', group: 'europe' },
  { id: 'Swiss', label: 'Schweizerisch', emoji: '🧀', group: 'europe' },
  { id: 'British', label: 'Britisch', emoji: '🥧', group: 'europe' },
  { id: 'Nordic', label: 'Nordisch', emoji: '🐟', group: 'europe' },
  { id: 'Polish', label: 'Polnisch', emoji: '🥟', group: 'europe' },
  { id: 'Hungarian', label: 'Ungarisch', emoji: '🌶️', group: 'europe' },
  { id: 'Russian', label: 'Russisch', emoji: '🥟', group: 'europe' },
  { id: 'Balkan', label: 'Balkan', emoji: '🍖', group: 'europe' },
  // ── Asia ──
  { id: 'Japanese', label: 'Japanisch', emoji: '🍣', group: 'asia', popular: true },
  { id: 'Thai', label: 'Thai', emoji: '🍜', group: 'asia', popular: true },
  { id: 'Chinese', label: 'Chinesisch', emoji: '🥢', group: 'asia', popular: true },
  { id: 'Indian', label: 'Indisch', emoji: '🍛', group: 'asia', popular: true },
  { id: 'Vietnamese', label: 'Vietnamesisch', emoji: '🍲', group: 'asia' },
  { id: 'Korean', label: 'Koreanisch', emoji: '🍲', group: 'asia' },
  { id: 'Indonesian', label: 'Indonesisch', emoji: '🍤', group: 'asia' },
  // ── Americas ──
  { id: 'American', label: 'Amerikanisch', emoji: '🍔', group: 'americas', popular: true },
  { id: 'Mexican', label: 'Mexikanisch', emoji: '🌮', group: 'americas', popular: true },
  { id: 'Brazilian', label: 'Brasilianisch', emoji: '🥩', group: 'americas' },
  { id: 'Argentinian', label: 'Argentinisch', emoji: '🥩', group: 'americas' },
  { id: 'Peruvian', label: 'Peruanisch', emoji: '🐟', group: 'americas' },
  { id: 'Caribbean', label: 'Karibisch', emoji: '🌴', group: 'americas' },
  // ── Middle East & Africa ──
  { id: 'Turkish', label: 'Türkisch', emoji: '🥙', group: 'mideast_africa', popular: true },
  { id: 'Oriental', label: 'Orientalisch', emoji: '🧆', group: 'mideast_africa' },
  { id: 'Lebanese', label: 'Libanesisch', emoji: '🧆', group: 'mideast_africa' },
  { id: 'Moroccan', label: 'Marokkanisch', emoji: '🍲', group: 'mideast_africa' },
  { id: 'Ethiopian', label: 'Äthiopisch', emoji: '🍛', group: 'mideast_africa' },
  // ── Other ──
  { id: 'Fusion', label: 'Fusion', emoji: '🌍', group: 'other' },
];

const groupLabels: Record<CuisineGroup, string> = {
  europe: 'Europa',
  asia: 'Asien',
  americas: 'Amerika',
  mideast_africa: 'Naher Osten & Afrika',
  other: 'Weitere',
};

const vibeOptions = [
  { id: 'romantic', label: 'Romantisch', emoji: '💕' },
  { id: 'casual', label: 'Entspannt', emoji: '😊' },
  { id: 'outdoor', label: 'Draußen', emoji: '🌳' },
  { id: 'nightlife', label: 'Nachtleben', emoji: '🌃' },
  { id: 'cultural', label: 'Kultur', emoji: '🎭' },
  { id: 'adventurous', label: 'Abenteuer', emoji: '🗺️' },
  { id: 'trendy', label: 'Trendy', emoji: '🔥' },
  { id: 'cozy', label: 'Gemütlich', emoji: '🕯️' },
  { id: 'elegant', label: 'Elegant', emoji: '✨' },
  { id: 'lively', label: 'Lebhaft', emoji: '🎉' },
  { id: 'family', label: 'Familiär', emoji: '👨‍👩‍👧' },
];

const dietaryOptions = [
  { id: 'vegetarian', label: 'Vegetarisch', emoji: '🥬' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'gluten_free', label: 'Glutenfrei', emoji: '🌾' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'kosher', label: 'Kosher', emoji: '✡️' },
  { id: 'lactose_free', label: 'Laktosefrei', emoji: '🥛' },
];

const FoodVibeQuickPick: React.FC<FoodVibeQuickPickProps> = ({
  selectedCuisines, selectedVibes, selectedDietary,
  onCuisinesChange, onVibesChange, onDietaryChange,
}) => {
  const [showAllCuisines, setShowAllCuisines] = React.useState(false);
  const [cuisineQuery, setCuisineQuery] = React.useState('');

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

  const toggleDietary = (id: string) => {
    onDietaryChange(
      selectedDietary.includes(id)
        ? selectedDietary.filter((d) => d !== id)
        : [...selectedDietary, id]
    );
  };

  // Always show selected items so users see their picks even when collapsed/filtered.
  const query = cuisineQuery.trim().toLowerCase();
  const visibleCuisines = cuisineOptions.filter((opt) => {
    if (selectedCuisines.includes(opt.id)) return true;
    if (query) return opt.label.toLowerCase().includes(query) || opt.id.toLowerCase().includes(query);
    if (showAllCuisines) return true;
    return opt.popular === true;
  });

  const groupedVisible = (Object.keys(groupLabels) as CuisineGroup[])
    .map((g) => ({ group: g, items: visibleCuisines.filter((o) => o.group === g) }))
    .filter((g) => g.items.length > 0);

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
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-medium text-foreground/80">
            🍽️ Lieblingsküchen
            {selectedCuisines.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({selectedCuisines.length} gewählt)
              </span>
            )}
          </p>
        </div>

        {(showAllCuisines || query) && (
          <div className="relative mb-2.5">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              inputMode="search"
              value={cuisineQuery}
              onChange={(e) => setCuisineQuery(e.target.value)}
              placeholder="Küche suchen…"
              className="w-full rounded-lg border border-border/40 bg-card/40 py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none"
            />
          </div>
        )}

        <div className="space-y-3">
          {groupedVisible.map(({ group, items }) => (
            <div key={group}>
              {(showAllCuisines || query) && (
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {groupLabels[group]}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {items.map((opt) => {
                  const isActive = selectedCuisines.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
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
          ))}

          {visibleCuisines.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-1">
              Keine Treffer für „{cuisineQuery}".
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAllCuisines((v) => !v);
            if (showAllCuisines) setCuisineQuery('');
          }}
          className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {showAllCuisines ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Alle {cuisineOptions.length} Küchen anzeigen
            </>
          )}
        </button>
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

      {/* Dietary Restrictions */}
      <div>
        <p className="text-sm font-medium text-foreground/80 mb-2.5">🥗 Ernährung <span className="text-muted-foreground font-normal">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((opt) => {
            const isActive = selectedDietary.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleDietary(opt.id)}
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
