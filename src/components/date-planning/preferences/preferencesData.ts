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
  { id: 'quick', title: 'datePlanning.durationQuick', emoji: '⚡', desc: 'datePlanning.durationQuickDesc', excludeVibes: ['lively'], suggestTimes: ['morning', 'lunch', 'afternoon'], suggestPrice: ['$', '$$'] },
  { id: 'relaxed', title: 'datePlanning.durationRelaxed', emoji: '☀️', desc: 'datePlanning.durationRelaxedDesc', excludeVibes: [], suggestTimes: ['lunch', 'afternoon'], suggestPrice: ['$$', '$$$'] },
  { id: 'evening', title: 'datePlanning.durationEvening', emoji: '🌆', desc: 'datePlanning.durationEveningDesc', excludeVibes: [], suggestTimes: ['evening', 'night'], suggestPrice: ['$$', '$$$', '$$$$'] },
  { id: 'adventure', title: 'datePlanning.durationAdventure', emoji: '🗺️', desc: 'datePlanning.durationAdventureDesc', excludeVibes: [], suggestTimes: ['morning', 'lunch', 'afternoon', 'evening'], suggestPrice: ['$', '$$', '$$$'] },
];

export const allVibes: Preference[] = [
  { id: 'romantic', name: 'datePlanning.vibeRomantic', emoji: '💕' },
  { id: 'casual', name: 'datePlanning.vibeCasual', emoji: '😊' },
  { id: 'outdoor', name: 'datePlanning.vibeOutdoor', emoji: '🌳' },
  { id: 'upscale', name: 'datePlanning.vibeUpscale', emoji: '✨' },
  { id: 'lively', name: 'datePlanning.vibeLively', emoji: '🎉' },
  { id: 'cozy', name: 'datePlanning.vibeCozy', emoji: '🕯️' },
];

export const priceRanges: Preference[] = [
  { id: '$', name: 'datePlanning.priceBudget', emoji: '💰' },
  { id: '$$', name: 'datePlanning.priceModerate', emoji: '💳' },
  { id: '$$$', name: 'datePlanning.priceUpscale', emoji: '💎' },
  { id: '$$$$', name: 'datePlanning.priceLuxury', emoji: '👑' },
];

export const timePreferences: Preference[] = [
  { id: 'morning', name: 'datePlanning.timeMorning', emoji: '🌅' },
  { id: 'lunch', name: 'datePlanning.timeLunch', emoji: '☀️' },
  { id: 'afternoon', name: 'datePlanning.timeAfternoon', emoji: '🌤️' },
  { id: 'evening', name: 'datePlanning.timeEvening', emoji: '🌆' },
  { id: 'night', name: 'datePlanning.timeNight', emoji: '🌙' },
];

export const dietaryRequirements: Preference[] = [
  { id: 'vegetarian', name: 'preferences.dietary_vegetarian', emoji: '🥬' },
  { id: 'vegan', name: 'preferences.dietary_vegan', emoji: '🌱' },
  { id: 'gluten-free', name: 'preferences.dietary_gluten_free', emoji: '🚫' },
  { id: 'dairy-free', name: 'preferences.dietary_dairy_free', emoji: '🥛' },
  { id: 'halal', name: 'preferences.dietary_halal', emoji: '☪️' },
  { id: 'kosher', name: 'preferences.dietary_kosher', emoji: '✡️' },
];

export const quickStartTemplates: QuickStartTemplate[] = [
  { id: 'romantic-dinner', title: 'datePlanning.templateRomanticDinner', emoji: '💕', cuisines: ['Italian', 'French'], vibes: ['romantic', 'upscale'], priceRange: ['$$$', '$$$$'], timePreferences: ['evening'], fitsDuration: ['evening', 'adventure'] },
  { id: 'casual-brunch', title: 'datePlanning.templateCasualBrunch', emoji: '☕', cuisines: ['American', 'Mediterranean'], vibes: ['casual', 'cozy'], priceRange: ['$', '$$'], timePreferences: ['morning', 'lunch'], fitsDuration: ['quick', 'relaxed', 'adventure'] },
  { id: 'trendy-cocktail', title: 'datePlanning.templateCocktailBar', emoji: '🍸', cuisines: ['American'], vibes: ['lively', 'upscale'], priceRange: ['$$', '$$$'], timePreferences: ['evening', 'night'], fitsDuration: ['evening'] },
  { id: 'coffee-walk', title: 'datePlanning.templateCoffeeWalk', emoji: '☕🚶', cuisines: ['American', 'Italian'], vibes: ['casual', 'outdoor'], priceRange: ['$'], timePreferences: ['morning', 'afternoon'], fitsDuration: ['quick'] },
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
  { id: 'first_date', label: 'Erstes Date', emoji: 'Butterfly', desc: 'Locker & einladend' },
  { id: 'anniversary', label: 'Jahrestag', emoji: 'Heart', desc: 'Romantisch & besonders' },
  { id: 'casual', label: 'Entspannt', emoji: 'Coffee', desc: 'Ohne Erwartungen' },
  { id: 'birthday', label: 'Geburtstag', emoji: 'Cake', desc: 'Feierlich & spaßig' },
  { id: 'friends_hangout', label: 'Freunde-Treffen', emoji: 'Users', desc: 'Locker & gesellig' },
  { id: 'special_celebration', label: 'Besonderer Anlass', emoji: 'Sparkles', desc: 'Exklusiv & elegant' },
];

// ── Helpers ──────────────────────────────────────────────────────

export const summaryText = (items: string[], all: Preference[], tFn?: (key: string) => string) => {
  const translate = tFn || ((k: string) => k);
  if (!items.length) return translate('datePlanning.noSelection');
  const mapped = items.map(id => all.find(x => x.id === id)).filter(Boolean).map(x => `${x!.emoji} ${translate(x!.name)}`);
  return mapped.length <= 2 ? mapped.join(', ') : `${mapped.slice(0, 2).join(', ')} +${mapped.length - 2}`;
};

export const haveSame = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
