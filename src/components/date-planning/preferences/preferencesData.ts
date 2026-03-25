import type { DateOccasion } from '@/services/aiVenueService/occasionScoring';

// ── Types ──────────────────────────────────────────────────────

export type { DateOccasion };

export interface Preference {
  id: string;
  name: string;
  emoji: string;
}

export interface UserPreferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

export interface CompatibilityScore {
  overall_score: number;
  cuisine_score: number;
  vibe_score: number;
  price_score: number;
  timing_score: number;
  compatibility_factors: string[];
}

export interface DatePreferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
  preferred_date?: Date;
  preferred_time?: string;
  occasion?: DateOccasion | null;
  priority_weights?: {
    cuisine: number;
    vibe: number;
    price: number;
    location: number;
  };
}

export interface DurationModel {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  excludeVibes: string[];
  suggestTimes: string[];
  suggestPrice: string[];
}

export interface QuickStartTemplate {
  id: string;
  title: string;
  emoji: string;
  cuisines: string[];
  vibes: string[];
  priceRange: string[];
  timePreferences: string[];
  fitsDuration: string[];
}

// ── Data ──────────────────────────────────────────────────────

export const cuisines: Preference[] = [
  { id: 'Italian', name: 'Italienisch', emoji: '🍝' },
  { id: 'Japanese', name: 'Japanisch', emoji: '🍣' },
  { id: 'Mexican', name: 'Mexikanisch', emoji: '🌮' },
  { id: 'French', name: 'Französisch', emoji: '🥐' },
  { id: 'Indian', name: 'Indisch', emoji: '🍛' },
  { id: 'Mediterranean', name: 'Mediterran', emoji: '🫒' },
  { id: 'American', name: 'Amerikanisch', emoji: '🍔' },
  { id: 'Thai', name: 'Thai', emoji: '🍜' },
  { id: 'Chinese', name: 'Chinesisch', emoji: '🥢' },
  { id: 'Korean', name: 'Koreanisch', emoji: '🍲' },
];

export const durationModels: DurationModel[] = [
  { id: 'quick', title: 'Quick & Sweet', emoji: '⚡', desc: '1–2 h', excludeVibes: ['lively'], suggestTimes: ['morning', 'lunch', 'afternoon'], suggestPrice: ['$', '$$'] },
  { id: 'relaxed', title: 'Relaxed', emoji: '☀️', desc: '2–4 h', excludeVibes: [], suggestTimes: ['lunch', 'afternoon'], suggestPrice: ['$$', '$$$'] },
  { id: 'evening', title: 'Full Evening', emoji: '🌆', desc: '4+ h', excludeVibes: [], suggestTimes: ['evening', 'night'], suggestPrice: ['$$', '$$$', '$$$$'] },
  { id: 'adventure', title: 'All-Day', emoji: '🗺️', desc: 'Ganzer Tag', excludeVibes: [], suggestTimes: ['morning', 'lunch', 'afternoon', 'evening'], suggestPrice: ['$', '$$', '$$$'] },
];

export const allVibes: Preference[] = [
  { id: 'romantic', name: 'Romantisch', emoji: '💕' },
  { id: 'casual', name: 'Casual', emoji: '😊' },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
  { id: 'upscale', name: 'Upscale', emoji: '✨' },
  { id: 'lively', name: 'Lively', emoji: '🎉' },
  { id: 'cozy', name: 'Gemütlich', emoji: '🕯️' },
];

export const priceRanges: Preference[] = [
  { id: '$', name: 'Budget', emoji: '💰' },
  { id: '$$', name: 'Moderate', emoji: '💳' },
  { id: '$$$', name: 'Gehoben', emoji: '💎' },
  { id: '$$$$', name: 'Luxus', emoji: '👑' },
];

