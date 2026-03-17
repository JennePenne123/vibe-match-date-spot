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
 * Flush buffered signals to Supabase
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

    // Store as venue feedback with implicit signal context
    const feedbackEntries = signalsToFlush
      .filter(s => s.venue_id) // Only store venue-related signals
      .map(s => ({
        user_id: user.id,
        venue_id: s.venue_id!,
        feedback_type: 'interested' as const, // Map to existing feedback type
        context: {
          implicit: true,
          signal_type: s.signal_type,
          signal_value: s.value,
          raw_value: s.raw_value,
          ...s.metadata,
          recorded_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }));

    if (feedbackEntries.length === 0) return;

    // Batch upsert - use the strongest signal per venue
    const venueSignals = new Map<string, typeof feedbackEntries[0]>();
    for (const entry of feedbackEntries) {
      const existing = venueSignals.get(entry.venue_id);
      if (!existing || (entry.context as any).signal_value > (existing.context as any).signal_value) {
        venueSignals.set(entry.venue_id, entry);
      }
    }

    for (const entry of venueSignals.values()) {
      await supabase
        .from('user_venue_feedback')
        .upsert(entry, { onConflict: 'user_id,venue_id' })
        .select();
    }

    if (import.meta.env.DEV) {
      console.log(`📡 Implicit signals flushed: ${venueSignals.size} venue signals`);
    }
  } catch (error) {
    console.error('Error flushing implicit signals:', error);
    // Re-add failed signals back to buffer
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
  
  // Track repeat views
  const count = (venueViewCounts.get(venueId) || 0) + 1;
  venueViewCounts.set(venueId, count);
  
  if (count > 1) {
    recordSignal({
      signal_type: 'repeat_venue_view',
      venue_id: venueId,
      value: Math.min(count / 5, 1), // Normalize: 5+ views = max signal
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

  // Only record meaningful dwell times (> 3 seconds, < 10 minutes)
  if (dwellTimeSec < 3 || dwellTimeSec > 600) return;

  // Normalize: 30+ seconds = strong interest signal
  const normalizedValue = Math.min(dwellTimeSec / 30, 1);

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
  if (depthPercent < 25) return; // Only track meaningful scroll

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
    value: clicked ? 0.8 : 0.2,
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
    value: 0.3, // Negative signal
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
 * Get aggregated implicit signals for a user-venue pair
 * Used by the scoring engine to boost/penalize scores
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

    const signalValue = context.signal_value || 0;
    const signalType = context.signal_type as ImplicitSignalType;

    // Weight different signal types
    const typeWeights: Record<string, number> = {
      'venue_dwell': 0.08,         // Long dwell = +8% max
      'repeat_venue_view': 0.10,   // Repeat views = +10% max
      'venue_scroll_depth': 0.05,  // Deep scroll = +5% max
      'voucher_click': 0.06,       // Voucher click = +6%
      'voucher_ignore': -0.02,     // Ignored voucher = -2%
    };

    const weight = typeWeights[signalType] || 0.03;
    return signalValue * weight;
  } catch {
    return 0;
  }
};

/**
 * Flush remaining signals on page unload
 */
export const flushOnUnload = (): void => {
  if (signalBuffer.length > 0) {
    // Use sendBeacon for reliable delivery on page unload
    const payload = JSON.stringify(signalBuffer);
    if (import.meta.env.DEV) {
      console.log('📡 Flushing signals on unload:', signalBuffer.length);
    }
    // Fallback: just flush normally (sendBeacon would need a dedicated endpoint)
    flushSignals();
  }
};

// Register unload handler
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushOnUnload);
}
