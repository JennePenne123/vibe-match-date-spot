import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';
import { APP_VERSION, buildErrorContext } from '@/utils/errorContext';

let SENTRY_DSN: string = import.meta.env.VITE_SENTRY_DSN ?? '';
let sentryInitialized = false;

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
  // Guard against double initialization (HMR, StrictMode double-invoke, races):
  // a second Sentry.init() spawns a second Session Replay instance, which is
  // unsupported and throws at runtime.
  if (sentryInitialized) return;

  if (!SENTRY_DSN) {
    SENTRY_DSN = await fetchDsnFromBackend();
  }

  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] No DSN configured, skipping initialization');
    }
    return;
  }

  sentryInitialized = true;

  Sentry.init({
    dsn: SENTRY_DSN,
    release: APP_VERSION,
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
  const base = buildErrorContext(null, false);
  Sentry.setTag('route', base.route);
  Sentry.setTag('app_version', base.app.version);
  Sentry.setTag('runtime', base.app.runtime);
  Sentry.setContext('device', base.device as unknown as Record<string, unknown>);
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
