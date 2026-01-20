import { useState, useEffect, useRef } from 'react';
import { getRouteInfoBoth, RouteInfo } from '@/services/routingService';

interface VenueLocation {
  venue_id: string;
  latitude?: number;
  longitude?: number;
}

export interface VenueRouteData {
  driving: RouteInfo | null;
  walking: RouteInfo | null;
}

interface UseBatchRouteInfoOptions {
  venues: VenueLocation[];
  userLocation?: { latitude: number; longitude: number };
  enabled?: boolean;
  concurrencyLimit?: number;
}

interface UseBatchRouteInfoResult {
  routeData: Map<string, VenueRouteData>;
  loading: boolean;
  progress: number; // 0-100
  error: boolean;
}

export const useBatchRouteInfo = (options: UseBatchRouteInfoOptions): UseBatchRouteInfoResult => {
  const { venues, userLocation, enabled = true, concurrencyLimit = 5 } = options;
  
  const [routeData, setRouteData] = useState<Map<string, VenueRouteData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  
  // Track which venues we've already fetched
  const fetchedVenuesRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Guard: need user location and enabled
    if (!enabled || !userLocation?.latitude || !userLocation?.longitude) {
      return;
    }

    // Filter venues that have coordinates and haven't been fetched
    const venuesToFetch = venues.filter(v => 
      v.latitude != null && 
      v.longitude != null && 
      !fetchedVenuesRef.current.has(v.venue_id)
    );

    if (venuesToFetch.length === 0) {
      return;
    }

    // Abort any previous fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchRoutes = async () => {
      setLoading(true);
      setError(false);
      
      let completed = 0;
      const total = venuesToFetch.length;
      const newRouteData = new Map(routeData);

      // Process venues in batches with concurrency limit
      const processBatch = async (batch: VenueLocation[]) => {
        const promises = batch.map(async (venue) => {
          try {
            const result = await getRouteInfoBoth({
              originLat: userLocation.latitude,
              originLng: userLocation.longitude,
              destLat: venue.latitude!,
              destLng: venue.longitude!
            });

            newRouteData.set(venue.venue_id, {
              driving: result.driving,
              walking: result.walking
            });
            
            fetchedVenuesRef.current.add(venue.venue_id);
            completed++;
            setProgress(Math.round((completed / total) * 100));
            setRouteData(new Map(newRouteData));
          } catch (err) {
            console.error(`Failed to fetch route for venue ${venue.venue_id}:`, err);
            // Set null routes for failed venues
            newRouteData.set(venue.venue_id, { driving: null, walking: null });
            fetchedVenuesRef.current.add(venue.venue_id);
            completed++;
          }
        });

        await Promise.all(promises);
      };

      try {
        // Split into batches based on concurrency limit
        for (let i = 0; i < venuesToFetch.length; i += concurrencyLimit) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          const batch = venuesToFetch.slice(i, i + concurrencyLimit);
          await processBatch(batch);
        }
      } catch (err) {
        console.error('Batch route fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [venues, userLocation?.latitude, userLocation?.longitude, enabled, concurrencyLimit]);

  // Reset fetched venues when user location changes significantly
  useEffect(() => {
    fetchedVenuesRef.current.clear();
    setRouteData(new Map());
    setProgress(0);
  }, [userLocation?.latitude, userLocation?.longitude]);

  return { routeData, loading, progress, error };
};
