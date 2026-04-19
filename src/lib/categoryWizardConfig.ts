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

const FOOD: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatCraving',
  mainPickerStorage: 'preferred_cuisines',
  visibleSections: new Set<WizardSectionId>([
    'mainPicker', 'excluded', 'vibe', 'dietary',
    'budget', 'location', 'timing', 'accessibility',
  ]),
  mainPickerItems: [], // resolved at runtime — uses existing cuisines list
};

const CULTURE: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatCulture',
  mainPickerHintKey: 'preferences.whatCultureHint',
  mainPickerStorage: 'preferred_venue_types',
  visibleSections: new Set<WizardSectionId>([
    'mainPicker', 'vibe', 'budget', 'location', 'timing', 'accessibility',
  ]),
  mainPickerItems: cultureItems,
};

const ACTIVITY: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatActivity',
  mainPickerHintKey: 'preferences.whatActivityHint',
  mainPickerStorage: 'preferred_venue_types',
  visibleSections: new Set<WizardSectionId>([
    'mainPicker', 'vibe', 'budget', 'location', 'timing', 'accessibility',
  ]),
  mainPickerItems: activityItems,
};

const NIGHTLIFE: CategoryWizardConfig = {
  mainPickerTitleKey: 'preferences.whatNightlife',
  mainPickerHintKey: 'preferences.whatNightlifeHint',
  mainPickerStorage: 'preferred_venue_types',
  visibleSections: new Set<WizardSectionId>([
    'mainPicker', 'vibe', 'budget', 'location', 'timing',
  ]),
  mainPickerItems: nightlifeItems,
};

const CONFIGS: Record<SituationalCategoryId, CategoryWizardConfig> = {
  food: FOOD,
  culture: CULTURE,
  activity: ACTIVITY,
  nightlife: NIGHTLIFE,
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

export const FOOD_CONFIG = FOOD;