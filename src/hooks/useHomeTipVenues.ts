import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { STALE_TIMES } from '@/config/queryConfig';

interface TipVenue {
  id: string;
  name: string;
  cuisine_type: string | null;
  price_range: string | null;
  rating: number | null;
  address: string;
  image_url: string | null;
  tags: string[] | null;
  latitude: number | null;
  longitude: number | null;
  isDiscovery: boolean;
  distance: string | null;
}

interface UseHomeTipVenuesResult {
  dailyTipVenue: TipVenue | null;
  cityTipVenues: TipVenue[];
  loading: boolean;
}

// Blocklist: non-gastronomy businesses
const VENUE_BLOCKLIST = [
  // Supermärkte & Discounter
  'netto', 'aldi', 'lidl', 'rewe', 'edeka', 'penny', 'kaufland',
  'norma', 'nahkauf', 'real', 'globus', 'famila', 'combi', 'hit markt',
  'bio company', 'bio markt', 'reformhaus', 'trinkgut', 'getränkemarkt',
  'supermarkt', 'supermarket', 'grocery', 'lebensmittel', 'discounter',
  // Lieferdienste
  'lieferservice', 'lieferdienst', 'delivery', 'lieferando', 'wolt', 'uber eats',
  'flink', 'gorillas', 'getir', 'foodpanda', 'domino', 'pizza hut delivery',
  'takeaway', 'take away', 'zum mitnehmen', 'abhol',
  // Drogerien & Apotheken
  'drogerie', 'rossmann', 'dm-drogerie', 'müller drogerie',
  'apotheke', 'pharmacy', 'pharma',
  // Tankstellen & Autowäsche
  'tankstelle', 'fuel', 'gas station', 'waschanlage', 'aral', 'shell', 'jet tankstelle',
  // Einzelhandel & Geschäfte
  'baumarkt', 'obi', 'hornbach', 'bauhaus', 'toom',
  'möbelhaus', 'ikea', 'roller', 'poco', 'xxxlutz',
  'elektro', 'mediamarkt', 'media markt', 'saturn',
  'textil', 'kik', 'primark', 'h&m', 'zara', 'c&a',
  'friseur', 'frisör', 'barber', 'hair salon', 'nagelstudio', 'nail salon',
  'fitnessstudio', 'fitness', 'gym', 'mcfit', 'fitx',
  'waschsalon', 'laundry', 'reinigung', 'dry cleaning',
  'autohaus', 'autovermietung', 'car rental', 'werkstatt', 'kfz',
  'tierarzt', 'tierhandlung', 'tierbedarf', 'fressnapf', 'zoohandlung',
  'bestattung', 'funeral',
  'versicherung', 'insurance', 'steuerberater', 'rechtsanwalt', 'notar',
  'zahnarzt', 'arztpraxis', 'praxis', 'klinik', 'krankenhaus', 'hospital',
  'schule', 'kindergarten', 'kita', 'schul',
  'kirche', 'church', 'moschee', 'mosque', 'synagoge',
  'bibliothek', 'library', 'bücherei',
  'postfiliale', 'post office', 'paketshop',
  'copy shop', 'druckerei', 'print shop',
  'sonnenstudio', 'solarium', 'tanning',
  'schlüsseldienst', 'locksmith',
  // Kioske & Automaten
  'kiosk', 'trinkhalle', 'späti', 'spätverkauf', 'automat', 'vending',
];

// Gastro-relevante cuisine_types und tags
const GASTRO_INDICATORS = [
  'restaurant', 'café', 'cafe', 'bistro', 'bar', 'pub', 'lounge',
  'imbiss', 'grill', 'pizzeria', 'trattoria', 'osteria', 'brasserie',
  'brauhaus', 'biergarten', 'beer garden', 'wine bar', 'weinbar',
  'sushi', 'ramen', 'noodle', 'burger', 'steakhouse', 'steak',
  'tapas', 'taqueria', 'cantina', 'diner', 'eatery',
  'bakery', 'bäckerei', 'konditorei', 'patisserie',
  'eisdiele', 'ice cream', 'gelateria', 'frozen yogurt',
  'food court', 'food hall', 'street food',
  'italian', 'japanese', 'turkish', 'mexican', 'french', 'indian',
  'greek', 'vietnamese', 'mediterranean', 'american', 'thai',
  'chinese', 'korean', 'spanish', 'german', 'deutsch',
  'italienisch', 'japanisch', 'türkisch', 'mexikanisch', 'französisch',
  'indisch', 'griechisch', 'vietnamesisch', 'mediterran', 'amerikanisch',
  'koreanisch', 'spanisch', 'chinesisch',
  'brunch', 'breakfast', 'frühstück', 'lunch', 'dinner',
  'cocktail', 'cocktails', 'drinks', 'speisekarte', 'küche',
];

