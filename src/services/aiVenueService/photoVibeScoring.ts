/**
 * Photo-based Vibe Scoring (Signal #15)
 * 
 * Extracts vibe signals from venue photo metadata (tags assigned by partners)
 * and applies scoring modifiers to improve atmosphere matching.
 */

export interface PhotoVibe {
  url: string;
  vibeTags?: string[];
  isGooglePhoto?: boolean;
}

// Map photo vibe tags to scoring categories
const PHOTO_VIBE_CATEGORIES: Record<string, { vibes: string[]; weight: number }> = {
  'candlelight': { vibes: ['romantic', 'cozy', 'elegant'], weight: 0.04 },
  'dim-lighting': { vibes: ['romantic', 'cozy', 'lively'], weight: 0.03 },
  'bright-modern': { vibes: ['trendy', 'casual'], weight: 0.03 },
  'outdoor-terrace': { vibes: ['outdoor', 'casual', 'lively'], weight: 0.03 },
  'garden-green': { vibes: ['outdoor', 'cozy', 'family'], weight: 0.03 },
  'rooftop-view': { vibes: ['trendy', 'romantic', 'adventurous'], weight: 0.04 },
  'rustic-wood': { vibes: ['cozy', 'casual', 'cultural'], weight: 0.03 },
  'industrial-chic': { vibes: ['trendy', 'lively', 'adventurous'], weight: 0.03 },
  'fine-dining': { vibes: ['elegant', 'romantic'], weight: 0.04 },
  'cocktail-bar': { vibes: ['trendy', 'lively', 'romantic'], weight: 0.03 },
  'live-music': { vibes: ['lively', 'cultural', 'adventurous'], weight: 0.03 },
  'family-friendly': { vibes: ['family', 'casual'], weight: 0.03 },
  'art-decor': { vibes: ['cultural', 'trendy', 'elegant'], weight: 0.03 },
  'waterfront': { vibes: ['romantic', 'outdoor', 'adventurous'], weight: 0.04 },
  'cozy-interior': { vibes: ['cozy', 'romantic', 'casual'], weight: 0.03 },
  'minimalist': { vibes: ['trendy', 'elegant'], weight: 0.02 },
  'colorful-eclectic': { vibes: ['adventurous', 'lively', 'cultural'], weight: 0.03 },
  'fireplace': { vibes: ['cozy', 'romantic'], weight: 0.04 },
};

/** All available photo vibe tags for the partner UI */
export const AVAILABLE_PHOTO_VIBES = Object.keys(PHOTO_VIBE_CATEGORIES);

/** Human-readable labels for photo vibe tags */
export const PHOTO_VIBE_LABELS: Record<string, { label: string; emoji: string }> = {
  'candlelight': { label: 'Kerzenlicht', emoji: '🕯️' },
  'dim-lighting': { label: 'Gedimmtes Licht', emoji: '🌙' },
  'bright-modern': { label: 'Hell & Modern', emoji: '☀️' },
  'outdoor-terrace': { label: 'Außenterrasse', emoji: '🏖️' },
  'garden-green': { label: 'Garten', emoji: '🌿' },
  'rooftop-view': { label: 'Rooftop', emoji: '🌆' },
  'rustic-wood': { label: 'Rustikal', emoji: '🪵' },
  'industrial-chic': { label: 'Industrial', emoji: '🏭' },
  'fine-dining': { label: 'Fine Dining', emoji: '🍽️' },
  'cocktail-bar': { label: 'Cocktailbar', emoji: '🍸' },
  'live-music': { label: 'Live Musik', emoji: '🎵' },
  'family-friendly': { label: 'Familienfreundlich', emoji: '👨‍👩‍👧' },
  'art-decor': { label: 'Kunst & Deko', emoji: '🎨' },
  'waterfront': { label: 'Am Wasser', emoji: '🌊' },
  'cozy-interior': { label: 'Gemütlich', emoji: '🛋️' },
  'minimalist': { label: 'Minimalistisch', emoji: '◻️' },
  'colorful-eclectic': { label: 'Bunt & Eklektisch', emoji: '🌈' },
  'fireplace': { label: 'Kamin', emoji: '🔥' },
};

/**
 * Extract all unique vibe signals from a venue's photo collection
 */
export const extractPhotoVibes = (photos: PhotoVibe[]): string[] => {
  const vibeSet = new Set<string>();

  for (const photo of photos) {
    if (photo.vibeTags) {
      for (const tag of photo.vibeTags) {
        const category = PHOTO_VIBE_CATEGORIES[tag];
        if (category) {
          category.vibes.forEach(v => vibeSet.add(v));
        }
      }
    }
  }

  return Array.from(vibeSet);
};

/**
 * Calculate photo vibe score modifier based on user's preferred vibes
 * Returns a value between -0.02 and +0.12
 */
export const getPhotoVibeScoreModifier = (
  photos: PhotoVibe[] | null | undefined,
  userPreferredVibes: string[] | null | undefined
): { modifier: number; matchedVibes: string[]; photoVibeSignals: string[] } => {
  if (!photos || photos.length === 0 || !userPreferredVibes || userPreferredVibes.length === 0) {
    return { modifier: 0, matchedVibes: [], photoVibeSignals: [] };
  }

  // Collect all vibe tags from photos with their weights
  const vibeWeights = new Map<string, number>();
  const allPhotoTags: string[] = [];

  for (const photo of photos) {
    if (!photo.vibeTags) continue;
    for (const tag of photo.vibeTags) {
      allPhotoTags.push(tag);
      const category = PHOTO_VIBE_CATEGORIES[tag];
      if (!category) continue;
      for (const vibe of category.vibes) {
        const current = vibeWeights.get(vibe) || 0;
        vibeWeights.set(vibe, current + category.weight);
      }
    }
  }

  if (vibeWeights.size === 0) {
    return { modifier: 0, matchedVibes: [], photoVibeSignals: allPhotoTags };
  }

  // Match against user's preferred vibes
  let modifier = 0;
  const matchedVibes: string[] = [];
  const userVibesLower = userPreferredVibes.map(v => v.toLowerCase());

  for (const [vibe, weight] of vibeWeights) {
    if (userVibesLower.includes(vibe)) {
      modifier += Math.min(weight, 0.06); // Cap per-vibe contribution
      matchedVibes.push(vibe);
    }
  }

  // Cap total modifier
  const cappedModifier = Math.max(-0.02, Math.min(0.12, modifier));

  return {
    modifier: cappedModifier,
    matchedVibes,
    photoVibeSignals: allPhotoTags,
  };
};

/**
 * Get a human-readable label for photo vibe influence
 */
export const getPhotoVibeLabel = (matchedVibes: string[]): string | null => {
  if (matchedVibes.length === 0) return null;
  if (matchedVibes.length === 1) return `📸 Photo-Vibe: ${matchedVibes[0]}`;
  return `📸 Photo-Vibes: ${matchedVibes.slice(0, 3).join(', ')}`;
};
