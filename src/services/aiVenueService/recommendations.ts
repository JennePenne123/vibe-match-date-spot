import { calculateVenueAIScore, calculateConfidenceLevel } from './scoring';
import { getActiveVenues, getStoredAIScore } from './fetching';
import { filterVenuesByPreferences, filterVenuesByCollaborativePreferences, AREA_VIBE_MAP, type SessionPriorityWeights } from './preferenceFiltering';
import { calculateDistanceFromLocation } from './helperFunctions';
import { getRealtimeContextScore } from './contextScoring';
import { getRepeatProtectionModifier } from './repeatProtection';
import { getHabitBonus } from './habitLearning';
import { getOccasionScore, type DateOccasion } from './occasionScoring';
import { getFriendSocialProofBonus } from './friendSocialProof';
import { getWeatherScore } from './weatherScoring';
import { getExplorationBonus, getUserExploredCuisines } from './explorationBonus';
import { applyImplicitLearning } from './implicitLearning';
import { getDistanceToleranceScore } from './distanceLearning';
import { getPhotoVibeScoreModifier, getPhotoVibeLabel } from './photoVibeScoring';
import { getPairFriendlyScoreModifier, getPairFriendlyLabel } from './pairFriendlyScoring';
import { getSeasonalScoreModifier, getSeasonalLabel } from './seasonalScoring';
import { supabase } from '@/integrations/supabase/client';
import { validateLocation } from '@/utils/locationValidation';
import { calculateStringSimilarity, calculateGeoDistance } from '@/utils/stringUtils';
import { API_CONFIG } from '@/config/apiConfig';
import { venueCacheService } from '@/services/venueCacheService';
import { apiUsageService } from '@/services/apiUsageService';
import { getSituationalCategory, getSituationalBoost, passesSituationalHardFilter, type SituationalCategoryId } from '@/lib/situationalCategories';

/**
 * Sentinel error thrown when a non-food situational category produced zero
 * matching venues after the hard filter. Caught by useAIAnalysis to show
 * a friendly "no venues for this category" hint instead of a generic error.
 */
export class NoSituationalMatchError extends Error {
  categoryId: SituationalCategoryId;
  constructor(categoryId: SituationalCategoryId) {
    super(`No venues match situational category "${categoryId}"`);
    this.name = 'NoSituationalMatchError';
    this.categoryId = categoryId;
  }
}

