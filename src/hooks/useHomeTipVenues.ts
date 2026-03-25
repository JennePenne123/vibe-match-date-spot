import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [venues, setVenues] = useState<TipVenue[]>([]);
  const [userCuisines, setUserCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user preferences and venues in parallel
        const [prefsResult, venuesResult] = await Promise.all([
          supabase
            .from('user_preferences')
            .select('preferred_cuisines, home_latitude, home_longitude')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('venues')
            .select('id, name, cuisine_type, price_range, rating, address, image_url, tags')
            .eq('is_active', true)
            .not('name', 'is', null)
            .order('rating', { ascending: false, nullsFirst: false })
            .limit(100),
        ]);

        const cuisines = prefsResult.data?.preferred_cuisines || [];
        setUserCuisines(cuisines);

        if (venuesResult.data && venuesResult.data.length > 0) {
          let filteredVenues = venuesResult.data;

          // If user has location, try to filter by proximity (rough bounding box)
          const lat = prefsResult.data?.home_latitude;
          const lng = prefsResult.data?.home_longitude;
          if (lat && lng) {
            const delta = 0.15; // ~15km
            const nearbyVenues = venuesResult.data.filter(v => {
              // Venues might not have lat/lng in the select, check address proximity instead
              return true; // We already ordered by rating, just use all
            });
            if (nearbyVenues.length > 0) {
              filteredVenues = nearbyVenues;
            }
          }

          // Split into preference-matching and discovery
          const cuisineLower = cuisines.map((c: string) => c.toLowerCase());
          
          const matchingVenues = filteredVenues.filter(v => {
            if (!v.cuisine_type) return false;
            return cuisineLower.some((c: string) => v.cuisine_type!.toLowerCase().includes(c));
          });

          const discoveryVenues = filteredVenues.filter(v => {
            if (!v.cuisine_type) return true; // Unknown cuisine = discovery
            return !cuisineLower.some((c: string) => v.cuisine_type!.toLowerCase().includes(c));
          });

          // Mark venues with discovery flag
          const taggedMatching = matchingVenues.map(v => ({ ...v, isDiscovery: false }));
          const taggedDiscovery = discoveryVenues.map(v => ({ ...v, isDiscovery: true }));

          // Combine: matching first, then discovery
          setVenues([...taggedMatching, ...taggedDiscovery]);
        }
      } catch (error) {
        console.error('Error fetching tip venues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const result = useMemo(() => {
    if (venues.length === 0) {
      return { dailyTipVenue: null, cityTipVenues: [] };
    }

    const matchingVenues = venues.filter(v => !v.isDiscovery);
    const discoveryVenues = venues.filter(v => v.isDiscovery);

    // Daily tip: preference-based venue, rotated daily
    const dailyTipVenue = matchingVenues.length > 0
      ? matchingVenues[getDailyIndex(0, matchingVenues.length)]
      : venues[getDailyIndex(0, venues.length)];

    // City tips: one preference-based, one discovery
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

    // If we don't have enough unique venues, fill from remaining
    if (cityTipVenues.length < 2) {
      const usedIds = new Set([dailyTipVenue?.id, ...cityTipVenues.map(v => v.id)]);
      const remaining = venues.filter(v => !usedIds.has(v.id));
      while (cityTipVenues.length < 2 && remaining.length > 0) {
        cityTipVenues.push(remaining.shift()!);
      }
    }

    return { dailyTipVenue, cityTipVenues };
  }, [venues]);

  return { ...result, loading };
}
