// Implicit Signals Service
// Tracks user behavior signals (dwell time, clicks, patterns) without explicit feedback
// These signals feed into the AI scoring engine for better recommendations

import { supabase } from '@/integrations/supabase/client';

export type ImplicitSignalType = 
  | 'venue_dwell'        // Time spent on venue detail page
  | 'venue_scroll_depth' // How far user scrolled on venue detail
  | 'category_browse'    // Browsing a specific cuisine/category repeatedly
  | 'time_of_use'        // When the user uses the app
  | 'voucher_click'      // Clicked on a voucher (price sensitivity signal)
  | 'voucher_ignore'     // Saw voucher but didn't click
  | 'planning_abandon'   // Abandoned planning flow at a step
  | 'search_query'       // What the user searched for
  | 'repeat_venue_view'  // Viewed same venue multiple times;

export interface ImplicitSignal {
  signal_type: ImplicitSignalType;
  venue_id?: string;
  value: number;          // Normalized signal strength (0-1)
  raw_value?: number;     // Raw value (e.g., seconds, pixels, count)
  metadata?: Record<string, any>;
}

const TRACKING_OPT_OUT_KEY = 'vybepulse_tracking_opt_out';

/** Check if the user has opted out of implicit tracking */
function isTrackingOptedOut(): boolean {
  try {
    return localStorage.getItem(TRACKING_OPT_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

// In-memory buffer to batch signals before writing
const signalBuffer: ImplicitSignal[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 10_000; // 10 seconds
const MAX_BUFFER_SIZE = 20;

// Track venue view timestamps for dwell time calculation
const venueViewTimestamps: Map<string, number> = new Map();
// Track venue view counts for repeat detection
const venueViewCounts: Map<string, number> = new Map();

/**
 * Record an implicit signal into the buffer
 */
export const recordSignal = (signal: ImplicitSignal): void => {
  signalBuffer.push(signal);
  
  if (signalBuffer.length >= MAX_BUFFER_SIZE) {
    flushSignals();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushSignals, FLUSH_INTERVAL);
  }
};

/**
 * Flush buffered signals to Supabase.
 * Aggregates ALL signal types per venue into a composite context object.
 */
const flushSignals = async (): Promise<void> => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (signalBuffer.length === 0) return;

  const signalsToFlush = [...signalBuffer];
  signalBuffer.length = 0;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Group signals by venue and merge all signal types
    const venueSignalMap = new Map<string, Record<string, any>>();

    for (const s of signalsToFlush) {
      if (!s.venue_id) continue;

      if (!venueSignalMap.has(s.venue_id)) {
        venueSignalMap.set(s.venue_id, { signals: {}, updated_at: new Date().toISOString() });
      }

      const entry = venueSignalMap.get(s.venue_id)!;
      const existing = entry.signals[s.signal_type];

      // Keep the strongest signal per type, but accumulate counts
      if (!existing || s.value > existing.value) {
        entry.signals[s.signal_type] = {
          value: s.value,
          raw_value: s.raw_value,
          count: (existing?.count || 0) + 1,
          last_recorded: new Date().toISOString(),
          ...s.metadata,
        };
      } else {
        existing.count = (existing.count || 0) + 1;
      }
    }

    // Upsert with merged context containing ALL signal types
    for (const [venueId, signalData] of venueSignalMap) {
      // First try to read existing context to merge with it
      const { data: existing } = await supabase
        .from('user_venue_feedback')
        .select('context')
        .eq('user_id', user.id)
        .eq('venue_id', venueId)
        .maybeSingle();

      const existingCtx = (existing?.context as any) || {};
      const existingSignals = existingCtx.signals || {};

      // Deep merge: keep higher values, accumulate counts
      const mergedSignals = { ...existingSignals };
      for (const [type, newData] of Object.entries(signalData.signals)) {
        const old = mergedSignals[type];
        if (!old || (newData as any).value > old.value) {
          mergedSignals[type] = {
            ...(newData as any),
            count: ((old?.count || 0) + ((newData as any).count || 1)),
          };
        } else {
          old.count = (old.count || 0) + ((newData as any).count || 1);
        }
      }

      await supabase
        .from('user_venue_feedback')
        .upsert({
          user_id: user.id,
          venue_id: venueId,
          feedback_type: 'interested',
          context: {
            implicit: true,
            signals: mergedSignals,
            signal_count: Object.keys(mergedSignals).length,
            last_updated: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,venue_id' })
        .select();
    }

    if (import.meta.env.DEV) {
      console.log(`📡 Implicit signals flushed: ${venueSignalMap.size} venues, ${signalsToFlush.length} signals`);
    }
  } catch (error) {
    console.error('Error flushing implicit signals:', error);
    signalBuffer.push(...signalsToFlush);
  }
};

// ============================================================================
// SIGNAL RECORDING HELPERS
// ============================================================================

/**
 * Track when user opens a venue detail page
 */
export const trackVenueViewStart = (venueId: string): void => {
  venueViewTimestamps.set(venueId, Date.now());
  
  const count = (venueViewCounts.get(venueId) || 0) + 1;
  venueViewCounts.set(venueId, count);
  
  if (count > 1) {
    recordSignal({
      signal_type: 'repeat_venue_view',
      venue_id: venueId,
      value: Math.min(count / 4, 1), // 4+ views = max signal (was 5)
      raw_value: count,
      metadata: { view_count: count },
    });
  }
};

/**
 * Track when user leaves a venue detail page (calculates dwell time)
 */
export const trackVenueViewEnd = (venueId: string): void => {
  const startTime = venueViewTimestamps.get(venueId);
  if (!startTime) return;

  const dwellTimeMs = Date.now() - startTime;
  const dwellTimeSec = dwellTimeMs / 1000;
  venueViewTimestamps.delete(venueId);

  if (dwellTimeSec < 3 || dwellTimeSec > 600) return;

  // Normalize with a curve: 15s = 0.5, 45s = 0.85, 90s+ = ~1.0
  const normalizedValue = Math.min(1, 1 - Math.exp(-dwellTimeSec / 30));

  recordSignal({
    signal_type: 'venue_dwell',
    venue_id: venueId,
    value: normalizedValue,
    raw_value: dwellTimeSec,
    metadata: { dwell_time_seconds: Math.round(dwellTimeSec) },
  });
};

/**
 * Track scroll depth on venue detail page
 */
export const trackScrollDepth = (venueId: string, depthPercent: number): void => {
  if (depthPercent < 20) return; // Lower threshold (was 25)

  recordSignal({
    signal_type: 'venue_scroll_depth',
    venue_id: venueId,
    value: depthPercent / 100,
    raw_value: depthPercent,
    metadata: { scroll_depth_percent: depthPercent },
  });
};

/**
 * Track voucher interaction (click vs ignore)
 */
export const trackVoucherInteraction = (venueId: string, clicked: boolean): void => {
  recordSignal({
    signal_type: clicked ? 'voucher_click' : 'voucher_ignore',
    venue_id: venueId,
    value: clicked ? 0.9 : 0.3,
    raw_value: clicked ? 1 : 0,
    metadata: { voucher_clicked: clicked },
  });
};

/**
 * Track planning flow abandonment
 */
export const trackPlanningAbandon = (step: string, venueId?: string): void => {
  recordSignal({
    signal_type: 'planning_abandon',
    venue_id: venueId,
    value: 0.4, // Negative signal
    raw_value: 1,
    metadata: { abandoned_at_step: step },
  });
};

/**
 * Track app usage time pattern
 */
export const trackUsageTime = (): void => {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();

  recordSignal({
    signal_type: 'time_of_use',
    value: 1,
    raw_value: hour,
    metadata: {
      hour,
      day_of_week: dayOfWeek,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
      time_slot: hour < 11 ? 'morning' : hour < 14 ? 'lunch' : hour < 18 ? 'afternoon' : hour < 22 ? 'evening' : 'late_night',
    },
  });
};

// ============================================================================
// SIGNAL AGGREGATION (for AI scoring)
// ============================================================================

/**
 * Signal type weights for scoring.
 * Positive signals boost, negative signals penalize.
 * Max total boost is capped at ±10%.
 */
const SIGNAL_WEIGHTS: Record<string, { weight: number; direction: 'positive' | 'negative' }> = {
  'venue_dwell':        { weight: 0.06, direction: 'positive' },   // Long dwell = interest
  'repeat_venue_view':  { weight: 0.08, direction: 'positive' },   // Repeat views = strong interest
  'venue_scroll_depth': { weight: 0.04, direction: 'positive' },   // Deep scroll = engagement
  'voucher_click':      { weight: 0.05, direction: 'positive' },   // Price-conscious but interested
  'voucher_ignore':     { weight: 0.02, direction: 'negative' },   // Saw but skipped
  'planning_abandon':   { weight: 0.04, direction: 'negative' },   // Abandoned = not interested
};

/**
 * Time decay factor: signals lose 50% strength after 14 days
 */
function getDecayFactor(lastRecorded: string | undefined): number {
  if (!lastRecorded) return 0.5;
  const ageMs = Date.now() - new Date(lastRecorded).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  // Exponential decay with half-life of 14 days
  return Math.exp(-0.693 * ageDays / 14);
}

/**
 * Get aggregated implicit signal boost for a user-venue pair.
 * Reads ALL stored signal types and computes a composite score.
 * Returns a value between -0.10 and +0.10 (±10%).
 */
export const getImplicitSignalBoost = async (
  userId: string,
  venueId: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_venue_feedback')
      .select('context, feedback_type')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .maybeSingle();

    if (error || !data) return 0;

    const context = data.context as any;
    if (!context?.implicit) return 0;

    const signals = context.signals;
    if (!signals || typeof signals !== 'object') {
      // Legacy format: single signal
      const signalValue = context.signal_value || 0;
      const signalType = context.signal_type as string;
      const config = SIGNAL_WEIGHTS[signalType];
      if (!config) return 0;
      const boost = signalValue * config.weight;
      return config.direction === 'negative' ? -boost : boost;
    }

    // New format: aggregate all signal types
    let totalBoost = 0;

    for (const [signalType, signalData] of Object.entries(signals)) {
      const config = SIGNAL_WEIGHTS[signalType];
      if (!config) continue;

      const data = signalData as any;
      const value = data.value || 0;
      const decay = getDecayFactor(data.last_recorded);
      const countBonus = Math.min((data.count || 1) * 0.1, 0.5); // More interactions = stronger signal, capped

      const signalStrength = value * config.weight * decay * (1 + countBonus);

      if (config.direction === 'negative') {
        totalBoost -= signalStrength;
      } else {
        totalBoost += signalStrength;
      }
    }

    // Clamp to ±10%
    return Math.max(-0.10, Math.min(0.10, totalBoost));
  } catch {
    return 0;
  }
};

/**
 * Flush remaining signals on page unload
 */
export const flushOnUnload = (): void => {
  if (signalBuffer.length > 0) {
    if (import.meta.env.DEV) {
      console.log('📡 Flushing signals on unload:', signalBuffer.length);
    }
    flushSignals();
  }
};

// Register unload handler
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushOnUnload);
}