const isBlockedHomeVenue = (venue: { name: string; tags: string[] | null; cuisine_type: string | null }): boolean => {
  const name = (venue.name || '').toLowerCase();
  const cuisine = (venue.cuisine_type || '').toLowerCase();
  const tags = (venue.tags || []).map(t => t.toLowerCase());
  const searchText = [name, cuisine, ...tags].join(' ');

  // 1. Explicit blocklist match → block
  if (VENUE_BLOCKLIST.some(blocked => searchText.includes(blocked))) return true;

  // 2. Venue MUST have at least one gastro indicator (in name, cuisine_type, or tags) to pass
  const hasGastroSignal = GASTRO_INDICATORS.some(g => searchText.includes(g));
  if (!hasGastroSignal) return true;

  return false;
};

const getDailyIndex = (offset: number, arrayLength: number) => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return (dayOfYear + offset) % Math.max(arrayLength, 1);
};

export function useHomeTipVenues(): UseHomeTipVenuesResult {
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();

  const { data: rawVenues = [], isLoading } = useQuery({
    queryKey: ['home-tip-venues', user?.id],
    queryFn: async () => {
      // Load user's home location for geographic filtering
      let lat: number | null = null;
      let lng: number | null = null;

      if (user) {
        const { data: userPrefs } = await supabase
          .from('user_preferences')
          .select('home_latitude, home_longitude')
          .eq('user_id', user.id)
          .single();
        lat = userPrefs?.home_latitude ?? null;
        lng = userPrefs?.home_longitude ?? null;
      }

      let query = supabase
        .from('venues')
        .select('id, name, cuisine_type, price_range, rating, address, image_url, tags, latitude, longitude')
        .eq('is_active', true)
        .not('name', 'is', null);

      // Apply geographic bounding box (~200km) to keep venues in the user's region/country
      if (lat !== null && lng !== null) {
        const radiusKm = 25;
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
        query = query
          .gte('latitude', lat - latDelta)
          .lte('latitude', lat + latDelta)
          .gte('longitude', lng - lngDelta)
          .lte('longitude', lng + lngDelta);
      }

      const { data } = await query
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(100);
      return { venues: data || [], userLat: lat, userLng: lng };
    },
    enabled: !!user,
    staleTime: STALE_TIMES.STATIC,
  });

  const userLat = rawVenues?.userLat ?? null;
  const userLng = rawVenues?.userLng ?? null;
  const venueRows = rawVenues?.venues ?? [];

  const venues = useMemo(() => {
    if (rawVenues.length === 0) return [];

    // Filter out supermarkets, delivery services, etc.
    const cleanVenues = rawVenues.filter(v => !isBlockedHomeVenue(v));
    
    const cuisineLower = (prefs?.preferred_cuisines || []).map(c => c.toLowerCase());

    const matching = cleanVenues
      .filter(v => v.cuisine_type && cuisineLower.some(c => v.cuisine_type!.toLowerCase().includes(c)))
      .map(v => ({ ...v, isDiscovery: false }));

    const discovery = cleanVenues
      .filter(v => !v.cuisine_type || !cuisineLower.some(c => v.cuisine_type!.toLowerCase().includes(c)))
      .map(v => ({ ...v, isDiscovery: true }));

    return [...matching, ...discovery];
  }, [rawVenues, prefs?.preferred_cuisines]);

  const result = useMemo(() => {
    if (venues.length === 0) return { dailyTipVenue: null, cityTipVenues: [] as TipVenue[] };

    const matchingVenues = venues.filter(v => !v.isDiscovery);
    const discoveryVenues = venues.filter(v => v.isDiscovery);

    const dailyTipVenue = matchingVenues.length > 0
      ? matchingVenues[getDailyIndex(0, matchingVenues.length)]
      : venues[getDailyIndex(0, venues.length)];

    const cityTip1 = matchingVenues.length > 1
      ? matchingVenues[getDailyIndex(2, matchingVenues.length)]
      : venues[getDailyIndex(1, venues.length)];

    const cityTip2 = discoveryVenues.length > 0
      ? { ...discoveryVenues[getDailyIndex(1, discoveryVenues.length)], isDiscovery: true }
      : venues.length > 2
        ? venues[getDailyIndex(3, venues.length)]
        : null;

    const cityTipVenues: TipVenue[] = [];
    if (cityTip1 && cityTip1.id !== dailyTipVenue?.id) cityTipVenues.push(cityTip1);
    if (cityTip2 && cityTip2.id !== dailyTipVenue?.id && cityTip2.id !== cityTip1?.id) cityTipVenues.push(cityTip2);

    if (cityTipVenues.length < 2) {
      const usedIds = new Set([dailyTipVenue?.id, ...cityTipVenues.map(v => v.id)]);
      const remaining = venues.filter(v => !usedIds.has(v.id));
      while (cityTipVenues.length < 2 && remaining.length > 0) {
        cityTipVenues.push(remaining.shift()!);
      }
    }

    return { dailyTipVenue, cityTipVenues };
  }, [venues]);

  return { ...result, loading: isLoading };
}
