import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Sparkles, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export interface VenueSwipeData {
  liked: string[];    // venue style IDs the user liked
  disliked: string[]; // venue style IDs the user disliked
}

interface VenueSwipeCardsProps {
  data: VenueSwipeData;
  onChange: (data: VenueSwipeData) => void;
  distanceKm: number;
  onDistanceChange: (km: number) => void;
  onLocationCaptured?: (lat: number, lng: number) => void;
}

// Representative venue "cards" that encode cuisine, vibe, and price signals
const venueCards = [
  {
    id: 'italian-romantic',
    name: 'La Bella Vita',
    emoji: '🕯️🍝',
    vibe: 'Romantisches Candle-Light-Dinner',
    cuisine: 'italian',
    price: '$$$',
    vibes: ['romantic', 'elegant'],
    tags: ['Italian', 'Fine Dining'],
  },
  {
    id: 'street-food-casual',
    name: 'Street Bites Market',
    emoji: '🌮🎉',
    vibe: 'Lebhafter Street-Food-Markt',
    cuisine: 'mexican',
    price: '$',
    vibes: ['casual', 'lively'],
    tags: ['Street Food', 'Casual'],
  },
  {
    id: 'sushi-trendy',
    name: 'Omakase House',
    emoji: '🍣✨',
    vibe: 'Trendiges Sushi-Erlebnis',
    cuisine: 'japanese',
    price: '$$$$',
    vibes: ['trendy', 'elegant'],
    tags: ['Japanese', 'Omakase'],
  },
  {
    id: 'biergarten-outdoor',
    name: 'Zum Alten Biergarten',
    emoji: '🍺🌳',
    vibe: 'Gemütlicher Biergarten im Freien',
    cuisine: 'german',
    price: '$$',
    vibes: ['outdoor', 'casual', 'cozy'],
    tags: ['German', 'Beer Garden'],
  },
  {
    id: 'cocktail-nightlife',
    name: 'Noir Speakeasy',
    emoji: '🍸🌃',
    vibe: 'Versteckte Cocktailbar mit Live-Jazz',
    cuisine: 'bar',
    price: '$$$',
    vibes: ['nightlife', 'adventurous'],
    tags: ['Cocktails', 'Live Music'],
  },
  {
    id: 'thai-cozy',
    name: 'Lotus Garden',
    emoji: '🍜🕯️',
    vibe: 'Gemütliches Thai-Restaurant',
    cuisine: 'thai',
    price: '$$',
    vibes: ['cozy', 'casual'],
    tags: ['Thai', 'Cozy'],
  },
];

