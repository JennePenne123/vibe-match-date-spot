/**
 * Category-adaptive Preferences-Wizard configuration.
 *
 * The user picks a situational category on the Home screen (Food, Culture,
 * Activity, Nightlife). This config decides:
 *   1. Which accordion sections are shown in the Preferences wizard.
 *   2. Which items appear inside the "main" picker section
 *      (cuisines for Food, venue types for Culture / Activity / Nightlife).
 *
 * The selected items are mapped to the existing DB columns:
 *   - Food   → user_preferences.preferred_cuisines (existing behaviour)
 *   - Other  → user_preferences.preferred_venue_types
 *
 * No DB migration needed.
 */

import type { SituationalCategoryId } from '@/lib/situationalCategories';

export type WizardSectionId =
  | 'mainPicker'   // cuisines OR venue types — adaptive title/items
  | 'excluded'     // "Nie wieder vorschlagen" (only really useful for cuisines)
  | 'vibe'
  | 'dietary'
  | 'budget'
  | 'location'
  | 'timing'
  | 'accessibility';

export interface CategoryWizardConfig {
  /** i18n key for the main picker section title */
  mainPickerTitleKey: string;
  /** i18n key shown as small helper text under the section title */
  mainPickerHintKey?: string;
  /** Which DB column the main picker writes to */
  mainPickerStorage: 'preferred_cuisines' | 'preferred_venue_types';
  /** Sections to render (order matters for steps 1–2) */
  visibleSections: Set<WizardSectionId>;
  /** Item ids for the main picker (used to build the grid) */
  mainPickerItems: { id: string; nameKey: string }[];
  /** i18n key for Step 1's title in the header (defaults to "Geschmack") */
  step1TitleKey?: string;
  /** i18n key for Step 1's subtitle */
  step1SubtitleKey?: string;
  /** Optional whitelist of vibe ids to display — when omitted all vibes show */
  vibeWhitelist?: string[];
}

// Reused across non-food categories — kept in sync with venue_type tags
// understood by the recommendation pipeline.
const cultureItems = [
  { id: 'museum',         nameKey: 'preferences.venue_museum' },
  { id: 'gallery',        nameKey: 'preferences.venue_gallery' },
  { id: 'theater_venue',  nameKey: 'preferences.venue_theater' },
  { id: 'cinema',         nameKey: 'preferences.venue_cinema' },
  { id: 'concert_hall',   nameKey: 'preferences.venue_concert_hall' },
  { id: 'cultural_event', nameKey: 'preferences.venue_cultural_event' },
];

const activityItems = [
  { id: 'bowling',     nameKey: 'preferences.venue_bowling' },
  { id: 'mini_golf',   nameKey: 'preferences.venue_mini_golf' },
  { id: 'escape_room', nameKey: 'preferences.venue_escape_room' },
  { id: 'arcade',      nameKey: 'preferences.venue_arcade' },
  { id: 'climbing',    nameKey: 'preferences.venue_climbing' },
  { id: 'spa_wellness',nameKey: 'preferences.venue_spa_wellness' },
];

const nightlifeItems = [
  { id: 'cocktail_bar', nameKey: 'preferences.venue_cocktail_bar' },
  { id: 'pub',          nameKey: 'preferences.venue_pub' },
  { id: 'nightclub',    nameKey: 'preferences.venue_nightclub' },
  { id: 'live_music',   nameKey: 'preferences.venue_live_music' },
  { id: 'karaoke',      nameKey: 'preferences.venue_karaoke' },
  { id: 'comedy_club',  nameKey: 'preferences.venue_comedy_club' },
];

const wellnessItems = [
  { id: 'spa_wellness', nameKey: 'preferences.venue_spa_wellness' },
  { id: 'sauna',        nameKey: 'preferences.venue_sauna' },
  { id: 'thermal_bath', nameKey: 'preferences.venue_thermal_bath' },
  { id: 'yoga_studio',  nameKey: 'preferences.venue_yoga_studio' },
  { id: 'massage',      nameKey: 'preferences.venue_massage' },
];

const outdoorItems = [
  { id: 'park',           nameKey: 'preferences.venue_park' },
  { id: 'beach',          nameKey: 'preferences.venue_beach' },
  { id: 'viewpoint',      nameKey: 'preferences.venue_viewpoint' },
  { id: 'nature_reserve', nameKey: 'preferences.venue_nature_reserve' },
  { id: 'garden',         nameKey: 'preferences.venue_garden' },
  { id: 'marina',         nameKey: 'preferences.venue_marina' },
];

