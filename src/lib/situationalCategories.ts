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
      // Generic
      'restaurant', 'restaurante', 'eatery', 'diner', 'dining', 'food', 'food-beverage',
      'cafe', 'café', 'cafeteria', 'kaffee', 'coffee', 'coffee shop', 'coffeeshop',
      'bistro', 'brasserie', 'gastropub', 'tavern', 'taverna', 'taverne', 'wirtshaus',
      'gasthaus', 'gasthof', 'imbiss', 'snack bar', 'snackbar', 'food court', 'food-court',
      'food hall', 'streetfood', 'street food', 'foodtruck', 'food truck',
      // Meals & moments
      'breakfast', 'frühstück', 'desayuno', 'brunch', 'lunch', 'mittagessen', 'almuerzo',
      'dinner', 'abendessen', 'cena', 'supper', 'late night food',
      // Bakery / sweets / coffee
      'bakery', 'bäckerei', 'panadería', 'patisserie', 'patiserie', 'konditorei',
      'pastry', 'pastries', 'dessert', 'desserts', 'ice cream', 'eisdiele', 'gelato',
      'gelateria', 'heladería', 'frozen yogurt', 'froyo', 'crepes', 'crêpes', 'waffles',
      'donuts', 'doughnuts', 'cupcake', 'cupcakes', 'macaron', 'macarons',
      // Fast / casual food types
      'fast food', 'fast-food', 'fast-food-restaurant', 'pizzeria', 'pizza', 'burger',
      'burgers', 'kebab', 'döner', 'doner', 'shawarma', 'falafel', 'sandwich',
      'sandwiches', 'sub', 'subs', 'wrap', 'wraps', 'bowl', 'bowls', 'salad', 'salads',
      'hot dog', 'hotdog', 'noodles', 'ramen', 'pho', 'phở', 'sushi', 'sashimi',
      'dumplings', 'dim sum', 'tapas', 'meze', 'mezze', 'paella', 'curry',
      'biryani', 'tagine', 'pasta', 'risotto', 'gnocchi',
      // Steak / BBQ / grill
      'steak', 'steak house', 'steakhouse', 'grill', 'grillrestaurant', 'bbq', 'barbecue',
      'churrascaria', 'asador',
      // Cuisines (broad)
      'italian', 'italienisch', 'italiana', 'french', 'französisch', 'francesa',
      'spanish', 'spanisch', 'española', 'german', 'deutsch', 'alemana',
      'mediterranean', 'mediterran', 'mediterránea', 'greek', 'griechisch', 'griega',
      'turkish', 'türkisch', 'turca', 'lebanese', 'libanesisch', 'libanesa',
      'mexican', 'mexikanisch', 'mexicana', 'argentinian', 'peruvian', 'peruano',
      'asian', 'asiatisch', 'asiática', 'japanese', 'japanisch', 'japonesa',
      'chinese', 'chinesisch', 'china', 'china', 'thai', 'thailändisch', 'tailandesa',
      'vietnamese', 'vietnamesisch', 'vietnamita', 'korean', 'koreanisch', 'coreana',
      'indian', 'indisch', 'india', 'middle eastern', 'arabisch', 'árabe',
      'african', 'afrikanisch', 'africana', 'ethiopian', 'äthiopisch',
      'fusion', 'organic', 'bio', 'vegan', 'vegetarian', 'vegetarisch', 'vegana',
      'seafood', 'meeresfrüchte', 'mariscos', 'fish', 'fisch', 'pescado',
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
      // Museums & exhibitions
      'museum', 'museums', 'museo', 'musée', 'natural history', 'science museum',
      'art museum', 'kunstmuseum', 'kunsthalle', 'kunsthaus', 'history museum',
      'historisches museum', 'pinakothek', 'mumok', 'sammlung', 'collection',
      'exhibition', 'exhibitions', 'ausstellung', 'ausstellungen', 'exposición',
      'exposition', 'biennale', 'documenta', 'planetarium', 'planetario',
      'observatorium', 'observatory', 'aquarium', 'zoo', 'tierpark', 'wildpark',
      'botanischer garten', 'botanical garden', 'jardín botánico',
      // Galleries & art
      'gallery', 'galleries', 'gallerie', 'galerie', 'galería', 'art gallery',
      'art', 'arts', 'arts-entertainment', 'arts centre', 'arts center',
      'kulturzentrum', 'kunst', 'kunsthandwerk', 'arte', 'fine art', 'modern art',
      'contemporary art', 'street art', 'graffiti', 'mural', 'murals', 'sculpture',
      'skulptur', 'photography', 'fotografie', 'fotografía', 'design museum',
      'studio', 'atelier', 'werkstatt',
      // Theatre / performing arts
      'theater', 'theatre', 'teatro', 'théâtre', 'schauspielhaus', 'kammerspiele',
      'staatstheater', 'stadttheater', 'bühne', 'stage', 'performing arts',
      'performance', 'play', 'drama', 'comedy theatre', 'improv', 'cabaret',
      'kabarett', 'varieté', 'variety', 'burlesque', 'puppet', 'puppentheater',
      'opera', 'oper', 'ópera', 'operetta', 'musical', 'musicals', 'ballet',
      'ballett', 'dance theater', 'tanztheater',
      // Cinema / film
      'cinema', 'cinemas', 'kino', 'kinos', 'cine', 'movie theater', 'movie theatre',
      'multiplex', 'imax', 'arthouse', 'programmkino', 'open air kino',
      'film festival', 'filmpalast', 'lichtspielhaus',
      // Music / concerts
      'concert', 'concerts', 'konzert', 'konzerte', 'concierto', 'concert hall',
      'konzerthaus', 'konzerthalle', 'philharmonie', 'philharmonic', 'symphony',
      'symphonie', 'sinfonie', 'orchestra', 'orchester', 'jazz club', 'jazz',
      'live music venue', 'music hall', 'musikhalle', 'liederhalle',
      // Books & literature
      'library', 'bibliothek', 'biblioteca', 'literaturhaus', 'bookshop',
      'buchhandlung', 'librería', 'lesung', 'reading', 'poetry', 'slam',
      'open mic', 'literature',
      // Heritage / historic
      'historic', 'historisch', 'histórico', 'heritage', 'monument', 'monuments',
      'denkmal', 'castle', 'schloss', 'burg', 'palace', 'palast', 'palacio',
      'fortress', 'festung', 'cathedral', 'kathedrale', 'catedral', 'church',
      'kirche', 'iglesia', 'basilica', 'basilika', 'temple', 'tempel', 'mosque',
      'moschee', 'synagogue', 'synagoge', 'memorial', 'gedenkstätte',
      'archaeological', 'archäologisch', 'ruins', 'ruine', 'ruinas', 'altstadt',
      'old town', 'casco antiguo',
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
      // Indoor games
      'bowling', 'bowling-alley', 'bowling alley', 'kegelbahn', 'kegeln', 'bolera',
      'arcade', 'spielhalle', 'game center', 'gaming', 'pinball', 'flipper',
      'vr', 'virtual reality', 'vr arcade', 'video games',
      'escape room', 'escape-room', 'escape rooms', 'exit game',
      'billard', 'billiards', 'billiard', 'pool hall', 'snooker', 'pool table',
      'darts', 'dartbar', 'dart bar',
      'board game cafe', 'brettspielcafe', 'spielcafé',
      // Climbing / bouldering
      'climbing', 'klettern', 'kletterhalle', 'kletterzentrum', 'bouldering',
      'bouldern', 'boulderhalle', 'climbing gym', 'escalada', 'rock climbing',
      // Action / adventure
      'lasertag', 'laser tag', 'paintball', 'airsoft',
      'kart', 'go-kart', 'go kart', 'kartbahn', 'karting',
      'trampolin', 'trampoline', 'trampolinhalle', 'jump house', 'jumphouse',
      'parkour', 'ninja', 'ninja warrior', 'high ropes', 'kletterwald',
      'hochseilgarten', 'rope course', 'zip line', 'ziplining',
      'axe throwing', 'axtwerfen', 'wurfaxt',
      'adventure park', 'abenteuerpark', 'freizeitpark', 'theme park',
      'amusement park', 'parque de atracciones',
      // Water / pools
      'aquapark', 'aquaworld', 'wasserpark', 'water park', 'waterpark',
      'schwimmbad', 'swimming pool', 'piscina', 'freibad', 'hallenbad',
      'thermalbad', 'therme', 'thermal bath', 'thermal spa', 'sauna',
      'wellness', 'spa', 'day spa', 'beauty spa', 'massage', 'massagestudio',
      'hammam', 'banya', 'onsen', 'wellnesszentrum',
      // Sport / fitness
      'sport', 'sports', 'sportzentrum', 'sportstätte', 'sports centre',
      'sports center', 'fitness', 'fitnessstudio', 'gym', 'crossfit', 'yoga',
      'yogastudio', 'pilates', 'tennis', 'tennishalle', 'badminton', 'squash',
      'soccer', 'fußball', 'fútbol', 'futsal', 'basketball', 'volleyball',
      'beach volleyball', 'beachvolleyball', 'golf', 'mini golf', 'minigolf',
      'driving range', 'archery', 'bogenschießen', 'fencing', 'fechten',
      'martial arts', 'kampfsport', 'boxing', 'boxen', 'skateboard', 'skatepark',
      'rollschuhbahn', 'roller skating', 'eisbahn', 'ice rink', 'ice skating',
      'skating', 'curling',
      // Outdoor / nature
      'park', 'parks', 'stadtpark', 'naturpark', 'national park', 'nationalpark',
      'wandern', 'hiking', 'hike', 'senderismo', 'beach', 'strand', 'playa',
      'lake', 'see', 'lago', 'fluss', 'river', 'river cruise', 'boat tour',
      'bootstour', 'segeln', 'sailing', 'kayak', 'kayaking', 'kanu', 'canoe',
      'sup', 'stand up paddle', 'rafting', 'cycling', 'fahrradtour', 'bike tour',
      'horseback', 'reiten', 'reitstall', 'fishing', 'angeln',
      // Workshops / hands-on
      'workshop', 'workshops', 'cooking class', 'kochkurs', 'pottery', 'töpfern',
      'painting class', 'malkurs', 'wine tasting', 'weinprobe', 'beer tasting',
      'craft beer tasting', 'distillery tour', 'brewery tour', 'brauereiführung',
    ],
  },
  {
    id: 'nightlife',
    labelKey: 'home.situational.nightlife.label',
    descKey: 'home.situational.nightlife.desc',
    emoji: '🌃',
    gradient: 'from-pink-500/20 via-fuchsia-500/10 to-transparent',
    boostVenueTypes: ['bar', 'pub', 'nightclub', 'night_club', 'cocktail_bar', 'wine_bar', 'beer_garden', 'comedy_club', 'karaoke'],
    boostActivities: ['nightlife_act', 'cocktails'],
    boostKeywords: [
      // Clubs / dance
      'nightclub', 'night club', 'club', 'clubs', 'discothek', 'diskothek',
      'disco', 'discoteca', 'dance club', 'dancefloor', 'dance floor',
      'electro club', 'techno club', 'techno', 'house', 'edm', 'rave',
      'after hour', 'afterhour', 'late night', 'late-night', 'nightlife',
      // Bars (general)
      'bar', 'bars', 'cocktail', 'cocktails', 'cocktailbar', 'cocktail bar',
      'mixology', 'speakeasy', 'lounge', 'lounges', 'rooftop', 'rooftop bar',
      'sky bar', 'skybar', 'hotel bar', 'piano bar', 'tiki bar', 'tikibar',
      // Specific bar types
      'wine bar', 'weinbar', 'vinothek', 'enoteca', 'wine cellar', 'weinkeller',
      'whisky bar', 'whiskybar', 'whiskey bar', 'gin bar', 'rum bar',
      'champagne bar', 'sektbar', 'craft beer', 'craft-beer', 'brewpub',
      'beer garden', 'biergarten', 'bierhalle', 'beer hall', 'pub', 'pubs',
      'irish pub', 'sports bar', 'sportsbar', 'sports pub',
      // Shisha / smoking lounges
      'shisha', 'shisha bar', 'shishabar', 'hookah', 'hookah lounge',
      // Live entertainment
      'live music', 'live-musik', 'livemusik', 'live music venue', 'jazz bar',
      'jazzkneipe', 'blues bar', 'karaoke', 'karaoke bar', 'comedy club',
      'standup', 'stand-up', 'stand up comedy', 'open mic night',
      'piano lounge', 'cabaret bar',
      // Vibe / occasion
      'date night', 'after work', 'afterwork', 'lively', 'party', 'fiesta',
      'happy hour', 'cocktail hour', 'rooftop terrace', 'dachterrasse',
      'beach club', 'beachclub', 'strandbar',
    ],
  },
];

