import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const THRESHOLD = 70;
const MAX_PULL = 120;

/**
 * Native-feeling pull-to-refresh. Only activates when the window is scrolled
 * to the very top and the user starts a downward touch drag. Triggers a full
 * reload of the current route.
 */
const PullToRefresh: React.FC = () => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  // Expose a shared AbortController that feature code can opt into via
  // `signal: (window as any).__hioutzRefreshSignal`. Pull-to-refresh aborts
  // it before triggering fresh fetches, so in-flight requests don't race
  // with the new ones and cause duplicate state updates.
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    (window as unknown as { __hioutzRefreshSignal?: AbortSignal }).__hioutzRefreshSignal = ctrl.signal;
    return () => {
      ctrl.abort();
    };
  }, []);

  const triggerRefresh = async () => {
    // 1. Abort any in-flight requests wired to the shared signal.
    abortRef.current?.abort();
    const nextCtrl = new AbortController();
    abortRef.current = nextCtrl;
    (window as unknown as { __hioutzRefreshSignal?: AbortSignal }).__hioutzRefreshSignal = nextCtrl.signal;

    // 2. Cancel and invalidate all React Query queries so nothing lingers.
    try {
      await queryClient.cancelQueries();
      await queryClient.invalidateQueries();
    } catch {
      // ignore
    }

    // 3. Reset UI after a short beat so the spinner is visible.
    setTimeout(() => {
      setRefreshing(false);
      setPull(0);
    }, 400);
  };

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      if (e.touches.length !== 1) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current === null) return;
      if (window.scrollY > 0) {
        active.current = false;
        setPull(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      // Rubber-band resistance
      const resisted = Math.min(MAX_PULL, delta * 0.5);
      setPull(resisted);
    };

    const onTouchEnd = () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pull >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        // Cancel in-flight requests + refetch queries instead of full reload
        void triggerRefresh();
      } else {
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [pull]);

  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(1, pull / THRESHOLD);
  const rotate = progress * 360;

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-[100] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pull - 40}px)`, transition: refreshing ? 'transform 200ms' : 'none' }}
    >
      <div className="mt-2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-md flex items-center justify-center">
        <RefreshCw
          className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${rotate}deg)`, opacity: 0.4 + progress * 0.6 }}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;