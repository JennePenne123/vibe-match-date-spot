/**
 * Category-aware fallback images.
 *
 * Returns a stable, contextual Unsplash photo per venue when no real
 * photo is available. Picks deterministically by venue id, so every
 * card stays visually stable across renders.
 */

type Category =
  | 'italian' | 'japanese' | 'asian' | 'mexican' | 'indian'
  | 'french' | 'mediterranean' | 'american' | 'cafe' | 'bakery'
  | 'bar' | 'cocktail' | 'wine' | 'beer' | 'nightlife'
  | 'museum' | 'gallery' | 'theatre' | 'cinema' | 'culture'
  | 'bowling' | 'minigolf' | 'arcade' | 'sport' | 'activity'
  | 'park' | 'outdoor' | 'restaurant';

// Curated, square-friendly Unsplash photos per category.
// All URLs use ?w=600&h=400&fit=crop for consistent sizing.
const IMAGES: Record<Category, string[]> = {
  italian: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=600&h=400&fit=crop',
  ],
  japanese: [
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=400&fit=crop',
  ],
  asian: [
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&h=400&fit=crop',
  ],
  mexican: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&h=400&fit=crop',
  ],
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop',
  ],
  french: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&h=400&fit=crop',
  ],
  mediterranean: [
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&h=400&fit=crop',
  ],
  american: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=600&h=400&fit=crop',
  ],
  bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=400&fit=crop',
  ],
  bar: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop',
  ],
  cocktail: [
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop',
  ],
  wine: [
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop',
  ],
  beer: [
    'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?w=600&h=400&fit=crop',
  ],
  museum: [
    'https://images.unsplash.com/photo-1565060169187-5284f1b34fab?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&h=400&fit=crop',
  ],
  gallery: [
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=600&h=400&fit=crop',
  ],
  theatre: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop',
  ],
  cinema: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=400&fit=crop',
  ],
  culture: [
    'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600&h=400&fit=crop',
  ],
  bowling: [
    'https://images.unsplash.com/photo-1538152025906-39b96d6c0e1d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1577741314755-048d8525d31e?w=600&h=400&fit=crop',
  ],
  minigolf: [
    'https://images.unsplash.com/photo-1592919505780-303950717480?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
  ],
  arcade: [
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&h=400&fit=crop',
  ],
  sport: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop',
  ],
  activity: [
    'https://images.unsplash.com/photo-1530021232320-687d8e3dba54?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop',
  ],
  park: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop',
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  ],
};

const KEYWORD_MAP: Array<[RegExp, Category]> = [
  [/italian|pizza|pasta/i, 'italian'],
  [/japanese|sushi|ramen|izakaya/i, 'japanese'],
  [/chinese|thai|vietnamese|korean|asian|dim.?sum/i, 'asian'],
  [/mexican|taco|burrito|cantina/i, 'mexican'],
  [/indian|curry|tandoori/i, 'indian'],
  [/french|bistro|brasserie/i, 'french'],
  [/mediterranean|greek|turkish|lebanese/i, 'mediterranean'],
  [/burger|american|bbq|steakhouse|grill/i, 'american'],
  [/cafe|coffee|kaffee/i, 'cafe'],
  [/bakery|b(ä|ae)cker|patisserie/i, 'bakery'],
  [/cocktail/i, 'cocktail'],
  [/wine|wein|weinbar/i, 'wine'],
  [/beer|bier|brewery|brauerei|pub/i, 'beer'],
  [/club|nightclub|disco|nightlife/i, 'nightlife'],
  [/bar/i, 'bar'],
  [/museum/i, 'museum'],
  [/gallery|galerie|art/i, 'gallery'],
  [/theatre|theater|oper|opera/i, 'theatre'],
  [/cinema|kino|movie/i, 'cinema'],
  [/culture|kultur/i, 'culture'],
  [/bowling/i, 'bowling'],
  [/mini.?golf/i, 'minigolf'],
  [/arcade|escape.?room|game/i, 'arcade'],
  [/sport|fitness|climbing|kletter/i, 'sport'],
  [/park|garden|garten/i, 'park'],
  [/outdoor|hiking|wandern/i, 'outdoor'],
  [/restaurant|food|essen|dining/i, 'restaurant'],
];

function pickCategory(venue: { name?: string; cuisine_type?: string; tags?: string[]; amenities?: string[]; description?: string }): Category {
  const haystack = [
    venue.cuisine_type,
    venue.name,
    venue.description,
    ...(venue.tags || []),
    ...(venue.amenities || []),
  ].filter(Boolean).join(' ').toLowerCase();

  for (const [pattern, cat] of KEYWORD_MAP) {
    if (pattern.test(haystack)) return cat;
  }
  return 'restaurant';
}

// Stable hash for deterministic image selection
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns a contextual stock photo for the given venue.
 * Stable across renders (deterministic by venue id + name).
 */
export function getVenueFallbackImage(venue: {
  id?: string;
  venue_id?: string;
  name?: string;
  venue_name?: string;
  cuisine_type?: string;
  tags?: string[];
  amenities?: string[];
  description?: string;
}): string {
  const cat = pickCategory({
    name: venue.name || venue.venue_name,
    cuisine_type: venue.cuisine_type,
    tags: venue.tags,
    amenities: venue.amenities,
    description: venue.description,
  });
  const pool = IMAGES[cat] || IMAGES.restaurant;
  const seed = venue.id || venue.venue_id || venue.name || venue.venue_name || 'venue';
  return pool[hashString(seed) % pool.length];
}
