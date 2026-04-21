import { supabase } from '@/integrations/supabase/client';

/**
 * Onboarding Funnel Analytics
 *
 * Lightweight, fire-and-forget tracker for the cold-start journey:
 *   /welcome  →  /preferences  →  /friends  →  /results
 *
 * Goals:
 *   • See where users drop off (step-level conversion).
 *   • Group events from the same browser session via a stable session_id.
 *   • Tolerate anonymous users (RLS allows user_id NULL).
 *   • Never throw – analytics must NEVER break onboarding UX.
 */

const SESSION_KEY = 'hioutz-funnel-session-id';

export type FunnelName = 'onboarding';

export type FunnelAction =
  | 'entered'
  | 'completed'
  | 'skipped'
  | 'abandoned'
  | 'error';

/** Canonical step definitions – keep in sync with admin widget */
export const ONBOARDING_FUNNEL_STEPS: Array<{ key: string; index: number; label: string }> = [
  { key: 'welcome', index: 0, label: 'Welcome' },
  { key: 'food_vibes', index: 1, label: 'Food & Vibes' },
  { key: 'venue_swipe', index: 2, label: 'Venue Swipe' },
  { key: 'lifestyle', index: 3, label: 'Lifestyle' },
  { key: 'distance_location', index: 4, label: 'Distance / Area' },
  { key: 'preferences_page', index: 5, label: 'Preferences (Wizard)' },
  { key: 'friends_page', index: 6, label: 'Friends Invite' },
  { key: 'results_reached', index: 7, label: 'Results' },
];

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // sessionStorage may be unavailable (SSR / private mode) – fall back to per-call id.
    return `nostore-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export interface TrackFunnelStepInput {
  stepKey: string;
  stepIndex: number;
  action: FunnelAction;
  funnelName?: FunnelName;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget event tracker. Never throws.
 */
export async function trackFunnelStep(input: TrackFunnelStepInput): Promise<void> {
  try {
    const { data: userResult } = await supabase.auth.getUser();
    const userId = userResult?.user?.id ?? null;

    await supabase.from('onboarding_funnel_events').insert({
      user_id: userId,
      session_id: getOrCreateSessionId(),
      funnel_name: input.funnelName ?? 'onboarding',
      step_key: input.stepKey,
      step_index: input.stepIndex,
      action: input.action,
      metadata: (input.metadata ?? {}) as never,
    });
  } catch (err) {
    // Analytics failures must never break the user flow.
    if (import.meta.env.DEV) {
      console.warn('[funnelAnalytics] failed to log event', err);
    }
  }
}

/** Convenience: lookup helper for known steps */
export function getOnboardingStep(key: string) {
  return ONBOARDING_FUNNEL_STEPS.find((s) => s.key === key);
}