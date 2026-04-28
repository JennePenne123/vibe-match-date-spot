import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';

let SENTRY_DSN: string = import.meta.env.VITE_SENTRY_DSN ?? '';

async function fetchDsnFromBackend(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('get-sentry-config');
    if (error || !data?.dsn) return '';
    return data.dsn as string;
  } catch {
    return '';
  }
}

export async function initSentry(): Promise<void> {
  if (!SENTRY_DSN) {
    SENTRY_DSN = await fetchDsnFromBackend();
  }

  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] No DSN configured, skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.DEV ? 'development' : 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance: sample 20% of transactions in prod
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
    // Session Replay: 5% normal, 100% on error
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    // Don't send in dev by default
    enabled: !!SENTRY_DSN,
    beforeSend(event) {
      // Filter out noisy errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },
  });

  if (import.meta.env.DEV) {
    console.log('[Sentry] Initialized');
  }
}

/** Forward errors to Sentry */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  if (context) {
    Sentry.setContext('extra', context);
  }
  Sentry.captureException(error);
}

/** Set user context for Sentry */
export function setSentryUser(userId: string, email?: string): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser({ id: userId, email });
}

/** Clear user context on logout */
export function clearSentryUser(): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}
