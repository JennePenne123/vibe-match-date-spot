/**
 * Situational Categories — ephemeral plan-mode filters
 *
 * The user picks one of these on the Home screen (Quick-Action), and the
 * selection is propagated through the plan flow as a non-persistent session
 * filter. The AI recommendation pipeline boosts venues whose tags / cuisine /
 * venue_type match the category and de-prioritises the rest.
 *
 * IMPORTANT: this is intentionally NOT stored in user_preferences — it is a
 * "today's intent" signal, not a long-term taste. Persisting it would defeat
 * the whole point of situational planning.
 */

export type SituationalCategoryId = 'food' | 'culture' | 'activity' | 'nightlife';

export interface SituationalCategory {
  id: SituationalCategoryId;
  /** i18n key under `home.situational.<id>.label` */
  labelKey: string;
  /** i18n key under `home.situational.<id>.desc` */
  descKey: string;
  emoji: string;
  /** Tailwind gradient classes for the card surface */
  gradient: string;
  /** OSM venue_type tags to boost when this category is active */
  boostVenueTypes: string[];
  /** OSM activity tags to boost when this category is active */
  boostActivities: string[];
  /** Free-text keywords matched against venue.tags / name / description */
  boostKeywords: string[];
}

export const SITUATIONAL_CATEGORIES: SituationalCategory[] = [
  {
    id: 'food',
    labelKey: 'home.situational.food.label',
    descKey: 'home.situational.food.desc',
    emoji: '🍽️',
    gradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    boostVenueTypes: [],
    boostActivities: [],
    boostKeywords: ['restaurant', 'cafe', 'café', 'bistro', 'brunch', 'bakery', 'food'],
  },
  {
    id: 'culture',
    labelKey: 'home.situational.culture.label',
    descKey: 'home.situational.culture.desc',
    emoji: '🎭',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    boostVenueTypes: ['museum', 'gallery', 'theater_venue', 'cinema', 'concert_hall'],
    boostActivities: ['cultural_act'],
    boostKeywords: ['museum', 'gallery', 'galerie', 'theater', 'theatre', 'cinema', 'kino', 'art', 'kunst', 'exhibition', 'ausstellung'],
  },
  {
    id: 'activity',
    labelKey: 'home.situational.activity.label',
    descKey: 'home.situational.activity.desc',
    emoji: '🎯',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    boostVenueTypes: ['bowling', 'mini_golf', 'arcade', 'climbing', 'swimming', 'spa_wellness', 'escape_room'],
    boostActivities: ['active'],
    boostKeywords: ['bowling', 'climbing', 'klettern', 'park', 'sport', 'spa', 'wellness', 'arcade', 'escape', 'mini golf', 'minigolf'],
  },
  {
    id: 'nightlife',
    labelKey: 'home.situational.nightlife.label',
    descKey: 'home.situational.nightlife.desc',
    emoji: '🌃',
    gradient: 'from-pink-500/20 via-fuchsia-500/10 to-transparent',
    boostVenueTypes: ['comedy_club', 'karaoke'],
    boostActivities: ['nightlife_act', 'cocktails'],
    boostKeywords: ['club', 'nightclub', 'bar', 'cocktail', 'pub', 'live music', 'live-musik', 'karaoke', 'nightlife'],
  },
];

export function getSituationalCategory(id: string | null | undefined): SituationalCategory | null {
  if (!id) return null;
  return SITUATIONAL_CATEGORIES.find(c => c.id === id) ?? null;
}

/**
 * Compute a multiplicative boost factor (0.6 – 1.35) for a venue based on
 * how well it matches the active situational category.
 *
 * - 1.35 → strong match (venue_type or activity tag matches)
 * - 1.15 → keyword match in name/tags/description
 * - 1.0  → no signal either way
 * - 0.7  → known to be in a different category bucket (de-prioritise)
 */
export function getSituationalBoost(
  category: SituationalCategory | null,
  venue: {
    name?: string | null;
    cuisine_type?: string | null;
    description?: string | null;
    tags?: string[] | null;
  },
): number {
  if (!category) return 1;

  const haystack = [
    venue.name ?? '',
    venue.cuisine_type ?? '',
    venue.description ?? '',
    ...(venue.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const matchesKeyword = category.boostKeywords.some(kw => haystack.includes(kw));
  if (matchesKeyword) return 1.35;

  // De-prioritise venues that clearly belong to a *different* situational bucket.
  // We check the OTHER categories' strong keywords; if any matches, this venue
  // is "wrong category" for today's intent.
  const otherCategoriesStrongKeywords = SITUATIONAL_CATEGORIES
    .filter(c => c.id !== category.id)
    .flatMap(c => c.boostKeywords);
  const matchesOther = otherCategoriesStrongKeywords.some(kw => haystack.includes(kw));
  if (matchesOther) return 0.7;

  return 1;
}
