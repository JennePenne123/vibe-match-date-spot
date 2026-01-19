import { useState, useEffect } from 'react';
import { getRouteInfoBoth, RouteInfo } from '@/services/routingService';

interface UseRouteInfoOptions {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  enabled?: boolean;
}

interface UseRouteInfoResult {
  driving: RouteInfo | null;
  walking: RouteInfo | null;
  loading: boolean;
  error: boolean;
}

export const useRouteInfo = (options: UseRouteInfoOptions): UseRouteInfoResult => {
  const [driving, setDriving] = useState<RouteInfo | null>(null);
  const [walking, setWalking] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { originLat, originLng, destLat, destLng, enabled = true } = options;

  useEffect(() => {
    // Reset state when coordinates change
    setDriving(null);
    setWalking(null);
    setError(false);

    // Guard clause: check if all required coordinates exist
    if (!enabled || originLat == null || originLng == null || destLat == null || destLng == null) {
      return;
    }

    let cancelled = false;

    const fetchRoutes = async () => {
      setLoading(true);
      setError(false);

      try {
        const result = await getRouteInfoBoth({
          originLat,
          originLng,
          destLat,
          destLng
        });

        if (!cancelled) {
          setDriving(result.driving);
          setWalking(result.walking);
          
          // Set error if both failed
          if (!result.driving && !result.walking) {
            setError(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          console.error('Failed to fetch route info:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRoutes();

    return () => {
      cancelled = true;
    };
  }, [originLat, originLng, destLat, destLng, enabled]);

  return { driving, walking, loading, error };
};
