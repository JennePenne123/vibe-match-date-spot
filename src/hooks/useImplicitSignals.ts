import { useEffect, useRef, useCallback } from 'react';
import {
  trackVenueViewStart,
  trackVenueViewEnd,
  trackScrollDepth,
  trackVoucherInteraction,
  trackUsageTime,
} from '@/services/implicitSignalsService';

/**
 * Hook to track implicit signals on a venue detail page
 * Automatically tracks: dwell time, scroll depth, repeat views
 */
export const useVenueImplicitTracking = (venueId: string | undefined) => {
  const scrollTracked = useRef(false);
  const maxScrollDepth = useRef(0);

  useEffect(() => {
    if (!venueId) return;

    trackVenueViewStart(venueId);
    scrollTracked.current = false;
    maxScrollDepth.current = 0;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const depth = Math.round((scrollTop / docHeight) * 100);
      if (depth > maxScrollDepth.current) {
        maxScrollDepth.current = depth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Record scroll depth and dwell time on unmount
      if (maxScrollDepth.current > 0) {
        trackScrollDepth(venueId, maxScrollDepth.current);
      }
      trackVenueViewEnd(venueId);
    };
  }, [venueId]);

  const onVoucherClick = useCallback((clicked: boolean) => {
    if (venueId) {
      trackVoucherInteraction(venueId, clicked);
    }
  }, [venueId]);

  return { onVoucherClick };
};

/**
 * Hook to track general app usage patterns
 * Call once at app level
 */
export const useAppUsageTracking = () => {
  useEffect(() => {
    // Track usage time on mount
    trackUsageTime();

    // Track periodically (every 5 minutes of active use)
    const interval = setInterval(trackUsageTime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};
