/**
 * Habit Pattern Learning
 * Detects recurring patterns from past dates and boosts matching venues.
 * E.g. "User goes to Italian on Fridays" → boost Italian venues on Friday.
 */

import { supabase } from '@/integrations/supabase/client';

interface HabitPattern {
  dayOfWeek?: number;
  cuisineType?: string;
  priceRange?: string;
  confidence: number; // 0-1
}

interface HabitResult {
  bonus: number;
  reason: string | null;
  patterns: HabitPattern[];
}

// Session cache
let habitCache: { userId: string; patterns: HabitPattern[]; ts: number } | null = null;
const HABIT_CACHE_TTL = 10 * 60 * 1000; // 10 min

async function detectHabitPatterns(userId: string): Promise<HabitPattern[]> {
  const now = Date.now();
  if (habitCache && habitCache.userId === userId && (now - habitCache.ts) < HABIT_CACHE_TTL) {
    return habitCache.patterns;
  }

  const patterns: HabitPattern[] = [];

  try {
    // Get completed dates with venue details
    const { data: completedDates } = await supabase
      .from('date_invitations')
      .select('venue_id, proposed_date, actual_date_time')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('date_status', 'completed')
      .not('venue_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!completedDates || completedDates.length < 3) {
      habitCache = { userId, patterns: [], ts: now };
      return [];
    }

    // Get venue details for these dates
    const venueIds = [...new Set(completedDates.map(d => d.venue_id).filter(Boolean))];
    const { data: venues } = await supabase
      .from('venues')
      .select('id, cuisine_type, price_range')
      .in('id', venueIds);

    if (!venues) {
      habitCache = { userId, patterns: [], ts: now };
      return [];
    }

    const venueMap = new Map(venues.map(v => [v.id, v]));

    // Analyze day-of-week + cuisine correlations
    const dayCuisineCounts: Record<string, number> = {};
    const dayCounts: Record<number, number> = {};
    const cuisineCounts: Record<string, number> = {};

    for (const date of completedDates) {
      const venue = venueMap.get(date.venue_id!);
      if (!venue?.cuisine_type) continue;

      const dateStr = date.actual_date_time || date.proposed_date;
      if (!dateStr) continue;

      const dayOfWeek = new Date(dateStr).getDay();
      const cuisine = venue.cuisine_type.toLowerCase();
      const key = `${dayOfWeek}:${cuisine}`;

      dayCuisineCounts[key] = (dayCuisineCounts[key] || 0) + 1;
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
      cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
    }

    // Find significant patterns (at least 2 occurrences, >40% of that day's dates)
    const totalDates = completedDates.length;
    for (const [key, count] of Object.entries(dayCuisineCounts)) {
      if (count < 2) continue;
      const [dayStr, cuisine] = key.split(':');
      const dayOfWeek = parseInt(dayStr);
      const dayTotal = dayCounts[dayOfWeek] || 1;
      const ratio = count / dayTotal;

      if (ratio >= 0.4) {
        patterns.push({
          dayOfWeek,
          cuisineType: cuisine,
          confidence: Math.min(ratio * (count / totalDates) * 4, 1.0),
        });
      }
    }

    // Also detect general cuisine preferences (>25% of all dates)
    for (const [cuisine, count] of Object.entries(cuisineCounts)) {
      const ratio = count / totalDates;
      if (ratio >= 0.25 && count >= 3) {
        patterns.push({
          cuisineType: cuisine,
          confidence: Math.min(ratio * 1.5, 1.0),
        });
      }
    }

    // Price range habit
    const priceCounts: Record<string, number> = {};
    for (const date of completedDates) {
      const venue = venueMap.get(date.venue_id!);
      if (venue?.price_range) {
        priceCounts[venue.price_range] = (priceCounts[venue.price_range] || 0) + 1;
      }
    }
    for (const [price, count] of Object.entries(priceCounts)) {
      const ratio = count / totalDates;
      if (ratio >= 0.4 && count >= 3) {
        patterns.push({
          priceRange: price,
          confidence: Math.min(ratio * 1.2, 1.0),
        });
      }
    }
  } catch (e) {
    console.warn('⚠️ HABIT-LEARNING: Failed to detect patterns:', e);
  }

  habitCache = { userId, patterns, ts: now };
  return patterns;
}

const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Calculate habit-based bonus for a venue.
 * Max bonus: +8 points
 */
export async function getHabitBonus(
  userId: string,
  venue: { cuisine_type?: string | null; price_range?: string | null }
): Promise<HabitResult> {
  const patterns = await detectHabitPatterns(userId);
  if (patterns.length === 0) return { bonus: 0, reason: null, patterns: [] };

  const now = new Date();
  const currentDay = now.getDay();
  const venueCuisine = (venue.cuisine_type || '').toLowerCase();

  let totalBonus = 0;
  let bestReason: string | null = null;

  for (const pattern of patterns) {
    let match = false;

    // Day + cuisine pattern
    if (pattern.dayOfWeek !== undefined && pattern.cuisineType) {
      if (pattern.dayOfWeek === currentDay && venueCuisine.includes(pattern.cuisineType)) {
        match = true;
        bestReason = `Du liebst ${pattern.cuisineType} am ${DAY_NAMES[currentDay]}`;
      }
    }
    // General cuisine pattern
    else if (pattern.cuisineType && !pattern.dayOfWeek) {
      if (venueCuisine.includes(pattern.cuisineType)) {
        match = true;
        if (!bestReason) bestReason = `Dein Favorit: ${pattern.cuisineType}`;
      }
    }
    // Price pattern
    else if (pattern.priceRange) {
      if (venue.price_range === pattern.priceRange) {
        match = true;
      }
    }

    if (match) {
      totalBonus += Math.round(pattern.confidence * 4);
    }
  }

  return {
    bonus: Math.min(totalBonus, 8),
    reason: bestReason,
    patterns,
  };
}