export function getSituationalCategory(id: string | null | undefined): SituationalCategory | null {
  if (!id) return null;
  return SITUATIONAL_CATEGORIES.find(c => c.id === id) ?? null;
}

const FOOD_CUISINES = new Set([
  'italian','pizza','pizzeria','burger','burgers','hamburger','hamburgers','sushi','japanese','indian','thai',
  'chinese','asian','mexican','french','german','spanish','greek','turkish','korean',
  'vietnamese','american','mediterranean','seafood','steakhouse','steak','bbq',
  'kebab','döner','doner','falafel','ramen','noodles','vegan','vegetarian','breakfast',
  'cafe','café','bakery','bistro','brasserie','restaurant','fast_food','fast food',
  'ice_cream','ice cream','dessert','brunch','sandwich','coffee','coffee_shop',
  'lebanese','ethiopian','african','peruvian','argentinian','arabic','arabian',
  'middle_eastern','middle eastern','fusion','organic','fish','pasta',
  'pho','dim_sum','dim sum','tapas','curry','biryani','tagine','food','meal_takeaway','meal_delivery',
]);

const FOOD_TAGS = new Set([
  ...FOOD_CUISINES,
  'hamburger_restaurant','burger_restaurant','restaurant','food','fast_food','meal_takeaway','meal_delivery',
  'cafe','café','bakery','diner','eatery','snack_bar','food_beverage','food-beverage',
]);

