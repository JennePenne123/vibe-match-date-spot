import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  VISIT_ARRIVAL_RADIUS_M,
  VISIT_DEPARTURE_RADIUS_M,
  VISIT_MIN_STAY_MINUTES,
  distanceMeters,
  endVisit,
  getOpenVisit,
  getVisitCandidates,
  startVisit,
  updateClosestDistance,
  type VenueVisit,
  type VisitCandidate,
} from '@/services/visitVerificationService';

const POLL_INTERVAL_MS = 90_000;

const getPosition = (): Promise<GeolocationPosition | null> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  });

/**
 * Verifies real venue visits while the app is in the foreground:
 * automatic arrival/departure detection plus a manual check-in fallback.
 */
export const useVisitVerification = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<VisitCandidate[]>([]);
  const [openVisit, setOpenVisit] = useState<VenueVisit | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const awayCountRef = useRef(0);
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const [cands, visit] = await Promise.all([
      getVisitCandidates(user.id),
      getOpenVisit(user.id),
    ]);
    setCandidates(cands);
    setOpenVisit(visit);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    refresh();
  }, [user?.id, refresh]);

  /** One geolocation tick: detects arrival and departure. */
  const runCheck = useCallback(async () => {
    if (!user?.id || busyRef.current) return;
    if (candidates.length === 0 && !openVisit) return;
    busyRef.current = true;

    try {
      const permissions = (navigator as any).permissions;
      if (permissions?.query) {
        try {
          const status = await permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state !== 'granted') return;
        } catch {
          /* permissions API unavailable — try anyway */
        }
      }

      const pos = await getPosition();
      if (!pos) return;
      const { latitude, longitude } = pos.coords;

      if (openVisit?.venue_latitude && openVisit?.venue_longitude) {
        const dist = distanceMeters(
          latitude,
          longitude,
          Number(openVisit.venue_latitude),
          Number(openVisit.venue_longitude)
        );

        if (dist <= VISIT_ARRIVAL_RADIUS_M) {
          awayCountRef.current = 0;
          if (
            openVisit.closest_distance_m == null ||
            dist < Number(openVisit.closest_distance_m)
          ) {
            await updateClosestDistance(openVisit.id, dist);
          }
          if (!openVisit.verified) {
            setOpenVisit({ ...openVisit, verified: true });
          }
          return;
        }

        if (dist > VISIT_DEPARTURE_RADIUS_M) {
          awayCountRef.current += 1;
          const stayedMinutes =
            (Date.now() - new Date(openVisit.arrived_at).getTime()) / 60_000;
          if (awayCountRef.current >= 2 && stayedMinutes >= VISIT_MIN_STAY_MINUTES) {
            await endVisit(openVisit.id);
            awayCountRef.current = 0;
            await refresh();
          }
        }
        return;
      }

      // No open visit — look for an arrival
      let best: { candidate: VisitCandidate; dist: number } | null = null;
      for (const candidate of candidates) {
        const dist = distanceMeters(latitude, longitude, candidate.latitude, candidate.longitude);
        if (dist <= VISIT_ARRIVAL_RADIUS_M && (!best || dist < best.dist)) {
          best = { candidate, dist };
        }
      }
      if (best) {
        const visit = await startVisit(user.id, best.candidate, {
          verified: true,
          method: 'auto',
          distanceM: best.dist,
        });
        if (visit) setOpenVisit(visit);
      }
    } finally {
      busyRef.current = false;
    }
  }, [user?.id, candidates, openVisit, refresh]);

  useEffect(() => {
    if (!user?.id) return;
    if (candidates.length === 0 && !openVisit) return;

    runCheck();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') runCheck();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') runCheck();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, candidates.length, openVisit?.id, runCheck]);

  /** Manual "I'm here" — silently verified via GPS when possible. */
  const checkIn = useCallback(
    async (candidate: VisitCandidate) => {
      if (!user?.id) return null;
      setCheckingIn(true);
      try {
        const pos = await getPosition();
        let verified = false;
        let dist: number | null = null;
        if (pos) {
          dist = distanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            candidate.latitude,
            candidate.longitude
          );
          verified = dist <= VISIT_ARRIVAL_RADIUS_M;
        }
        const visit = await startVisit(user.id, candidate, {
          verified,
          method: 'manual',
          distanceM: dist,
        });
        if (visit) setOpenVisit(visit);
        return visit;
      } finally {
        setCheckingIn(false);
      }
    },
    [user?.id]
  );

  /** Manual "I've left" — closes the visit and schedules the rating prompt. */
  const checkOut = useCallback(async () => {
    if (!openVisit) return;
    await endVisit(openVisit.id);
    awayCountRef.current = 0;
    await refresh();
  }, [openVisit, refresh]);

  return { candidates, openVisit, loading, checkingIn, checkIn, checkOut, refresh };
};