const sportActionItems = [
  { id: 'go_kart',        nameKey: 'preferences.venue_go_kart' },
  { id: 'paintball',      nameKey: 'preferences.venue_paintball' },
  { id: 'laser_tag',      nameKey: 'preferences.venue_laser_tag' },
  { id: 'trampoline_park',nameKey: 'preferences.venue_trampoline_park' },
  { id: 'billiards',      nameKey: 'preferences.venue_billiards' },
  { id: 'bouldering',     nameKey: 'preferences.venue_bouldering' },
];

/**
 * Per-category priority profile.
 *
 * Single source of truth for BOTH
 *   a) which wizard sections are asked, and
 *   b) how strongly each dimension is weighted by the recommendation scoring
 *      (mapped onto the existing session `priority_weights`).
 *
 * Weight scale matches PriorityWeights: 1.0 = neutral, <1 less important,
 * >1 more important. Never 0 — a dimension that is irrelevant is hidden from
 * the wizard and damped, not eliminated (avoids degenerate scores).
 */
export interface CategoryPriorityProfile {
  cuisine: number;
  vibe: number;
  price: number;
  location: number;
  timing: number;
  /** Section toggles derived into `visibleSections` */
  dietaryRelevant: boolean;
  excludedRelevant: boolean;
  budgetRelevant: boolean;
  accessibilityRelevant: boolean;
  /** i18n key: one-line explanation of what the category optimizes for */
  summaryKey: string;
}

export type PriorityDimensionId = 'cuisine' | 'vibe' | 'price' | 'location';

const profile = (p: Partial<CategoryPriorityProfile> & { summaryKey: string }): CategoryPriorityProfile => ({
  cuisine: 1.0,
  vibe: 1.0,
  price: 1.0,
  location: 1.0,
  timing: 1.0,
  dietaryRelevant: false,
  excludedRelevant: false,
  budgetRelevant: true,
  accessibilityRelevant: true,
  ...p,
});

/** Derives the visible wizard sections from a priority profile. */
export function sectionsFromProfile(p: CategoryPriorityProfile): Set<WizardSectionId> {
  const s = new Set<WizardSectionId>(['mainPicker', 'location']);
  if (p.vibe > 0) s.add('vibe');
  if (p.dietaryRelevant) s.add('dietary');
  if (p.excludedRelevant) s.add('excluded');
  if (p.budgetRelevant) s.add('budget');
  if (p.timing > 0) s.add('timing');
  if (p.accessibilityRelevant) s.add('accessibility');
  return s;
}

const FOOD_PROFILE = profile({
  cuisine: 1.4, vibe: 1.0, price: 1.0, location: 1.0, timing: 1.0,
  dietaryRelevant: true, excludedRelevant: true,
  summaryKey: 'preferences.priorityFood',
});

const CULTURE_PROFILE = profile({
  cuisine: 0.5, vibe: 1.3, price: 1.0, location: 1.1, timing: 1.2,
  summaryKey: 'preferences.priorityCulture',
});

const ACTIVITY_PROFILE = profile({
  cuisine: 0.5, vibe: 1.1, price: 1.0, location: 1.2, timing: 1.0,
  summaryKey: 'preferences.priorityActivity',
});

const NIGHTLIFE_PROFILE = profile({
  cuisine: 0.7, vibe: 1.4, price: 1.0, location: 1.0, timing: 1.5,
  accessibilityRelevant: false,
  summaryKey: 'preferences.priorityNightlife',
});

const WELLNESS_PROFILE = profile({
  cuisine: 0.4, vibe: 1.5, price: 1.0, location: 1.0, timing: 0.8,
  summaryKey: 'preferences.priorityWellness',
});

const OUTDOOR_PROFILE = profile({
  cuisine: 0.4, vibe: 1.3, price: 0.6, location: 1.6, timing: 1.2,
  budgetRelevant: false,
  summaryKey: 'preferences.priorityOutdoor',
});

const SPORT_ACTION_PROFILE = profile({
  cuisine: 0.4, vibe: 1.0, price: 1.0, location: 1.3, timing: 1.0,
  summaryKey: 'preferences.prioritySport',
});

const FOOD: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatCraving',
  mainPickerStorage: 'preferred_cuisines',
  priorityProfile: FOOD_PROFILE,
  visibleSections: sectionsFromProfile(FOOD_PROFILE),
  mainPickerItems: [], // resolved at runtime — uses existing cuisines list
};

const CULTURE: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatCulture',
  mainPickerHintKey: 'preferences.whatCultureHint',
  mainPickerStorage: 'preferred_venue_types',
  priorityProfile: CULTURE_PROFILE,
  visibleSections: sectionsFromProfile(CULTURE_PROFILE),
  mainPickerItems: cultureItems,
  step1TitleKey: 'preferences.stepCulture',
  step1SubtitleKey: 'preferences.stepCultureDesc',
  vibeWhitelist: ['cultural', 'romantic', 'casual', 'adventurous'],
};