export const timePreferences: Preference[] = [
  { id: 'morning', name: 'Morgens', emoji: '🌅' },
  { id: 'lunch', name: 'Mittag', emoji: '☀️' },
  { id: 'afternoon', name: 'Nachmittag', emoji: '🌤️' },
  { id: 'evening', name: 'Abend', emoji: '🌆' },
  { id: 'night', name: 'Nacht', emoji: '🌙' },
];

export const dietaryRequirements: Preference[] = [
  { id: 'vegetarian', name: 'Vegetarisch', emoji: '🥬' },
  { id: 'vegan', name: 'Vegan', emoji: '🌱' },
  { id: 'gluten-free', name: 'Glutenfrei', emoji: '🚫' },
  { id: 'dairy-free', name: 'Laktosefrei', emoji: '🥛' },
  { id: 'halal', name: 'Halal', emoji: '☪️' },
  { id: 'kosher', name: 'Koscher', emoji: '✡️' },
];

export const quickStartTemplates: QuickStartTemplate[] = [
  { id: 'romantic-dinner', title: 'Romantic Dinner', emoji: '💕', cuisines: ['Italian', 'French'], vibes: ['romantic', 'upscale'], priceRange: ['$$$', '$$$$'], timePreferences: ['evening'], fitsDuration: ['evening', 'adventure'] },
  { id: 'casual-brunch', title: 'Casual Brunch', emoji: '☕', cuisines: ['American', 'Mediterranean'], vibes: ['casual', 'cozy'], priceRange: ['$', '$$'], timePreferences: ['morning', 'lunch'], fitsDuration: ['quick', 'relaxed', 'adventure'] },
  { id: 'trendy-cocktail', title: 'Cocktail Bar', emoji: '🍸', cuisines: ['American'], vibes: ['lively', 'upscale'], priceRange: ['$$', '$$$'], timePreferences: ['evening', 'night'], fitsDuration: ['evening'] },
  { id: 'coffee-walk', title: 'Coffee & Walk', emoji: '☕🚶', cuisines: ['American', 'Italian'], vibes: ['casual', 'outdoor'], priceRange: ['$'], timePreferences: ['morning', 'afternoon'], fitsDuration: ['quick'] },
];

export const emojiMap: Record<string, string> = {
  Italian: '🍝', Japanese: '🍣', Mexican: '🌮', French: '🥐', Indian: '🍛',
  Mediterranean: '🫒', American: '🍔', Thai: '🍜', Chinese: '🥢', Korean: '🍲',
  romantic: '💕', casual: '😊', outdoor: '🌳', upscale: '✨', lively: '🎉', cozy: '🕯️',
};

export interface OccasionOption {
  id: DateOccasion;
  label: string;
  emoji: string;
  desc: string;
}

export const occasionOptions: OccasionOption[] = [
  { id: 'first_date', label: 'Erstes Date', emoji: '🦋', desc: 'Locker & einladend' },
  { id: 'anniversary', label: 'Jahrestag', emoji: '💍', desc: 'Romantisch & besonders' },
  { id: 'casual', label: 'Entspannt', emoji: '😊', desc: 'Ohne Erwartungen' },
  { id: 'birthday', label: 'Geburtstag', emoji: '🎂', desc: 'Feierlich & spaßig' },
  { id: 'friends_hangout', label: 'Freunde-Treffen', emoji: '🍻', desc: 'Locker & gesellig' },
  { id: 'special_celebration', label: 'Besonderer Anlass', emoji: '🥂', desc: 'Exklusiv & elegant' },
];

// ── Helpers ──────────────────────────────────────────────────────

export const summaryText = (items: string[], all: Preference[]) => {
  if (!items.length) return 'Keine Auswahl';
  const mapped = items.map(id => all.find(x => x.id === id)).filter(Boolean).map(x => `${x!.emoji} ${x!.name}`);
  return mapped.length <= 2 ? mapped.join(', ') : `${mapped.slice(0, 2).join(', ')} +${mapped.length - 2}`;
};

export const haveSame = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