const VenueSwipeCards: React.FC<VenueSwipeCardsProps> = ({ data, onChange, distanceKm, onDistanceChange, onLocationCaptured }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const handleSwipe = (direction: 'like' | 'dislike') => {
    const card = venueCards[currentIndex];
    if (!card) return;

    const newData = { ...data };
    if (direction === 'like') {
      newData.liked = [...newData.liked.filter(id => id !== card.id), card.id];
      newData.disliked = newData.disliked.filter(id => id !== card.id);
    } else {
      newData.disliked = [...newData.disliked.filter(id => id !== card.id), card.id];
      newData.liked = newData.liked.filter(id => id !== card.id);
    }

    onChange(newData);
    setCurrentIndex(prev => prev + 1);
  };

  const totalSwiped = data.liked.length + data.disliked.length;
  const allDone = currentIndex >= venueCards.length;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Was gefällt dir?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Swipe durch Venue-Ideen – die KI lernt sofort deinen Geschmack.
        </p>
      </div>

      {!allDone ? (
        <>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-3">
            {venueCards.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i < currentIndex
                    ? data.liked.includes(venueCards[i].id)
                      ? 'bg-green-400'
                      : 'bg-red-400/60'
                    : i === currentIndex
                    ? 'bg-primary w-4'
                    : 'bg-muted-foreground/20'
                )}
              />
            ))}
          </div>

          {/* Current card */}
          <div className="relative flex justify-center">
            <div className="w-full max-w-[280px] rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 text-center shadow-lg">
              <div className="text-5xl mb-3">{venueCards[currentIndex].emoji}</div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {venueCards[currentIndex].name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {venueCards[currentIndex].vibe}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {venueCards[currentIndex].tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 font-medium"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {venueCards[currentIndex].price}
                </span>
              </div>
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="flex justify-center gap-6 mt-4">
            <button
              onClick={() => handleSwipe('dislike')}
              className="w-14 h-14 rounded-full border-2 border-red-400/40 bg-red-400/10 flex items-center justify-center transition-all duration-200 active:scale-90 hover:bg-red-400/20"
            >
              <ThumbsDown className="w-6 h-6 text-red-400" />
            </button>
            <button
              onClick={() => handleSwipe('like')}
              className="w-14 h-14 rounded-full border-2 border-green-400/40 bg-green-400/10 flex items-center justify-center transition-all duration-200 active:scale-90 hover:bg-green-400/20"
            >
              <ThumbsUp className="w-6 h-6 text-green-400" />
            </button>
          </div>
        </>
      ) : (
        /* Completion state + distance slider */
        <div className="flex flex-col items-center py-4 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Super, {totalSwiped} Signale erfasst!
            </h3>
            <div className="flex gap-3 text-sm justify-center">
              <span className="text-green-400 font-medium">👍 {data.liked.length} gefällt</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-red-400/80 font-medium">👎 {data.disliked.length} nicht so</span>
            </div>
          </div>

          {/* Integrated distance preference */}
          <div className="w-full border-t border-border/20 pt-5">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Wie weit darf's sein?</span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl font-bold text-foreground">{distanceKm}</span>
              <span className="text-sm text-muted-foreground">km</span>
            </div>
            <div className="w-full max-w-[260px] mx-auto px-2">
              <Slider
                value={[distanceKm]}
                onValueChange={([val]) => onDistanceChange(val)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>1 km</span>
                <span>20 km</span>
            </div>
          </div>

          {/* Optional GPS location */}
          <div className="w-full border-t border-border/20 pt-4">
            {locationStatus === 'granted' ? (
              <div className="flex items-center justify-center gap-2 text-xs text-primary">
                <Navigation className="w-3.5 h-3.5" />
                <span className="font-medium">Standort erfasst ✓</span>
              </div>
            ) : locationStatus === 'denied' ? (
              <p className="text-xs text-muted-foreground/60 text-center">
                Kein Problem – die KI nutzt dann allgemeine Empfehlungen.
              </p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                disabled={locationStatus === 'loading'}
                onClick={() => {
                  setLocationStatus('loading');
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setLocationStatus('granted');
                      onLocationCaptured?.(pos.coords.latitude, pos.coords.longitude);
                    },
                    () => setLocationStatus('denied'),
                    { timeout: 10000, enableHighAccuracy: false }
                  );
                }}
              >
                {locationStatus === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 mr-1.5" />
                )}
                Standort freigeben (optional)
              </Button>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default VenueSwipeCards;

/**
 * Derives AI-relevant preferences from swipe data.
 * Used after onboarding to enrich cold-start signals.
 */
export function deriveSwipePreferences(data: VenueSwipeData) {
  const likedCards = venueCards.filter(c => data.liked.includes(c.id));
  const dislikedCards = venueCards.filter(c => data.disliked.includes(c.id));

  const likedCuisines = [...new Set(likedCards.map(c => c.cuisine).filter(Boolean))];
  const dislikedCuisines = [...new Set(dislikedCards.map(c => c.cuisine).filter(Boolean))];
  const likedVibes = [...new Set(likedCards.flatMap(c => c.vibes))];
  const likedPrices = [...new Set(likedCards.map(c => c.price))];

  // Infer price preference
  const priceMap: Record<string, string> = {
    '$': 'budget', '$$': 'moderate', '$$$': 'upscale', '$$$$': 'luxury'
  };
  const inferredPrices = likedPrices.map(p => priceMap[p]).filter(Boolean);

  return {
    likedCuisines,
    dislikedCuisines,
    likedVibes,
    inferredPrices,
  };
}