const FOOD_NAME_KEYWORDS = [
  'burger','hamburger','pizza','pizzeria','sushi','restaurant','ristorante','trattoria','imbiss',
  'kebab','döner','doner','grill','steakhouse','steak house','sandwich','ramen','noodle','bakery',
  'bäckerei','cafe','café','coffee','ice cream','eis','bistro','brasserie','diner','food truck',
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsWholeTerm = (text: string, term: string): boolean => {
  const normalizedTerm = term.toLowerCase().trim();
  if (!normalizedTerm) return false;
  const re = new RegExp(`(?:^|[^a-z0-9äöüßáéíóúñ])${escapeRegex(normalizedTerm)}(?:$|[^a-z0-9äöüßáéíóúñ])`, 'i');
  return re.test(text);
};

type SituationalVenueLike = {
  name?: string | null;
  cuisine_type?: string | null;
  cuisineType?: string | null;
  description?: string | null;
  tags?: string[] | null;
  types?: string[] | null;
  venue_type?: string | null;
  activities?: string[] | null;
};

export function isPureFoodVenue(venue: SituationalVenueLike): boolean {
  const cuisine = (venue.cuisine_type ?? venue.cuisineType ?? '').toLowerCase().trim();
  const tags = [
    ...(venue.tags ?? []),
    ...(venue.types ?? []),
    venue.venue_type ?? '',
  ].map(t => (t ?? '').toString().trim().toLowerCase()).filter(Boolean);
  const tagSet = new Set(tags);
  const cuisineParts = cuisine.split(/[;,/|]+/).map(part => part.trim()).filter(Boolean);
  const text = [venue.name ?? '', venue.description ?? '', cuisine].join(' ').toLowerCase();
  const genericFoodTags = new Set(['restaurant', 'food', 'meal_takeaway', 'meal_delivery']);

  if (cuisineParts.some(part => FOOD_CUISINES.has(part) || FOOD_NAME_KEYWORDS.some(keyword => containsWholeTerm(part, keyword)))) {
    return true;
  }

  if (tags.some(tag => (FOOD_TAGS.has(tag) && !genericFoodTags.has(tag)) || FOOD_NAME_KEYWORDS.some(keyword => containsWholeTerm(tag.replace(/_/g, ' '), keyword)))) {
    return true;
  }

  return FOOD_NAME_KEYWORDS.some(keyword => containsWholeTerm(text, keyword));
}

/**
 * Hard category filter — when the user explicitly picks a non-food intent
 * ("Kultur", "Aktivität", "Nightlife"), pure restaurants/cafés should be
 * EXCLUDED from the candidate set, not just down-weighted. Otherwise the
 * recommendation pipeline will keep surfacing gastro because there are
 * always 100x more restaurants than museums in any city.
 *
 * Returns true if the venue should be KEPT, false to exclude.
 * - When `category` is null or "food" → no hard filter (keep all).
 * - When `category` is culture/activity/nightlife → keep only venues that
 *   match the active or secondary category, OR that are clearly not pure
 *   gastronomy (e.g. multipurpose venues with art/live music).
 */
export function passesSituationalHardFilter(
  category: SituationalCategory | null,
  venue: {
    name?: string | null;
    cuisine_type?: string | null;
    cuisineType?: string | null;
    description?: string | null;
    tags?: string[] | null;
    types?: string[] | null;
    nominatim_match_name?: string | null;
    address?: string | null;
    venue_type?: string | null;
    activities?: string[] | null;
  },
  secondary?: SituationalCategory | null,
): boolean {
  // No filter when no intent or when intent is "food" (food = anything goes).
  if (!category) return true;
  if (category.id === 'food' && (!secondary || secondary.id === 'food')) return true;

  // Strict structural match: a venue passes a non-food intent ONLY if its
  // structured fields (venue_type, activities, exact tag entry, or cuisine_type
  // mapped to the category) match. Free-text keyword matches in name/description
  // are intentionally NOT enough — otherwise "Burger Lounge" sneaks past the
  // nightlife filter just because of the word "lounge".
  const tagSet = new Set(
    [...(venue.tags ?? []), ...(venue.types ?? [])].map(t => (t ?? '').toString().trim().toLowerCase()),
  );
  const cuisine = (venue.cuisine_type ?? venue.cuisineType ?? '').toLowerCase().trim();
  const venueType = (venue.venue_type ?? '').toLowerCase().trim();
  const activities = ((venue.activities ?? []) as string[])
    .map(a => (a ?? '').toString().toLowerCase().trim());

  if (isPureFoodVenue(venue)) return false;

  const matchesStructurally = (cat: SituationalCategory): boolean => {
    const vts = cat.boostVenueTypes.map(t => t.toLowerCase());
    if (vts.includes(venueType)) return true;
    if (vts.some(t => tagSet.has(t))) return true;
    const acts = cat.boostActivities.map(a => a.toLowerCase());
    if (acts.some(a => activities.includes(a) || tagSet.has(a))) return true;
    // Exact tag entry matches a category keyword
    if (cat.boostKeywords.some(k => tagSet.has(k.toLowerCase()))) return true;
    // cuisine_type itself is a category keyword (e.g. cuisine='bar' for nightlife,
    // cuisine='museum' for culture)
    if (cuisine && cat.boostKeywords.some(k => k.toLowerCase() === cuisine)) return true;
    return false;
  };

  if (isPureFoodVenue(venue)) return false;

  const primaryStruct = category.id !== 'food' ? matchesStructurally(category) : false;
  const secondaryStruct = secondary && secondary.id !== 'food'
    ? matchesStructurally(secondary)
    : false;

  if (primaryStruct || secondaryStruct) return true;

  return false;
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
    nominatim_match_name?: string | null;
    address?: string | null;
  },
  secondary?: SituationalCategory | null,
): number {
  if (!category && !secondary) return 1;

  // Build a normalized haystack and a tag-set for precise (non-substring) matches.
  // Substring matching is dangerous: `'art'` would match `'restaurant'`, falsely
  // boosting every restaurant under the "culture" intent. We therefore:
  //   1. match keywords against `tags` as exact (case-insensitive) entries, AND
  //   2. match against name/cuisine/description using whole-word boundaries.
  const normalizedTags = new Set(
    (venue.tags ?? []).map(t => (t ?? '').toString().trim().toLowerCase()),
  );
  const textBlob = [
    venue.name ?? '',
    venue.cuisine_type ?? '',
    venue.description ?? '',
    venue.nominatim_match_name ?? '',
    venue.address ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchesKeyword = (kw: string): boolean => {
    const k = kw.toLowerCase().trim();
    if (!k) return false;
    if (normalizedTags.has(k)) return true;
    // Whole-word / phrase boundary match in free text
    const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(k)}(?:$|[^a-z0-9])`, 'i');
    return re.test(textBlob);
  };

  const scoreFor = (cat: SituationalCategory | null, matchValue: number): number => {
    if (!cat) return 1;
    return cat.boostKeywords.some(matchesKeyword) ? matchValue : 1;
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
  const matchesOther = otherKeywords.some(matchesKeyword);
  if (matchesOther) return 0.7;

  return 1;
}