const ACTIVITY: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatActivity',
  mainPickerHintKey: 'preferences.whatActivityHint',
  mainPickerStorage: 'preferred_venue_types',
  priorityProfile: ACTIVITY_PROFILE,
  visibleSections: sectionsFromProfile(ACTIVITY_PROFILE),
  mainPickerItems: activityItems,
  step1TitleKey: 'preferences.stepActivity',
  step1SubtitleKey: 'preferences.stepActivityDesc',
  vibeWhitelist: ['adventurous', 'outdoor', 'casual', 'romantic'],
};

const NIGHTLIFE: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatNightlife',
  mainPickerHintKey: 'preferences.whatNightlifeHint',
  mainPickerStorage: 'preferred_venue_types',
  priorityProfile: NIGHTLIFE_PROFILE,
  visibleSections: sectionsFromProfile(NIGHTLIFE_PROFILE),
  mainPickerItems: nightlifeItems,
  step1TitleKey: 'preferences.stepNightlife',
  step1SubtitleKey: 'preferences.stepNightlifeDesc',
  vibeWhitelist: ['nightlife', 'romantic', 'casual', 'adventurous'],
};

const WELLNESS: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatWellness',
  mainPickerHintKey: 'preferences.whatWellnessHint',
  mainPickerStorage: 'preferred_venue_types',
  priorityProfile: WELLNESS_PROFILE,
  visibleSections: sectionsFromProfile(WELLNESS_PROFILE),
  mainPickerItems: wellnessItems,
  step1TitleKey: 'preferences.stepWellness',
  step1SubtitleKey: 'preferences.stepWellnessDesc',
  vibeWhitelist: ['romantic', 'casual', 'cultural', 'outdoor'],
};

const OUTDOOR: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatOutdoor',
  mainPickerHintKey: 'preferences.whatOutdoorHint',
  mainPickerStorage: 'preferred_venue_types',
  priorityProfile: OUTDOOR_PROFILE,
  visibleSections: sectionsFromProfile(OUTDOOR_PROFILE),
  mainPickerItems: outdoorItems,
  step1TitleKey: 'preferences.stepOutdoor',
  step1SubtitleKey: 'preferences.stepOutdoorDesc',
  vibeWhitelist: ['outdoor', 'adventurous', 'casual', 'romantic'],
};

const SPORT_ACTION: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatSport',
  mainPickerHintKey: 'preferences.whatSportHint',
  mainPickerStorage: 'preferred_venue_types',
  priorityProfile: SPORT_ACTION_PROFILE,
  visibleSections: sectionsFromProfile(SPORT_ACTION_PROFILE),
  mainPickerItems: sportActionItems,
  step1TitleKey: 'preferences.stepSport',
  step1SubtitleKey: 'preferences.stepSportDesc',
  vibeWhitelist: ['adventurous', 'casual', 'outdoor', 'nightlife'],
};

const CONFIGS: Record<SituationalCategoryId, CategoryWizardConfig> = {
  food: FOOD,
  culture: CULTURE,
  activity: ACTIVITY,
  nightlife: NIGHTLIFE,
  wellness: WELLNESS,
  outdoor: OUTDOOR,
  sport_action: SPORT_ACTION,
};

/** Returns the wizard config for the given category, falling back to FOOD
 *  (the historical default — keeps the full feature set when no quick-action
 *  was selected on Home). */
export function getCategoryWizardConfig(
  categoryId: SituationalCategoryId | null | undefined,
): CategoryWizardConfig {
  if (!categoryId) return FOOD;
  return CONFIGS[categoryId] ?? FOOD;
}

/** Priority profile for a category (FOOD as neutral default). */
export function getCategoryPriorityProfile(
  categoryId: SituationalCategoryId | null | undefined,
): CategoryPriorityProfile {
  return getCategoryWizardConfig(categoryId).priorityProfile;
}

/** Category defaults mapped onto the session priority weights used by scoring. */
export function getCategoryPriorityWeights(
  categoryId: SituationalCategoryId | null | undefined,
): Record<PriorityDimensionId, number> {
  const p = getCategoryPriorityProfile(categoryId);
  return { cuisine: p.cuisine, vibe: p.vibe, price: p.price, location: p.location };
}

/** Which priority sliders make sense for a category (cuisine only for food). */
export function getVisiblePriorityDimensions(
  categoryId: SituationalCategoryId | null | undefined,
): PriorityDimensionId[] {
  const cfg = getCategoryWizardConfig(categoryId);
  const dims: PriorityDimensionId[] = [];
  if (cfg.mainPickerStorage === 'preferred_cuisines') dims.push('cuisine');
  dims.push('vibe');
  if (cfg.priorityProfile.budgetRelevant) dims.push('price');
  dims.push('location');
  return dims;
}

export const FOOD_CONFIG = FOOD;