export interface AIVenueRecommendation {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_image?: string;
  venue_photos?: Array<{
    url: string;
    thumbnail?: string;
    width: number;
    height: number;
    attribution?: string;
    isGooglePhoto: boolean;
  }>;
  ai_score: number;
  match_factors: any;
  contextual_score: number;
  ai_reasoning: string;
  confidence_level: number;
  distance?: string;
  neighborhood?: string;
  isOpen?: boolean;
  operatingHours?: string[];
  priceRange?: string;
  rating?: number;
  cuisine_type?: string;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

export const getAIVenueRecommendations = async (
  userId: string,
  partnerId?: string,
  limit: number = 6,
  userLocation?: { latitude: number; longitude: number; address?: string },
  selectedArea?: string,
  occasion?: DateOccasion | null,
  priorityWeights?: SessionPriorityWeights,
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
): Promise<AIVenueRecommendation[]> => {
  try {
    // Get venues using hybrid multi-source strategy
    let venues = [];
    if (userLocation?.latitude && userLocation?.longitude) {
      venues = await getVenuesFromMultipleSources(
        userId,
        limit * 8,
        userLocation,
        situationalCategoryId ?? null,
        secondaryCategoryId ?? null,
      );
    }
    
    // Fallback to database venues if all sources fail or no location
    if (!venues || venues.length === 0) {
      venues = await getActiveVenues(100, userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : undefined);
    }

    if (!venues || venues.length === 0) {
      throw new Error('No venues in database. Please use the debug tools to create test venues first.');
    }

    // Filter venues by preferences (now includes area-based scoring)
    if (partnerId) {
      venues = await filterVenuesByCollaborativePreferences(userId, partnerId, venues);
    } else {
      venues = await filterVenuesByPreferences(userId, venues, selectedArea, priorityWeights);
    }

    const recommendations: AIVenueRecommendation[] = [];

    // Trigger implicit learning in the background (non-blocking)
    applyImplicitLearning(userId).catch(() => {});

    // Pre-fetch explored cuisines for exploration bonus (avoid N+1)
    const exploredCuisines = await getUserExploredCuisines(userId);

    // Fetch user preferences once (avoid N+1 queries)
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Apply negative preference filter: hard-exclude cuisines the user blocked
    const excludedCuisines: string[] = (userPrefs as any)?.excluded_cuisines || [];
    if (excludedCuisines.length > 0) {
      venues = venues.filter(v => {
        const vCuisine = (v.cuisine_type || '').toLowerCase();
        return !excludedCuisines.some(exc => vCuisine.includes(exc.toLowerCase()));
      });
    }

    // ── Situational HARD filter ──
    // When the user picked a non-food intent (Kultur/Aktivität/Nightlife),
    // drop pure gastro venues from the candidate set. A soft boost is not
    // enough because there are always 100× more restaurants than museums.
    {
      const primaryCat = getSituationalCategory(situationalCategoryId ?? null);
      const secondaryCat = getSituationalCategory(secondaryCategoryId ?? null);
      if (primaryCat && primaryCat.id !== 'food') {
        const before = venues.length;
        const filtered = venues.filter(v => passesSituationalHardFilter(primaryCat, v, secondaryCat));
        // Safety net: never collapse to fewer than 3 candidates — if the
        // hard filter wipes everything (e.g. very small town), fall back to
        // soft-boost mode so the user still sees something.
        if (filtered.length >= 3) {
          venues = filtered;
          console.log(`🎭 SITUATIONAL HARD FILTER (${primaryCat.id}): ${before} → ${filtered.length} venues`);
          // Clear any previous sparse flag — we have a healthy set
          try { sessionStorage.removeItem('hioutz-situational-sparse'); } catch {}
        } else {
          console.warn(`⚠️ SITUATIONAL HARD FILTER (${primaryCat.id}) would leave only ${filtered.length} venues — falling back to soft boost`);
          // Surface to the UI so we can show a "thin data" banner with CTA
          try {
            sessionStorage.setItem(
              'hioutz-situational-sparse',
              JSON.stringify({
                categoryId: primaryCat.id,
                matchedCount: filtered.length,
                ts: Date.now(),
              }),
            );
          } catch {}
        }

        // ── Re-score for non-food intent ──
        // The preference filter scores by cuisine match, which unfairly
        // penalises bowling alleys / museums / mini-golf in an "activity"
        // intent (they have no cuisine, so they end up at 12% while a Thai
        // restaurant lands at 82%). Lift the floor for venues that actually
        // match the active situational category so they win the ranking.
        const matchesPrimaryIntent = (v: any): boolean => {
          const haystack = [
            v.name || '',
            v.cuisine_type || '',
            v.description || '',
            ...((v.tags as string[]) || []),
            v.venue_type || '',
            ...((v.activities as string[]) || []),
          ].join(' ').toLowerCase();
          if (primaryCat.boostKeywords.some(kw => haystack.includes(kw))) return true;
          if (primaryCat.boostVenueTypes.some(t => haystack.includes(t.toLowerCase()))) return true;
          if (primaryCat.boostActivities.some(a => haystack.includes(a.toLowerCase()))) return true;
          return false;
        };
        venues = venues.map(v => {
          if (matchesPrimaryIntent(v)) {
            const current = v.preferenceScore || 0;
            // Strong floor so on-intent venues outrank off-intent gastro
            v.preferenceScore = Math.max(current, 78);
          }
          return v;
        });
      }
    }

    // Build recommendations using the preferenceScore from filtering + local scoring
    for (const venue of venues) {
      if (!venue.id) {
        venue.id = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const cleanVenueId = extractVenueId(venue);
      if (!cleanVenueId) continue;

      // Use the preferenceScore from filtering as the primary score (0-100)
      // This already accounts for cuisine, price, vibe, and rating matching
      const prefScore = venue.preferenceScore || venue.collaborativeScore || 50;
      
      // ── Real-time context scoring (day, time, season) ──
      const contextResult = getRealtimeContextScore(venue);
      const contextBonus = contextResult.bonus;

      // ── Habit pattern bonus ──
      const habitResult = await getHabitBonus(userId, venue);

      // ── Repeat-visit protection ──
      const repeatResult = await getRepeatProtectionModifier(userId, cleanVenueId, prefScore);

      // ── Occasion-based scoring ──
      const occasionResult = getOccasionScore(venue, occasion);

      // ── Friend social proof ──
      const friendResult = await getFriendSocialProofBonus(userId, cleanVenueId);

      // ── Weather-aware scoring ──
      const weatherResult = await getWeatherScore(venue, userLocation);

      // ── Exploration vs. Exploitation ──
      const explorationResult = await getExplorationBonus(userId, venue, exploredCuisines);

      // ── Distance tolerance learning ──
      const distanceResult = await getDistanceToleranceScore(
        userId,
        venue.latitude ?? venue.lat ?? venue.geometry?.location?.lat,
        venue.longitude ?? venue.lng ?? venue.geometry?.location?.lng,
        userLocation
      );

      // ── Photo Vibe Scoring (Signal #15) ──
      const photoVibeResult = getPhotoVibeScoreModifier(
        venue.photos,
        userPrefs?.preferred_vibes
      );

      // ── Pair-Friendly Scoring (Signal #16) ──
      const pairResult = getPairFriendlyScoreModifier(venue, !!partnerId);

      // ── Seasonal Specials (Signal #17) ──
      const seasonalResult = getSeasonalScoreModifier(
        venue.seasonal_specials,
        userPrefs?.preferred_vibes
      );

      // Rating bonus — confidence-weighted by review count
      const reviewCount = venue.review_count || venue.reviewCount || venue.user_ratings_total || 0;
      const reviewConfidence = reviewCount > 0 ? Math.min(reviewCount / 20, 1.0) : 0.5;
      const ratingBonus = venue.rating ? Math.min((venue.rating - 3.0) * 3, 10) * reviewConfidence : 0;
      // Social proof bonus
      const socialProof = (reviewCount >= 50 && venue.rating >= 4.0) ? 3 : 0;

      // Compute final score: all signals combined (including new #15-#17)
      const rawScore = prefScore + contextBonus + ratingBonus + socialProof
        + habitResult.bonus + repeatResult.modifier
        + occasionResult.bonus + occasionResult.penalty
        + friendResult.bonus
        + weatherResult.bonus + weatherResult.penalty
        + explorationResult.bonus
        + distanceResult.bonus
        + (photoVibeResult.modifier * 100)  // Convert 0-0.12 to 0-12 scale
        + (pairResult.modifier * 100)       // Convert 0-0.15 to 0-15 scale
        + (seasonalResult.modifier * 100);  // Convert 0-0.08 to 0-8 scale

      // ── Situational Category Boost (today's intent) ──
      // Multiplicative: up to 1.45x combined (primary 1.35x × secondary 1.20x, capped),
      // 0.7x only when both primary AND secondary signal off-bucket, 1.0x neutral.
      const situationalCat = getSituationalCategory(situationalCategoryId ?? null);
      const secondaryCat = getSituationalCategory(secondaryCategoryId ?? null);
      const situationalBoost = getSituationalBoost(situationalCat, venue, secondaryCat);

      // ── Source Quality Boost ──
      // For non-food intents (Aktivität/Kultur/Nightlife) Google Places hat
      // deutlich reichere Metadaten (Fotos, Bewertungen, Öffnungszeiten,
      // korrekte Kategorien) als OSM/Radar. Wir boosten Google-Venues
      // bei diesen Intents leicht, damit sie im Ranking gewinnen.
      let sourceBoost = 1.0;
      if (situationalCat && situationalCat.id !== 'food') {
        const src = (venue as any)._source;
        if (src === 'google') sourceBoost = 1.18;
        else if (src === 'radar') sourceBoost = 1.0;
        else if (src === 'overpass') sourceBoost = 0.92;
      }


      // ── Proximity Boost (district / user location) ──
      // Strongly prioritise venues within walking distance, decay to 1.0 at
      // ~3 km, then a soft penalty out to 15 km. This is multiplicative so it
      // composes cleanly with the situational boost.
      const venueLat = venue.latitude ?? venue.lat ?? venue.geometry?.location?.lat;
      const venueLng = venue.longitude ?? venue.lng ?? venue.geometry?.location?.lng;
      let proximityBoost = 1.0;
      let proximityKm: number | null = null;
      if (userLocation?.latitude && userLocation?.longitude && venueLat && venueLng) {
        proximityKm = calculateGeoDistance(userLocation.latitude, userLocation.longitude, venueLat, venueLng);
        if (proximityKm <= 0.5) proximityBoost = 1.30;        // unmittelbare Nähe
        else if (proximityKm <= 1) proximityBoost = 1.22;     // im Viertel
        else if (proximityKm <= 2) proximityBoost = 1.14;     // Stadtteil
        else if (proximityKm <= 3) proximityBoost = 1.07;     // Nachbarviertel
        else if (proximityKm <= 5) proximityBoost = 1.0;      // neutral
        else if (proximityKm <= 8) proximityBoost = 0.92;
        else if (proximityKm <= 12) proximityBoost = 0.82;
        else proximityBoost = 0.72;                            // weit weg
      }

      const finalScore = Math.max(5, Math.min(98, rawScore * situationalBoost * proximityBoost * sourceBoost));

      // Generate reasoning based on actual matches
      const matchReasons: string[] = [];
      if (userPrefs?.preferred_cuisines?.some((c: string) => 
        venue.cuisine_type?.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(venue.cuisine_type?.toLowerCase() || '')
      )) {
        matchReasons.push(`Passt zu deiner Lieblingsküche: ${venue.cuisine_type}`);
      }
      if (userPrefs?.preferred_price_range?.includes(venue.price_range)) {
        matchReasons.push(`Preisklasse ${venue.price_range} passt`);
      }
      if (venue.rating && venue.rating >= 4.0) {
        matchReasons.push(`Top bewertet (${venue.rating}⭐)`);
      }
      // New category matches
      const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase()).join(' ');
      const venueText = [venueTags, (venue.name || '').toLowerCase(), (venue.description || '').toLowerCase()].join(' ');
      if ((userPrefs as any)?.preferred_venue_types?.some((vt: string) => venueText.includes(vt.replace('_', ' ')))) {
        matchReasons.push('Passt zu deinen Erlebnis-Präferenzen');
      }
      if ((userPrefs as any)?.preferred_activities?.some((act: string) => venueText.includes(act.replace('_', ' ')))) {
        matchReasons.push('Passt zu deinen Aktivitäten');
      }
      // Area vibe match reasoning
      if (selectedArea && AREA_VIBE_MAP[selectedArea]) {
        const areaConfig = AREA_VIBE_MAP[selectedArea];
        const areaNames: Record<string, string> = {
          'downtown': 'Downtown', 'waterfront': 'Waterfront', 'arts-district': 'Arts District',
          'oldtown': 'Old Town', 'uptown': 'Uptown'
        };
        if (areaConfig.keywords.some(kw => venueText.includes(kw)) || areaConfig.vibes.some(v => venueText.includes(v))) {
          matchReasons.push(`Passt zum ${areaNames[selectedArea] || selectedArea}-Vibe`);
        }
      }
      // Context, habit, repeat, occasion, friend, weather reasons
      if (contextResult.reasons.length > 0) matchReasons.push(contextResult.reasons[0]);
      if (habitResult.reason) matchReasons.push(habitResult.reason);
      if (repeatResult.reason && repeatResult.modifier > 0) matchReasons.push(repeatResult.reason);
      if (occasionResult.reason) matchReasons.push(occasionResult.reason);
      if (friendResult.reason) matchReasons.push(friendResult.reason);
      if (weatherResult.reason) matchReasons.push(weatherResult.reason);
      if (explorationResult.reason) matchReasons.push(explorationResult.reason);
      if (distanceResult.reason) matchReasons.push(distanceResult.reason);
      if (proximityKm !== null) {
        if (proximityKm <= 1) matchReasons.push(`Direkt um die Ecke (${proximityKm < 1 ? Math.round(proximityKm * 1000) + 'm' : proximityKm.toFixed(1) + 'km'})`);
        else if (proximityKm <= 3) matchReasons.push(`Im erweiterten Viertel (${proximityKm.toFixed(1)}km)`);
      }
      if (repeatResult.visitCount > 0) matchReasons.push(`Bereits ${repeatResult.visitCount}x besucht`);
      // New signal reasons (#15-#17)
      const photoVibeLabel = getPhotoVibeLabel(photoVibeResult.matchedVibes);
      if (photoVibeLabel) matchReasons.push(photoVibeLabel);
      const pairLabel = getPairFriendlyLabel(pairResult.reasons);
      if (pairLabel) matchReasons.push(pairLabel);
      const seasonalLabel = getSeasonalLabel(seasonalResult.activeSpecials);
      if (seasonalLabel) matchReasons.push(seasonalLabel);

      if (matchReasons.length === 0) {
        matchReasons.push('Entdecke etwas Neues in deiner Nähe');
      }

      // Extract best image from photos array or image_url
      const photosArray = Array.isArray(venue.photos) ? venue.photos : [];
      const firstPhotoUrl = photosArray.length > 0 
        ? (typeof photosArray[0] === 'string' ? photosArray[0] : photosArray[0]?.url)
        : undefined;
      const bestImage = venue.image_url || venue.image || firstPhotoUrl;

      const recommendation: AIVenueRecommendation = {
        venue_id: cleanVenueId,
        venue_name: venue.name,
        venue_address: venue.address || venue.location || venue.vicinity || 'Address not available',
        venue_image: bestImage,
        venue_photos: photosArray,
        ai_score: finalScore / 100,
        match_factors: {
          cuisine_match: !!userPrefs?.preferred_cuisines?.some((c: string) => 
            venue.cuisine_type?.toLowerCase().includes(c.toLowerCase())
          ),
          price_match: !!userPrefs?.preferred_price_range?.includes(venue.price_range),
          preference_score: prefScore,
        },
        contextual_score: contextBonus / 100,
        ai_reasoning: matchReasons.join(' • '),
        confidence_level: calculateConfidenceLevel(finalScore, {}),
        distance: calculateDistanceFromLocation(venue, userLocation),
        neighborhood: extractNeighborhood(venue.address || venue.location || venue.vicinity),
        isOpen: determineOpenStatus(venue.opening_hours || venue.openNow),
        operatingHours: formatOperatingHours(venue.opening_hours),
        priceRange: venue.price_range || venue.priceRange,
        rating: venue.rating,
        cuisine_type: venue.cuisine_type || venue.cuisineType,
        amenities: venue.tags || [],
        latitude: venue.latitude ?? venue.lat ?? venue.geometry?.location?.lat,
        longitude: venue.longitude ?? venue.lng ?? venue.geometry?.location?.lng
      };

      if (typeof recommendation.venue_id === 'string' && recommendation.venue_id.trim()) {
        recommendations.push(recommendation);
      }
    }

    // Intra-source deduplication: remove duplicates within the same result set
    // (e.g., Overpass returning same venue as both Node and Way)
    let deduped = deduplicateWithinSource(recommendations);

    // ── HARD CATEGORY FILTER ──
    // For non-food situational categories, only keep venues whose tags / name
    // / description / cuisine signal a match. This is the user's explicit
    // intent for this session and we should not show restaurants when they
    // asked for culture or activities.
    const situationalCat = getSituationalCategory(situationalCategoryId ?? null);
    if (situationalCat && situationalCat.id !== 'food') {
      const before = deduped.length;
      deduped = deduped.filter(rec => {
        const haystack = [
          rec.venue_name ?? '',
          rec.cuisine_type ?? '',
          ...(rec.amenities ?? []),
        ].join(' ').toLowerCase();
        return situationalCat.boostKeywords.some(kw => haystack.includes(kw));
      });
      console.log(`🎯 SITUATIONAL FILTER (${situationalCat.id}): ${before} → ${deduped.length} venues`);
      if (deduped.length === 0) {
        // Bubble up so useAIAnalysis can show a friendly hint (radius / try other category)
        throw new NoSituationalMatchError(situationalCat.id);
      }
    }
    
    // Sort by AI score, then apply diversity filter
    const sortedRecommendations = deduped
      .sort((a, b) => b.ai_score - a.ai_score);

    // Quality gate: Top 3 must clear this match-score threshold to earn the
    // "Top match" badge. Tuned to 0.65 (= 65%) — high enough that low-signal
    // venues don't get a verified badge, low enough that we still surface
    // 3 picks for users with sparse preference data.
    const MIN_TOP3_SCORE = 0.65;
    const qualifiedTop3 = sortedRecommendations.filter(r => r.ai_score >= MIN_TOP3_SCORE);
    const belowThreshold = sortedRecommendations.filter(r => r.ai_score < MIN_TOP3_SCORE);
    
    // Mark qualified venues so the UI can reliably show Top 3 badges
    qualifiedTop3.forEach((r, i) => {
      (r as any).qualityVerified = true;
      (r as any).qualityRank = i + 1;
    });
    belowThreshold.forEach(r => {
      (r as any).qualityVerified = false;
    });
    
    // Rebuild: qualified venues first (sorted by score), then the rest
    const qualitySorted = [...qualifiedTop3, ...belowThreshold];

    // Diversity: limit max 3 venues per cuisine_type to avoid monotony
    const diverseRecommendations: AIVenueRecommendation[] = [];
    const cuisineCount: Record<string, number> = {};
    const MAX_PER_CUISINE = 3;

    for (const rec of qualitySorted) {
      const cuisine = (rec.cuisine_type || 'Other').toLowerCase();
      cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
      if (cuisineCount[cuisine] <= MAX_PER_CUISINE) {
        diverseRecommendations.push(rec);
      }
      if (diverseRecommendations.length >= limit) break;
    }

    // If diversity filter removed too many, backfill from remaining
    if (diverseRecommendations.length < limit) {
      for (const rec of qualitySorted) {
        if (!diverseRecommendations.includes(rec)) {
          diverseRecommendations.push(rec);
        }
        if (diverseRecommendations.length >= limit) break;
      }
    }

    console.log(`🏆 TOP 3 QUALITY: ${qualifiedTop3.slice(0, 3).length}/3 venues meet ≥${Math.round(MIN_TOP3_SCORE * 100)}% threshold`,
      qualifiedTop3.slice(0, 3).map(r => `${r.venue_name}: ${Math.round(r.ai_score * 100)}%`));
    if (qualifiedTop3.length < 3) {
      console.warn(`⚠️ QUALITY WARNING: Only ${qualifiedTop3.length}/3 venues passed the 80% quality gate`);
    }

    return validateRecommendations(diverseRecommendations);
  } catch (error) {
    // Preserve typed errors so callers (e.g. useAIAnalysis) can react to them.
    if (error instanceof NoSituationalMatchError) throw error;
    console.error('Failed to get venue recommendations:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get venue recommendations');
  }
};

/**
 * Extract a valid venue ID from venue object
 */
function extractVenueId(venue: any): string | null {
  if (venue.id && typeof venue.id === 'string' && venue.id.trim()) {
    return venue.id.trim();
  }
  if (venue.placeId && typeof venue.placeId === 'string' && venue.placeId.trim()) {
    return venue.placeId.trim();
  }
  if (venue.google_place_id && typeof venue.google_place_id === 'string' && venue.google_place_id.trim()) {
    return venue.google_place_id.trim();
  }
  if (venue.id && typeof venue.id === 'object' && venue.id.value) {
    return String(venue.id.value).trim();
  }
  if (venue.id) {
    const strId = String(venue.id).trim();
    if (strId && strId !== 'undefined' && strId !== 'null') {
      return strId;
    }
  }
  return null;
}

/**
 * Validate recommendations have valid IDs, generate emergency IDs if needed
 */
function validateRecommendations(recommendations: AIVenueRecommendation[]): AIVenueRecommendation[] {
  return recommendations.filter(rec => {
    if (!rec.venue_id || typeof rec.venue_id !== 'string' || !rec.venue_id.trim()) {
      rec.venue_id = `emergency_${rec.venue_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    }
    return rec.venue_id && typeof rec.venue_id === 'string' && rec.venue_id.trim().length > 0;
  });
}

/**
 * Hybrid multi-source venue search
 */
const getVenuesFromMultipleSources = async (
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string },
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
) => {
  // Fetch user preferences for cache key differentiation
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('preferred_cuisines, preferred_vibes, preferred_price_range, preferred_activities, preferred_venue_types')
    .eq('user_id', userId)
    .single();

  const cacheCuisines = userPrefs?.preferred_cuisines || [];
  const cacheVibes = userPrefs?.preferred_vibes || [];
  const cachePriceRange = userPrefs?.preferred_price_range || [];
  const cacheActivities = (userPrefs as any)?.preferred_activities || [];
  const cacheVenueTypes = (userPrefs as any)?.preferred_venue_types || [];

  // Non-food situational mode: skip the 2nd radius retry and the Google
  // Places fallback entirely — both are tuned for restaurant discovery and
  // mostly add restaurants we'd just hard-filter out anyway. Saves 2-30s.
  const isNonFoodMode = !!situationalCategoryId && situationalCategoryId !== 'food';

  // Check cache first if we have location — now includes preferences in key
  if (userLocation?.latitude && userLocation?.longitude) {
    const cachedVenues = venueCacheService.getCachedSearch(
      userLocation.latitude,
      userLocation.longitude,
      cacheCuisines,
      cachePriceRange,
      cacheVibes,
      cacheActivities,
      cacheVenueTypes
    );
    if (cachedVenues && cachedVenues.length > 0) {
      console.log('[VenueSearch] 🎯 Using cached venues:', cachedVenues.length);
      
      await apiUsageService.logApiCall({
        api_name: 'venue_cache',
        endpoint: '/cached-search',
        user_id: userId,
        response_status: 200,
        cache_hit: true,
        estimated_cost: 0,
        request_metadata: { 
          venueCount: cachedVenues.length,
          location: `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`
        }
      });
      
      return cachedVenues;
    }
  }

  const strategy = API_CONFIG.venueSearchStrategy;
  const MIN_VENUES_THRESHOLD = 6;
  // Performance: cap retries at 2 (was 3). Non-food modes get a single pass
  // since we hard-filter the results and a wider radius mostly returns more
  // restaurants we'd discard anyway.
  const RADIUS_MULTIPLIERS = isNonFoodMode ? [1.5] : [1, 2];
  let venues: any[] = [];
  
  for (const multiplier of RADIUS_MULTIPLIERS) {
    // Expand search location by increasing the radius via user preferences override
    const expandedLocation = multiplier > 1 
      ? { ...userLocation!, _radiusMultiplier: multiplier } 
      : userLocation;
    
    if (strategy === 'radar-overpass') {
      venues = await getVenuesRadarOverpass(userId, limit, expandedLocation, multiplier, isNonFoodMode, situationalCategoryId, secondaryCategoryId);
    } else if (strategy === 'overpass-only') {
      venues = await getVenuesOverpassOnly(userId, limit, expandedLocation, multiplier, situationalCategoryId, secondaryCategoryId);
    } else if (strategy === 'google-primary-hybrid') {
      venues = await getVenuesGooglePrimaryHybrid(
        userId,
        limit,
        expandedLocation,
        multiplier,
        isNonFoodMode,
        situationalCategoryId,
        secondaryCategoryId,
        userPrefs,
      );
    } else {
      venues = await getVenuesParallel(userId, limit, expandedLocation, multiplier, situationalCategoryId, secondaryCategoryId);
    }
    
    if (venues.length >= MIN_VENUES_THRESHOLD) {
      if (multiplier > 1) {
        console.log(`📡 RADIUS FALLBACK: Found ${venues.length} venues at ${multiplier}x radius`);
      }
      break;
    }
    
    if (multiplier < RADIUS_MULTIPLIERS[RADIUS_MULTIPLIERS.length - 1]) {
      console.log(`📡 RADIUS FALLBACK: Only ${venues.length} venues at ${multiplier}x radius, expanding to ${RADIUS_MULTIPLIERS[RADIUS_MULTIPLIERS.indexOf(multiplier) + 1]}x...`);
    }
  }
  
  // Store in cache after fetching — now includes preferences in key
  if (venues.length > 0 && userLocation?.latitude && userLocation?.longitude) {
    venueCacheService.setCachedSearch(
      userLocation.latitude,
      userLocation.longitude,
      venues,
      cacheCuisines,
      cachePriceRange,
      cacheVibes,
      cacheActivities,
      cacheVenueTypes
    );
  }
  
  return venues;
};

/**
 * Radar + Overpass strategy: Radar for primary search, Overpass/OSM for additional coverage (free)
 */
async function getVenuesRadarOverpass(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string },
  radiusMultiplier: number = 1,
  skipGoogleFallback: boolean = false,
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
) {
  // Step 1: Query Radar + Overpass IN PARALLEL for maximum speed
  const promises: Promise<any[]>[] = [];
  
  if (API_CONFIG.useRadar && userLocation) {
    promises.push(getVenuesFromRadar(userId, limit, userLocation, radiusMultiplier).catch((err) => {
      console.warn('⚠️ Radar failed:', err instanceof Error ? err.message : 'Unknown');
      return [];
    }));
  }
  
  if (API_CONFIG.useOverpass && userLocation) {
    promises.push(getVenuesFromOverpass(userId, limit, userLocation, radiusMultiplier, situationalCategoryId, secondaryCategoryId).catch((err) => {
      console.warn('⚠️ Overpass failed:', err instanceof Error ? err.message : 'Unknown');
      return [];
    }));
  }

  const results = await Promise.all(promises);
  const radarVenues = results[0] || [];
  const osmVenues = results[1] || [];
  
  console.log(`🔀 MERGE: Radar=${radarVenues.length}, Overpass=${osmVenues.length}`);
  
  // Merge: Radar as primary (has ratings, chain detection), Overpass enriches with opening hours, website, tags
  let venues = mergeAndDeduplicateVenues(radarVenues, osmVenues);
  
  console.log(`🔀 MERGE: After dedup=${venues.length}`);

  // Step 2: Google Places fallback for niche venue types only if needed.
  // Skipped in non-food situational mode — those queries mostly return
  // restaurants which would be hard-filtered out anyway, costing 2-5s.
  if (userLocation && API_CONFIG.useGooglePlaces && !skipGoogleFallback) {
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('preferred_venue_types, preferred_activities')
      .eq('user_id', userId)
      .single();

    const nicheTypes = (userPrefs as any)?.preferred_venue_types || [];
    const nicheActivities = (userPrefs as any)?.preferred_activities || [];
    const hasNichePreferences = nicheTypes.length > 0 || nicheActivities.length > 0;

    const nicheKeywords = [...nicheTypes, ...nicheActivities].map((t: string) => t.replace(/_/g, ' ').toLowerCase());
    const nicheMatches = venues.filter((v: any) => {
      const text = [(v.name || ''), (v.description || ''), ...(v.tags || [])].join(' ').toLowerCase();
      return nicheKeywords.some(kw => text.includes(kw));
    });

    // Performance gate: only invoke the (slow, ~15s) Google Places fallback
    // when the merged Radar+Overpass set is genuinely thin on niche venues.
    // If we already have ≥10 candidates total, the user has plenty of choice
    // and the 15s wait is not worth the marginal upside.
    const NICHE_FALLBACK_VENUE_THRESHOLD = 10;
    const NICHE_FALLBACK_TIMEOUT_MS = 6000;
    if (
      hasNichePreferences &&
      nicheMatches.length < 3 &&
      venues.length < NICHE_FALLBACK_VENUE_THRESHOLD
    ) {
      console.log('🔍 Google Places fallback: only', nicheMatches.length, 'niche matches, fetching from Google...');

      const googleTypesMap: Record<string, string> = {
        'museum': 'museum', 'gallery': 'art_gallery', 'theater_venue': 'movie_theater',
        'cinema': 'movie_theater', 'concert_hall': 'night_club', 'bowling': 'bowling_alley',
        'swimming': 'swimming_pool', 'spa_wellness': 'spa', 'arcade': 'amusement_park',
        'mini_golf': 'amusement_park', 'karaoke': 'night_club', 'comedy_club': 'night_club',
        'climbing': 'gym', 'escape_room': 'amusement_park',
      };

      const googleTypes = [...nicheTypes, ...nicheActivities]
        .map((t: string) => googleTypesMap[t])
        .filter(Boolean);

      if (googleTypes.length > 0) {
        try {
          // Hard-cap the fallback at 6s. If Google takes longer, we surface
          // what we already have rather than make the user wait further.
          const googleVenues = await Promise.race<any[]>([
            getVenuesFromGooglePlaces(userId, 10, userLocation),
            new Promise<any[]>((resolve) =>
              setTimeout(() => {
                console.warn(`⏱️ Google Places fallback exceeded ${NICHE_FALLBACK_TIMEOUT_MS}ms — using current results`);
                resolve([]);
              }, NICHE_FALLBACK_TIMEOUT_MS),
            ),
          ]);
          if (googleVenues.length > 0) {
            console.log('✅ Google Places fallback found', googleVenues.length, 'additional venues');
            venues = mergeAndDeduplicateVenues(venues, googleVenues);
          }
        } catch (err) {
          console.warn('⚠️ Google Places fallback failed:', err instanceof Error ? err.message : 'Unknown error');
        }
      }
    } else if (hasNichePreferences && nicheMatches.length < 3) {
      console.log(`⏭️ Google Places fallback skipped: ${venues.length} venues already (≥${NICHE_FALLBACK_VENUE_THRESHOLD}), niche matches=${nicheMatches.length}`);
    }
  }
  
  return venues;
}

/**
 * Overpass-only strategy
 */
async function getVenuesOverpassOnly(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string },
  radiusMultiplier: number = 1,
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
) {
  if (API_CONFIG.useOverpass && userLocation) {
    return await getVenuesFromOverpass(userId, limit, userLocation, radiusMultiplier, situationalCategoryId, secondaryCategoryId).catch(() => []);
  }
  return [];
}

/**
 * Smart Hybrid strategy:
 *   - User has concrete cuisine / venue-type / activity preferences
 *     → Google Places PRIMARY (best data quality), Radar+Overpass enrich in parallel
 *   - User has no/few concrete preferences (discovery mode)
 *     → Radar+Overpass primary (free), Google as niche fallback
 *
 * Non-food situational mode (Kultur/Aktivität/Nightlife) ALSO benefits from
 * Google because Google has rich data for museums, bowling alleys, spas,
 * cinemas, concert halls etc. The edge function maps the user's
 * venueTypes/activities to specific Google place types, so Google's results
 * are correctly scoped — not biased toward restaurants.
 */
async function getVenuesGooglePrimaryHybrid(
  userId: string,
  limit: number,
  userLocation: { latitude: number; longitude: number; address?: string } | undefined,
  radiusMultiplier: number,
  isNonFoodMode: boolean,
  situationalCategoryId: SituationalCategoryId | null | undefined,
  secondaryCategoryId: SituationalCategoryId | null | undefined,
  userPrefs: any,
) {
  if (!userLocation) return [];

  // Discovery mode (no specific intent) → cheap path
  const concretePrefCount =
    (userPrefs?.preferred_cuisines?.length || 0) +
    ((userPrefs as any)?.preferred_venue_types?.length || 0) +
    ((userPrefs as any)?.preferred_activities?.length || 0);

  const minPrefs = (API_CONFIG as any).googlePrimaryMinPreferences ?? 1;
  // Use Google as primary whenever the user has concrete preferences —
  // regardless of food/non-food. Non-food categories actually benefit MORE
  // from Google's richer metadata (Museen, Bowling, Spa-Reviews, Fotos).
  const useGooglePrimary =
    API_CONFIG.useGooglePlaces &&
    (concretePrefCount >= minPrefs || isNonFoodMode);

  if (!useGooglePrimary) {
    console.log(
      `🧭 Smart Hybrid → Discovery mode (prefs=${concretePrefCount}); using Radar+Overpass (free)`,
    );
    const discoveryStart = Date.now();
    const discoveryVenues = await getVenuesRadarOverpass(
      userId,
      limit,
      userLocation,
      radiusMultiplier,
      true /* skipGoogleFallback — already decided not to spend $$ */,
      situationalCategoryId,
      secondaryCategoryId,
    );
    try {
      await apiUsageService.logApiCall({
        api_name: 'smart_hybrid',
        endpoint: '/discovery-mode',
        user_id: userId,
        response_status: discoveryVenues.length > 0 ? 200 : 204,
        response_time_ms: Date.now() - discoveryStart,
        estimated_cost: 0,
        cache_hit: false,
        request_metadata: {
          trigger: 'discovery',
          situationalCategoryId: situationalCategoryId ?? null,
          concretePrefCount,
          google_timed_out: false,
          google_count: 0,
          merged_count: discoveryVenues.length,
          used_fallback: false,
        },
      });
    } catch {
      // ignore telemetry errors
    }
    return discoveryVenues;
  }

  const reason = isNonFoodMode
    ? `Non-Food intent "${situationalCategoryId}" — Google has best metadata for this`
    : `${concretePrefCount} concrete preferences set`;
  console.log(
    `🎯 Smart Hybrid → Google PRIMARY (${reason}); enriching with Radar+Overpass in parallel`,
  );

  // Non-food intents (activity/culture/nightlife) benefit massively from
  // Google's richer venue metadata for things like bowling alleys, museums
  // and clubs. Give Google more breathing room and a larger result set
  // so it can dominate the merge.
  const baseTimeout = (API_CONFIG as any).googlePrimaryTimeoutMs ?? 7000;
  const timeoutMs = isNonFoodMode ? Math.max(baseTimeout, 12000) : baseTimeout;
  const googleLimit = isNonFoodMode ? Math.max(limit, 30) : limit;

  // Track timeout for Smart Hybrid telemetry
  let googleTimedOut = false;
  const googleStartedAt = Date.now();

  // Fire all three in parallel — Google with hard timeout
  const promises: Promise<any[]>[] = [
    Promise.race<any[]>([
      getVenuesFromGooglePlaces(userId, googleLimit, userLocation).catch((err) => {
        console.warn('⚠️ Google primary failed:', err instanceof Error ? err.message : err);
        return [] as any[];
      }),
      new Promise<any[]>((resolve) =>
        setTimeout(() => {
          console.warn(`⏱️ Google primary exceeded ${timeoutMs}ms — falling back to Radar/Overpass`);
          googleTimedOut = true;
          resolve([]);
        }, timeoutMs),
      ),
    ]),
  ];

  if (API_CONFIG.useRadar) {
    promises.push(
      getVenuesFromRadar(userId, limit, userLocation, radiusMultiplier).catch(() => []),
    );
  }
  if (API_CONFIG.useOverpass) {
    promises.push(
      getVenuesFromOverpass(
        userId,
        limit,
        userLocation,
        radiusMultiplier,
        situationalCategoryId,
        secondaryCategoryId,
      ).catch(() => []),
    );
  }

  const [googleVenues, radarVenues = [], osmVenues = []] = await Promise.all(promises);

  console.log(
    `🔀 SMART HYBRID MERGE: Google=${googleVenues.length}, Radar=${radarVenues.length}, Overpass=${osmVenues.length}`,
  );

  // Tag source so downstream scoring can prefer Google for activity intents
  // (Google has the best metadata for bowling/cinema/mini-golf/etc.).
  for (const v of googleVenues) (v as any)._source = 'google';
  for (const v of radarVenues) (v as any)._source = (v as any)._source ?? 'radar';
  for (const v of osmVenues) (v as any)._source = (v as any)._source ?? 'overpass';

  // Google as primary (richest metadata), then enrich/extend with Radar + Overpass
  let venues: any[] = googleVenues;
  venues = mergeAndDeduplicateVenues(venues, radarVenues);
  venues = mergeAndDeduplicateVenues(venues, osmVenues);

  // Safety net: if Google returned nothing (timeout/quota), Radar+Overpass
  // already populated the merge — no extra fallback needed.
  if (googleVenues.length === 0 && venues.length === 0) {
    console.warn('⚠️ Smart Hybrid: all sources empty');
  }

  // Telemetry: log Smart Hybrid run for the admin dashboard.
  try {
    await apiUsageService.logApiCall({
      api_name: 'smart_hybrid',
      endpoint: '/google-primary-hybrid',
      user_id: userId,
      response_status: venues.length > 0 ? 200 : 204,
      response_time_ms: Date.now() - googleStartedAt,
      estimated_cost: 0,
      cache_hit: false,
      request_metadata: {
        trigger: isNonFoodMode ? 'non_food' : 'concrete_prefs',
        situationalCategoryId: situationalCategoryId ?? null,
        concretePrefCount,
        google_timed_out: googleTimedOut,
        google_count: googleVenues.length,
        radar_count: radarVenues.length,
        overpass_count: osmVenues.length,
        merged_count: venues.length,
        used_fallback: googleVenues.length === 0 && (radarVenues.length + osmVenues.length) > 0,
      },
    });
  } catch {
    // Telemetry failures must never break the user-facing flow.
  }

  return venues;
}

/**
 * Parallel strategy: Call multiple APIs simultaneously
 */
async function getVenuesParallel(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string },
  radiusMultiplier: number = 1,
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
) {
  const promises: Promise<any[]>[] = [];
  
  if (API_CONFIG.useRadar && userLocation) {
    promises.push(getVenuesFromRadar(userId, limit, userLocation, radiusMultiplier).catch(() => []));
  }
  
  if (API_CONFIG.useOverpass && userLocation) {
    promises.push(getVenuesFromOverpass(userId, limit, userLocation, radiusMultiplier, situationalCategoryId, secondaryCategoryId).catch(() => []));
  }
  
  if (API_CONFIG.useGooglePlaces) {
    promises.push(getVenuesFromGooglePlaces(userId, limit, userLocation).catch(() => []));
  }
  
  const results = await Promise.all(promises);
  let merged: any[] = [];
  for (const result of results) {
    merged = mergeAndDeduplicateVenues(merged, result);
  }
  
  return merged;
}

/**
 * Deduplicate venues within a single recommendation list
 * Catches same-source duplicates (e.g., Overpass Node + Way for same venue)
 */
function deduplicateWithinSource(recommendations: AIVenueRecommendation[]): AIVenueRecommendation[] {
  const unique: AIVenueRecommendation[] = [];
  
  for (const rec of recommendations) {
    const isDupe = unique.some(existing => {
      // Same venue_id
      if (existing.venue_id === rec.venue_id) return true;
      
      // Same name (exact)
      const name1 = existing.venue_name.toLowerCase().trim();
      const name2 = rec.venue_name.toLowerCase().trim();
      if (name1 === name2) return true;
      
      // Geo proximity + name similarity
      if (existing.latitude && existing.longitude && rec.latitude && rec.longitude) {
        const dist = calculateGeoDistance(existing.latitude, existing.longitude, rec.latitude, rec.longitude);
        if (dist < 30) {
          const sim = calculateStringSimilarity(name1, name2);
          if (sim > 0.5) return true;
        }
      }
      
      return false;
    });
    
    if (!isDupe) {
      unique.push(rec);
    } else {
      console.log(`🔄 DEDUP: Removed duplicate recommendation: "${rec.venue_name}"`);
    }
  }
  
  return unique;
}

/**
 * Merge and deduplicate venues from multiple sources
 */
function mergeAndDeduplicateVenues(primaryVenues: any[], secondaryVenues: any[]): any[] {
  if (!API_CONFIG.mergeVenueData) {
    return [...primaryVenues, ...secondaryVenues].slice(0, API_CONFIG.maxTotalVenues);
  }
  
  const merged: any[] = [...primaryVenues];
  const addedIds = new Set(primaryVenues.map(v => v.id || v.venue_id));
  
  for (const newVenue of secondaryVenues) {
    const matchingVenue = primaryVenues.find(pv => areVenuesDuplicates(pv, newVenue));
    
    if (matchingVenue) {
      enrichVenueWithSecondary(matchingVenue, newVenue);
    } else {
      const venueId = newVenue.id || newVenue.venue_id;
      if (!addedIds.has(venueId)) {
        merged.push(newVenue);
        addedIds.add(venueId);
      }
    }
  }
  
  return merged.slice(0, API_CONFIG.maxTotalVenues);
}

/**
 * Check if two venues are duplicates
 */
function areVenuesDuplicates(v1: any, v2: any): boolean {
  const name1 = (v1.name || '').toLowerCase().trim();
  const name2 = (v2.name || '').toLowerCase().trim();
  
  // Exact name match
  if (name1 && name2 && name1 === name2) return true;
  
  // Same address (normalized)
  const addr1 = (v1.address || v1.venue_address || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();
  const addr2 = (v2.address || v2.venue_address || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();
  if (addr1 && addr2 && addr1 === addr2 && name1 && name2) {
    const similarity = calculateStringSimilarity(name1, name2);
    if (similarity > 0.5) return true;
  }
  
  // Geo proximity + name similarity
  const lat1 = v1.latitude ?? v1.lat;
  const lng1 = v1.longitude ?? v1.lng;
  const lat2 = v2.latitude ?? v2.lat;
  const lng2 = v2.longitude ?? v2.lng;
  
  if (lat1 && lng1 && lat2 && lng2) {
    const distance = calculateGeoDistance(lat1, lng1, lat2, lng2);
    if (distance < API_CONFIG.deduplicationThreshold) {
      const similarity = calculateStringSimilarity(name1, name2);
      if (similarity > API_CONFIG.nameSimilarityThreshold) return true;
      // Very close venues (< 20m) with moderate name similarity are likely dupes
      if (distance < 20 && similarity > 0.4) return true;
    }
  }
  
  return false;
}

/**
 * Enrich primary venue with secondary source data
 */
function enrichVenueWithSecondary(primaryVenue: any, secondaryVenue: any): void {
  // Photos
  if (secondaryVenue.photos?.length > 0) {
    primaryVenue.photos = primaryVenue.photos || [];
    const existingUrls = new Set(primaryVenue.photos.map((p: any) => p.url));
    for (const photo of secondaryVenue.photos) {
      if (!existingUrls.has(photo.url)) primaryVenue.photos.push(photo);
    }
  }
  
  // Text fields — prefer non-empty values
  if (!primaryVenue.description && secondaryVenue.description) primaryVenue.description = secondaryVenue.description;
  if (!primaryVenue.phone && secondaryVenue.phone) primaryVenue.phone = secondaryVenue.phone;
  if (!primaryVenue.website && secondaryVenue.website) primaryVenue.website = secondaryVenue.website;
  if (!primaryVenue.opening_hours && secondaryVenue.opening_hours) primaryVenue.opening_hours = secondaryVenue.opening_hours;
  
  // OSM-specific enrichment (wheelchair, outdoor seating, wifi etc.)
  if (secondaryVenue.osm_data) {
    primaryVenue.osm_data = { ...(primaryVenue.osm_data || {}), ...secondaryVenue.osm_data };
    // Add accessibility/amenity tags from OSM
    const enrichTags: string[] = [];
    if (secondaryVenue.osm_data.wheelchair === 'yes') enrichTags.push('wheelchair accessible');
    if (secondaryVenue.osm_data.outdoor_seating === 'yes') enrichTags.push('outdoor seating');
    if (secondaryVenue.osm_data.internet_access === 'wlan' || secondaryVenue.osm_data.internet_access === 'yes') enrichTags.push('wifi');
    if (enrichTags.length > 0) {
      primaryVenue.tags = [...new Set([...(primaryVenue.tags || []), ...enrichTags])];
    }
  }
  
  // Merge tags
  if (secondaryVenue.tags?.length > 0) {
    primaryVenue.tags = [...new Set([...(primaryVenue.tags || []), ...secondaryVenue.tags])];
  }
  
  // Use higher rating if available
  if (secondaryVenue.rating && (!primaryVenue.rating || primaryVenue.rating === 0)) {
    primaryVenue.rating = secondaryVenue.rating;
  }
}

/**
 * Fetch venues from Radar (primary search – 100K free calls/month)
 */
async function getVenuesFromRadar(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string },
  radiusMultiplier: number = 1
) {
  const timer = apiUsageService.createTimer('radar', '/search-venues-radar');
  
  try {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      return [];
    }
    
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!userPrefs) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'No user preferences' } });
      return [];
    }
    
    const baseRadius = (userPrefs.max_distance || 25) * 1000;
    const { data, error } = await supabase.functions.invoke('search-venues-radar', {
      body: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        cuisines: userPrefs.preferred_cuisines || [],
        radius: Math.round(baseRadius * radiusMultiplier),
        limit,
        venueTypes: (userPrefs as any).preferred_venue_types || [],
        activities: (userPrefs as any).preferred_activities || [],
      }
    });
    
    if (error) {
      await timer.end({ 
        status: 500, 
        cacheHit: false, 
        userId,
        metadata: { error: error.message }
      });
      return [];
    }
    
    const venues = data?.venues || [];
    await timer.end({ 
      status: 200, 
      cacheHit: false, 
      userId,
      metadata: { 
        venueCount: venues.length,
        chainsDetected: venues.filter((v: any) => v.is_chain).length,
        location: `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`
      }
    });
    
    return venues;
  } catch (err) {
    await timer.end({ 
      status: 500, 
      cacheHit: false, 
      userId,
      metadata: { error: err instanceof Error ? err.message : 'Unknown error' }
    });
    return [];
  }
}

/**
 * Fetch venues from Overpass/OpenStreetMap (completely free, no API key needed)
 * Uses client-side API call directly instead of edge function
 */
async function getVenuesFromOverpass(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string },
  radiusMultiplier: number = 1,
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
) {
  const timer = apiUsageService.createTimer('overpass', '/client-overpass');
  
  try {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      return [];
    }
    
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!userPrefs) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'No user preferences' } });
      return [];
    }
    
    const { searchVenuesOverpass } = await import('@/services/overpassSearchService');
    const baseRadius = (userPrefs.max_distance || 25) * 1000;
    const radiusMeters = Math.round(baseRadius * radiusMultiplier);
    // Combine user-selected venue types and activity preferences so Overpass
    // queries the right OSM tags (e.g. mini_golf → leisure=miniature_golf),
    // independent of any active situational quick-action.
    const extraVenueTypes = [
      ...((userPrefs as any)?.preferred_venue_types || []),
      ...((userPrefs as any)?.preferred_activities || []),
    ];
    const result = await searchVenuesOverpass(
      userLocation.latitude,
      userLocation.longitude,
      radiusMeters,
      userPrefs.preferred_cuisines || [],
      limit,
      situationalCategoryId ?? null,
      secondaryCategoryId ?? null,
      extraVenueTypes,
    );
    
    const venues = result.venues || [];
    await timer.end({ 
      status: 200, 
      cacheHit: false, 
      userId,
      metadata: { 
        venueCount: venues.length,
        location: `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`
      }
    });
    
    return venues;
  } catch (err) {
    await timer.end({ 
      status: 500, 
      cacheHit: false, 
      userId,
      metadata: { error: err instanceof Error ? err.message : 'Unknown error' }
    });
    return [];
  }
}



/**
 * Fetch venues from Google Places
 */
async function getVenuesFromGooglePlaces(
  userId: string, 
  limit: number, 
  userLocation?: { latitude: number; longitude: number; address?: string },
  situationalCategoryId?: SituationalCategoryId | null,
  secondaryCategoryId?: SituationalCategoryId | null,
) {
  // Tiered orchestrator: Google Places → Foursquare → Overpass with 3-day search cache
  const timer = apiUsageService.createTimer('google_places', '/search-venues-tiered');
  
  try {
    if (!userId || !userLocation?.latitude || !userLocation?.longitude) {
      throw new Error('User ID and valid location are required');
    }
    
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'Preferences not found' } });
      throw new Error('User preferences not found. Please set your preferences first.');
    }

    const fixedPrefs = {
      preferred_cuisines: userPrefs.preferred_cuisines || [],
      preferred_vibes: userPrefs.preferred_vibes || [],
      max_distance: userPrefs.max_distance || 10
    };

    const locationValidation = validateLocation(userLocation);
    if (!locationValidation.isValid) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'Invalid location' } });
      throw new Error(locationValidation.error || 'Invalid user location');
    }

    const { latitude, longitude } = userLocation;
    // When a situational quick-action is active (Kultur/Aktivität/Nightlife),
    // inject its OSM venue types + activities so Google Places searches for
    // clubs/bars/museums instead of restaurants. Without this, even with
    // intent=nightlife, Google would only see preferred_cuisines and return
    // burger places.
    const sitCat = getSituationalCategory(situationalCategoryId ?? null);
    const secCat = getSituationalCategory(secondaryCategoryId ?? null);
    const situationalVenueTypes = [
      ...(sitCat?.boostVenueTypes ?? []),
      ...(sitCat?.boostActivities ?? []),
      ...(secCat?.boostVenueTypes ?? []),
      ...(secCat?.boostActivities ?? []),
    ];
    const isNonFood = !!sitCat && sitCat.id !== 'food';
    const mergedVenueTypes = Array.from(new Set([
      ...((userPrefs as any).preferred_venue_types || []),
      ...situationalVenueTypes,
    ]));
    const mergedActivities = Array.from(new Set([
      ...((userPrefs as any).preferred_activities || []),
      ...situationalVenueTypes,
    ]));
    const requestPayload = {
      latitude,
      longitude,
      // For non-food intents we drop cuisines entirely — otherwise the edge
      // function biases toward restaurants matching e.g. "Italian".
      cuisines: isNonFood ? [] : fixedPrefs.preferred_cuisines,
      venueTypes: mergedVenueTypes,
      activities: mergedActivities,
      radius: fixedPrefs.max_distance * 1609,
      limit,
      forceRefresh: mergedVenueTypes.length > 0 || mergedActivities.length > 0 || isNonFood,
    };

    let searchResult = null;
    
    try {
      const result = await Promise.race([
        supabase.functions.invoke('search-venues-tiered', { body: requestPayload }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
      ]) as any;
      
      if (result?.error) throw new Error(result.error.message);
      searchResult = result?.data;
      
      // Log successful API call (track cache hit + actual source)
      const venues = searchResult?.venues || [];
      const cacheHit = !!searchResult?.cached;
      const actualSource = searchResult?.source || 'google_places';
      await timer.end({ 
        status: 200, 
        cacheHit, 
        userId,
        metadata: { 
          venueCount: venues.length,
          location: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
          tiered_source: actualSource,
          tiers_tried: searchResult?.tiers_tried
        }
      });
    } catch (edgeFnError) {
      // Edge function failed, log the failure
      await timer.end({ 
        status: 500, 
        cacheHit: false, 
        userId,
        metadata: { error: edgeFnError instanceof Error ? edgeFnError.message : 'Edge function failed' }
      });
      // Try database fallback
    }
    
    if (!searchResult) {
      const locationFilteredVenues = await getLocationFilteredDatabaseVenues(
        latitude, longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines
      );
      if (locationFilteredVenues.length > 0) return locationFilteredVenues;
      throw new Error('No venues found');
    }

    const venues = searchResult?.venues || [];
    if (venues.length === 0) {
      const locationFilteredVenues = await getLocationFilteredDatabaseVenues(
        latitude, longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines
      );
      return locationFilteredVenues;
    }

    return await transformAndSaveVenues(venues.slice(0, limit));
  } catch (error) {
    throw error;
  }
}

/**
 * Transform and save Google Places venues to database
 */
async function transformAndSaveVenues(venues: any[]): Promise<any[]> {
  const transformedVenues = [];
  
  for (const venue of venues) {
    try {
      const { data: existingVenue } = await supabase
        .from('venues')
        .select('id')
        .eq('google_place_id', venue.placeId)
        .maybeSingle();

      let venueId = existingVenue?.id;
      
      if (!existingVenue && venue.placeId) {
        const { data: newVenue, error: insertError } = await supabase
          .from('venues')
          .insert({
            name: venue.name,
            address: venue.location,
            cuisine_type: venue.cuisineType,
            price_range: venue.priceRange,
            rating: venue.rating,
            image_url: venue.image,
            photos: venue.photos || [],
            google_place_id: venue.placeId,
            phone: venue.phone,
            website: venue.website,
            tags: venue.tags || [],
            latitude: venue.latitude,
            longitude: venue.longitude,
            description: venue.description,
            source: 'google_places'  // Mark as trusted source for RLS policy
          })
          .select('id')
          .single();

        if (!insertError && newVenue) venueId = newVenue.id;
      }

      const finalVenueId = venue.placeId || venueId || `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      transformedVenues.push({
        id: finalVenueId,
        name: venue.name,
        address: venue.location,
        location: venue.location,
        vicinity: venue.location,
        cuisine_type: venue.cuisineType,
        cuisineType: venue.cuisineType,
        price_range: venue.priceRange,
        priceRange: venue.priceRange,
        rating: venue.rating,
        image_url: venue.image,
        image: venue.image,
        photos: venue.photos || [],
        tags: venue.tags || [],
        latitude: venue.latitude,
        longitude: venue.longitude,
        openNow: venue.openNow,
        opening_hours: venue.openNow ? ['Open now'] : ['Hours not available']
      });
    } catch {
      // Skip venues that fail to process
    }
  }

  return transformedVenues;
}

export const generateAIReasoning = (venue: any, matchFactors: any, aiScore: number): string => {
  const reasons = [];
  
  if (matchFactors?.cuisine_match) {
    reasons.push(`Perfect cuisine match with ${venue.cuisine_type}`);
  }
  if (matchFactors?.price_match) {
    reasons.push(`Fits your budget preference (${venue.price_range})`);
  }
  if (matchFactors?.vibe_matches?.length > 0) {
    reasons.push(`Matches your preferred vibes: ${matchFactors.vibe_matches.join(', ')}`);
  }
  if (venue.rating >= 4.0) {
    reasons.push(`Highly rated venue (${venue.rating}★)`);
  }
  
  if (reasons.length === 0) {
    return `Good overall match based on your preferences (${Math.round(aiScore)}% match)`;
  }
  
  return reasons.join('. ') + '.';
};

const extractNeighborhood = (address: string): string | undefined => {
  if (!address) return undefined;
  const parts = address.split(',').map(part => part.trim());
  return parts.length > 1 ? parts[1] : undefined;
};

const determineOpenStatus = (openingHours: any): boolean => {
  if (typeof openingHours === 'boolean') return openingHours;
  if (!openingHours || !Array.isArray(openingHours)) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  return currentTime >= 900 && currentTime <= 2200;
};

const formatOperatingHours = (openingHours: any): string[] => {
  if (!openingHours) return ['Hours not available'];
  if (Array.isArray(openingHours)) return openingHours;
  return ['Mon-Sun: 9:00 AM - 10:00 PM'];
};

/**
 * Get location-filtered database venues
 */
const getLocationFilteredDatabaseVenues = async (
  latitude: number, 
  longitude: number, 
  maxDistance: number, 
  preferredCuisines: string[]
) => {
  const { data: dbVenues, error: dbError } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);
  
  if (!dbError && dbVenues?.length > 0) {
    const filteredVenues = dbVenues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      const distance = calculateGeoDistance(latitude, longitude, venue.latitude, venue.longitude);
      const withinDistance = distance <= maxDistance;
      const matchesCuisine = !preferredCuisines.length || preferredCuisines.some(cuisine => 
        venue.cuisine_type?.toLowerCase().includes(cuisine.toLowerCase())
      );
      return withinDistance && matchesCuisine;
    });
    
