import React from 'react';
import * as Sentry from '@sentry/react';
import { toast } from '@/hooks/use-toast';

/**
 * Hidden Sentry test trigger.
 *
 * Two ways to fire a controlled test error:
 *  1) Keyboard shortcut: Ctrl/Cmd + Shift + E
 *  2) Tap the invisible 32x32 hotspot in the bottom-right corner 5x within 3s
 *
 * The error is tagged so it's easy to find/filter in Sentry as `sentry-test`.
 * Remove this component once you've confirmed events arrive in Sentry.
 */
const SentryTestTrigger: React.FC = () => {
  const tapsRef = React.useRef<number[]>([]);

  const fireTestError = React.useCallback((source: string) => {
    const timestamp = new Date().toISOString();
    const err = new Error(`[Sentry Test] Controlled error from ${source} @ ${timestamp}`);
    err.name = 'SentryTestError';

    // 1) Explicit capture with tags + level so it's easy to find in Sentry
    const eventId = Sentry.captureException(err, {
      level: 'error',
      tags: { test: 'sentry-test', source },
      extra: { route: window.location.pathname, timestamp },
    });

    // 2) Force-flush so the event is sent immediately (not batched)
    Sentry.flush(2000).then((ok) => {
      console.warn('[SentryTest] flush result:', ok, 'eventId:', eventId);
    });

    console.warn('[SentryTest] Fired controlled test error:', err.message, 'eventId:', eventId);
    toast({
      title: 'Sentry test error sent',
      description: `eventId: ${eventId?.slice(0, 8) ?? 'n/a'} — check sentry.io → Issues (~10s).`,
    });

    // 3) Also throw an uncaught error after a tick — this hits the global
    //    error handler, which Sentry definitely captures.
    setTimeout(() => {
      throw new Error(`[Sentry Test UNCAUGHT] from ${source} @ ${timestamp}`);
    }, 50);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + E
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        fireTestError('keyboard-shortcut');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fireTestError]);

  const handleHotspotTap = () => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 3000), now];
    if (tapsRef.current.length >= 5) {
      tapsRef.current = [];
      fireTestError('hotspot-5tap');
    }
  };

  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      onClick={handleHotspotTap}
      style={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        opacity: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: 0,
        zIndex: 2147483647,
        cursor: 'default',
      }}
    />
  );
};

export default SentryTestTrigger;