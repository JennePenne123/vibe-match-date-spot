import { supabase } from '@/integrations/supabase/client';

/**
 * Aggregates implicit signals (dwell time, scroll depth, voucher clicks, repeat views)
 * from user_venue_feedback and updates user_preference_vectors accordingly.
 * 
 * This bridges the gap between tracked behavior and the AI scoring weights.
 * Called periodically or after significant signal accumulation.
 */

interface ImplicitInsight {
  cuisineBoost: Record<string, number>;  // cuisine → signal strength
  priceSignal: number;                    // positive = prefers premium, negative = prefers budget
  vibeSignal: Record<string, number>;     // vibe → signal strength
}

/**
 * Analyze all implicit signals for a user and derive preference adjustments.
 */
export const analyzeImplicitSignals = async (userId: string): Promise<ImplicitInsight | null> => {
  try {
    const { data: feedbacks, error } = await supabase
      .from('user_venue_feedback')
      .select('venue_id, context, updated_at')
      .eq('user_id', userId);

    if (error || !feedbacks || feedbacks.length === 0) return null;

    // Only process implicit signal entries
    const implicitEntries = feedbacks.filter(f => {
      const ctx = f.context as any;
      return ctx?.implicit === true && ctx?.signals;
    });

    if (implicitEntries.length === 0) return null;

    // Collect venue IDs with strong engagement signals
    const strongEngagementVenues: { venueId: string; strength: number }[] = [];

    for (const entry of implicitEntries) {
      const signals = (entry.context as any).signals;
      let totalStrength = 0;

      // Dwell time > 0.5 = strong interest
      if (signals.venue_dwell?.value > 0.5) totalStrength += signals.venue_dwell.value;
      // Repeat views = very strong interest
      if (signals.repeat_venue_view?.value > 0) totalStrength += signals.repeat_venue_view.value * 1.5;
      // Deep scroll = engaged
      if (signals.venue_scroll_depth?.value > 0.6) totalStrength += signals.venue_scroll_depth.value * 0.5;
      // Voucher click = price-conscious but interested
      if (signals.voucher_click?.value > 0) totalStrength += 0.3;

      // Apply time decay (half-life 14 days)
      const ageMs = Date.now() - new Date(entry.updated_at || Date.now()).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const decay = Math.exp(-0.693 * ageDays / 14);
      totalStrength *= decay;

      if (totalStrength > 0.3) {
        strongEngagementVenues.push({ venueId: entry.venue_id, strength: totalStrength });
      }
    }

    if (strongEngagementVenues.length === 0) return null;

    // Fetch venue details for engaged venues
    const venueIds = strongEngagementVenues.map(v => v.venueId);
    const { data: venues } = await supabase
      .from('venues')
      .select('id, cuisine_type, price_range, tags')
      .in('id', venueIds);

    if (!venues || venues.length === 0) return null;

    // Build cuisine and vibe signals from engaged venues
    const cuisineBoost: Record<string, number> = {};
    let priceSignal = 0;
    const vibeSignal: Record<string, number> = {};

    for (const venue of venues) {
      const engagement = strongEngagementVenues.find(v => v.venueId === venue.id);
      if (!engagement) continue;
      const strength = engagement.strength;

      // Cuisine signal
      if (venue.cuisine_type) {
        const cuisine = venue.cuisine_type.toLowerCase();
        cuisineBoost[cuisine] = (cuisineBoost[cuisine] || 0) + strength;
      }

      // Price signal: $$$ and $$$$ push positive, $ pushes negative
      if (venue.price_range) {
        const dollarCount = (venue.price_range.match(/\$/g) || []).length;
        priceSignal += (dollarCount - 2) * strength * 0.1; // $$=neutral, $=negative, $$$=positive
      }

      // Vibe signal from tags
      if (venue.tags) {
        for (const tag of venue.tags as string[]) {
          const t = tag.toLowerCase();
          vibeSignal[t] = (vibeSignal[t] || 0) + strength * 0.5;
        }
      }
    }

    console.log('📡 IMPLICIT LEARNING: Analyzed signals for user:', {
      engagedVenues: strongEngagementVenues.length,
      topCuisines: Object.entries(cuisineBoost).sort((a, b) => b[1] - a[1]).slice(0, 3),
      priceSignal: priceSignal.toFixed(2),
    });

    return { cuisineBoost, priceSignal, vibeSignal };
  } catch (err) {
    console.error('Error analyzing implicit signals:', err);
    return null;
  }
};

/**
 * Apply implicit signal insights to user_preference_vectors.
 * Uses a small learning rate (0.03) to avoid overriding explicit feedback.
 */
export const applyImplicitLearning = async (userId: string): Promise<boolean> => {
  try {
    const insights = await analyzeImplicitSignals(userId);
    if (!insights) return false;

    const { data: existing } = await supabase
      .from('user_preference_vectors')
      .select('feature_weights, learning_data')
      .eq('user_id', userId)
      .single();

    const currentWeights = (existing?.feature_weights as Record<string, number>) || {
      cuisine: 1.0, vibe: 1.0, price: 1.0, time: 1.0, rating: 1.0
    };

    const IMPLICIT_LR = 0.03; // Very small — implicit signals should nudge, not override

    // If user engages heavily with specific cuisines, boost cuisine weight
    const topCuisineStrength = Math.max(...Object.values(insights.cuisineBoost), 0);
    if (topCuisineStrength > 1.0) {
      currentWeights.cuisine = Math.min(2.5, currentWeights.cuisine + IMPLICIT_LR * Math.min(topCuisineStrength, 3));
    }

    // Price signal: if user consistently engages with premium venues, boost price weight
    if (Math.abs(insights.priceSignal) > 0.2) {
      currentWeights.price = Math.min(2.5, Math.max(0.3, currentWeights.price + IMPLICIT_LR * insights.priceSignal));
    }

    // Vibe signal: if user engages with specific vibes, boost vibe weight
    const topVibeStrength = Math.max(...Object.values(insights.vibeSignal), 0);
    if (topVibeStrength > 0.5) {
      currentWeights.vibe = Math.min(2.5, currentWeights.vibe + IMPLICIT_LR * Math.min(topVibeStrength, 2));
    }

    // Store updated weights + implicit learning metadata
    const learningData = (existing?.learning_data as Record<string, any>) || {};
    learningData.implicit_last_applied = new Date().toISOString();
    learningData.implicit_top_cuisines = Object.entries(insights.cuisineBoost)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cuisine, strength]) => ({ cuisine, strength: +strength.toFixed(2) }));

    const { error } = await supabase
      .from('user_preference_vectors')
      .upsert({
        user_id: userId,
        feature_weights: currentWeights,
        learning_data: learningData,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error applying implicit learning:', error);
      return false;
    }

    console.log('✅ IMPLICIT LEARNING: Applied to preference vectors:', currentWeights);
    return true;
  } catch (err) {
    console.error('Failed to apply implicit learning:', err);
    return false;
  }
};
