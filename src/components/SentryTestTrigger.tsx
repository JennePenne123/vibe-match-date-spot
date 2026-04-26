import React from 'react';
import { captureError } from '@/services/sentryService';
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
    const err = new Error(`[Sentry Test] Controlled error from ${source} @ ${new Date().toISOString()}`);
    err.name = 'SentryTestError';
    // Forward to Sentry with extra context
    captureError(err, {
      test: true,
      tag: 'sentry-test',
      source,
      route: window.location.pathname,
    });
    // Also log so you can see it in console
    console.warn('[SentryTest] Fired controlled test error:', err.message);
    toast({
      title: 'Sentry test error sent',
      description: 'Check sentry.io → Issues (may take ~10s).',
    });
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