    if (filteredVenues.length > 0) {
      return filteredVenues.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        cuisine_type: venue.cuisine_type,
        price_range: venue.price_range || '$$',
        rating: venue.rating || 4.2,
        image_url: venue.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        tags: venue.tags || ['Restaurant'],
        phone: venue.phone,
        website: venue.website,
        description: venue.description
      }));
    }
  }
  
  // Hamburg test data fallback
  const isHamburgArea = calculateGeoDistance(latitude, longitude, 53.57, 9.96) < 50;
  
  if (isHamburgArea && preferredCuisines.includes('Italian')) {
    return await createHamburgTestVenues();
  }
  
  return [];
};

/**
 * Create Hamburg test venues for development
 */
async function createHamburgTestVenues(): Promise<any[]> {
  const testVenues = [
    { name: "Ristorante Da Capo", address: "Eppendorfer Weg 15, 20259 Hamburg, Germany", cuisine_type: "Italian", price_range: "$$", rating: 4.5, latitude: 53.574, longitude: 9.966, tags: ["Italian", "romantic", "dinner"] },
    { name: "La Famiglia Hamburg", address: "Grindelallee 85, 20146 Hamburg, Germany", cuisine_type: "Italian", price_range: "$$", rating: 4.3, latitude: 53.567, longitude: 9.963, tags: ["Italian", "casual", "lunch"] },
    { name: "Il Buco", address: "Juliusstraße 16, 22769 Hamburg, Germany", cuisine_type: "Italian", price_range: "$$", rating: 4.4, latitude: 53.556, longitude: 9.954, tags: ["Italian", "romantic", "wine"] }
  ];
  
  const results = [];
  for (const testVenue of testVenues) {
    try {
      const { data: existing } = await supabase.from('venues').select('*').eq('name', testVenue.name).maybeSingle();
      
      if (!existing) {
        const { data: newVenue } = await supabase
          .from('venues')
          .insert({ ...testVenue, image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop' })
          .select('*')
          .single();
        if (newVenue) results.push(formatVenueResult(newVenue));
      } else {
        results.push(formatVenueResult(existing));
      }
    } catch {
      // Skip failed venues
    }
  }
  
  return results;
}

function formatVenueResult(venue: any) {
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    cuisine_type: venue.cuisine_type,
    price_range: venue.price_range,
    rating: venue.rating,
    image_url: venue.image_url,
    tags: venue.tags,
    phone: venue.phone,
    website: venue.website,
    description: venue.description
  };
}
