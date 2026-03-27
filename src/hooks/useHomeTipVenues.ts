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
  isDiscovery: boolean;
}

interface UseHomeTipVenuesResult {
  dailyTipVenue: TipVenue | null;
  cityTipVenues: TipVenue[];
  loading: boolean;
}

const getDailyIndex = (offset: number, arrayLength: number) => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return (dayOfYear + offset) % Math.max(arrayLength, 1);
};

export function useHomeTipVenues(): UseHomeTipVenuesResult {
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();

  const { data: rawVenues = [], isLoading } = useQuery({
    queryKey: ['home-tip-venues'],
    queryFn: async () => {
      const { data } = await supabase
        .from('venues')
        .select('id, name, cuisine_type, price_range, rating, address, image_url, tags')
        .eq('is_active', true)
        .not('name', 'is', null)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user,
    staleTime: STALE_TIMES.STATIC,
  });

  const venues = useMemo(() => {
    if (rawVenues.length === 0) return [];
    const cuisineLower = (prefs?.preferred_cuisines || []).map(c => c.toLowerCase());

    const matching = rawVenues
      .filter(v => v.cuisine_type && cuisineLower.some(c => v.cuisine_type!.toLowerCase().includes(c)))
      .map(v => ({ ...v, isDiscovery: false }));

    const discovery = rawVenues
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
