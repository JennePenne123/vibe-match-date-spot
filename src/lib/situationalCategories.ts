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
    boostKeywords: [
      'restaurant', 'cafe', 'café', 'bistro', 'brunch', 'bakery', 'food-beverage',
      'dining', 'pizza', 'burger', 'kebab', 'steak house', 'steakhouse',
      'ice cream', 'coffee shop', 'fast-food-restaurant',
    ],
  },
  {
    id: 'culture',
    labelKey: 'home.situational.culture.label',
    descKey: 'home.situational.culture.desc',
    emoji: '🎭',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    boostVenueTypes: ['museum', 'gallery', 'theater_venue', 'cinema', 'concert_hall'],
    boostActivities: ['cultural_act'],
    boostKeywords: [
      'museum', 'gallery', 'galerie', 'theater', 'theatre', 'cinema', 'kino',
      'kunst', 'exhibition', 'ausstellung', 'arts-entertainment', 'art gallery',
      'opera', 'oper', 'concert hall', 'konzerthaus', 'konzerthalle',
      'philharmonie', 'literaturhaus', 'kulturzentrum', 'historic',
    ],
  },
  {
    id: 'activity',
    labelKey: 'home.situational.activity.label',
    descKey: 'home.situational.activity.desc',
    emoji: '🎯',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    boostVenueTypes: ['bowling', 'mini_golf', 'arcade', 'climbing', 'swimming', 'spa_wellness', 'escape_room'],
    boostActivities: ['active'],
    boostKeywords: [
      'bowling', 'bowling-alley', 'climbing', 'klettern', 'kletterhalle',
      'sport', 'spa', 'wellness', 'arcade', 'escape room', 'escape-room',
      'mini golf', 'minigolf', 'lasertag', 'laser tag', 'paintball',
      'kart', 'go-kart', 'trampolin', 'trampoline', 'aquapark', 'schwimmbad',
      'billard', 'billiards', 'pool hall', 'darts',
    ],
  },
  {
    id: 'nightlife',
    labelKey: 'home.situational.nightlife.label',
    descKey: 'home.situational.nightlife.desc',
    emoji: '🌃',
    gradient: 'from-pink-500/20 via-fuchsia-500/10 to-transparent',
    boostVenueTypes: ['comedy_club', 'karaoke'],
    boostActivities: ['nightlife_act', 'cocktails'],
    boostKeywords: [
      'nightclub', 'night club', 'bar', 'cocktail', 'cocktails', 'pub',
      'live music', 'live-musik', 'karaoke', 'nightlife', 'late night',
      'date night', 'lounge', 'rooftop', 'speakeasy', 'wine bar', 'weinbar',
      'whisky bar', 'whiskybar', 'cocktailbar', 'sportsbar', 'sports bar',
      'discothek', 'disco', 'dance club', 'lively',
    ],
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
 *
 * When a `secondary` category is provided (the optional "Danach noch …?" pick
 * from the preferences wizard), its match contributes an additional, smaller
 * boost (max 1.20×) that is multiplied onto the primary one. The combined
 * factor is capped at 1.45× to avoid runaway scores. Off-category penalties
 * are only applied when BOTH primary and secondary signal "wrong bucket".
 */
export function getSituationalBoost(
  category: SituationalCategory | null,
  venue: {
    name?: string | null;
    cuisine_type?: string | null;
    description?: string | null;
    tags?: string[] | null;
  },
  secondary?: SituationalCategory | null,
): number {
  if (!category && !secondary) return 1;

  const haystack = [
    venue.name ?? '',
    venue.cuisine_type ?? '',
    venue.description ?? '',
    ...(venue.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const scoreFor = (cat: SituationalCategory | null, matchValue: number): number => {
    if (!cat) return 1;
    return cat.boostKeywords.some(kw => haystack.includes(kw)) ? matchValue : 1;
  };

  // Primary contributes up to 1.35x, secondary up to 1.20x.
  const primaryFactor = scoreFor(category ?? null, 1.35);
  const secondaryFactor = scoreFor(secondary ?? null, 1.20);

  // If at least one matches → multiplicative combo, capped at 1.45x
  if (primaryFactor > 1 || secondaryFactor > 1) {
    return Math.min(1.45, primaryFactor * secondaryFactor);
  }

  // Off-category de-prioritisation only when ALL active categories signal
  // "wrong bucket" — a venue that matches the secondary intent should NOT
  // be penalised just because it's off the primary one.
  const activeIds = new Set(
    [category?.id, secondary?.id].filter(Boolean) as SituationalCategoryId[],
  );
  const otherKeywords = SITUATIONAL_CATEGORIES
    .filter(c => !activeIds.has(c.id))
    .flatMap(c => c.boostKeywords);
  const matchesOther = otherKeywords.some(kw => haystack.includes(kw));
  if (matchesOther) return 0.7;

  return 1;
}
