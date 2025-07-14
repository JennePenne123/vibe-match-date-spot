
import { supabase } from '@/integrations/supabase/client';

export const calculateVenueAIScore = async (
  venueId: string,
  userId: string,
  partnerId?: string
): Promise<number> => {
  try {
    console.log('🧮 SCORING: Starting AI score calculation for venue:', venueId, 'user:', userId);

    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError) {
      console.error('❌ SCORING: Error fetching user preferences:', prefsError);
      throw prefsError;
    }

    if (!userPrefs) {
      console.warn('⚠️ SCORING: No user preferences found, using default score');
      return 50; // Default neutral score
    }

    // Get venue data
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (venueError) {
      console.error('❌ SCORING: Error fetching venue data:', venueError);
      throw venueError;
    }

    if (!venue) {
      console.warn('⚠️ SCORING: Venue not found, using default score');
      return 50;
    }

    console.log('📋 SCORING: Venue details:', {
      name: venue.name,
      cuisine: venue.cuisine_type,
      price: venue.price_range,
      tags: venue.tags
    });

    console.log('👤 SCORING: User preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      vibes: userPrefs.preferred_vibes,
      priceRange: userPrefs.preferred_price_range
    });

    // Calculate base match score with more lenient scoring
    let baseScore = 0.6; // Start with higher baseline (60%)
    
    console.log('🔍 SCORING: Starting with base score of 60%');

    // Cuisine matching - make it case insensitive and more flexible
    if (userPrefs.preferred_cuisines && venue.cuisine_type) {
      const userCuisines = userPrefs.preferred_cuisines.map(c => c.toLowerCase());
      const venueCuisine = venue.cuisine_type.toLowerCase();
      
      // Exact match
      let cuisineMatch = userCuisines.includes(venueCuisine);
      
      // Partial match (e.g., "mediterranean" includes "greek")
      if (!cuisineMatch) {
        cuisineMatch = userCuisines.some(userCuisine => 
          venueCuisine.includes(userCuisine) || userCuisine.includes(venueCuisine)
        );
      }
      
      console.log('🍽️ SCORING: Cuisine matching:', { 
        userCuisines, 
        venueCuisine, 
        exactMatch: userCuisines.includes(venueCuisine),
        partialMatch: cuisineMatch,
        score: cuisineMatch ? '+25%' : '-5%'
      });
      
      baseScore += cuisineMatch ? 0.25 : -0.05; // Good bonus, small penalty
    }

    // Price range matching with more flexible scoring
    if (userPrefs.preferred_price_range && venue.price_range) {
      const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
      console.log('💰 SCORING: Price matching:', { 
        userPrefs: userPrefs.preferred_price_range, 
        venue: venue.price_range, 
        match: priceMatch,
        score: priceMatch ? '+15%' : 'no penalty'
      });
      
      if (priceMatch) {
        baseScore += 0.15;
      }
      // No penalty for price mismatch to be more inclusive
    }

    // Vibe matching through tags - improved matching with fallbacks
    if (userPrefs.preferred_vibes && venue.tags && venue.tags.length > 0) {
      const vibeMatches = userPrefs.preferred_vibes.filter(vibe => 
        venue.tags.some((tag: string) => 
          tag.toLowerCase().includes(vibe.toLowerCase()) ||
          vibe.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      // If no tag matches, check cuisine/price for vibe inference
      let inferredVibeMatch = false;
      if (vibeMatches.length === 0) {
        // Romantic inference
        if (userPrefs.preferred_vibes.includes('romantic')) {
          if (venue.price_range === '$$$' || venue.price_range === '$$$$' || 
              venue.cuisine_type?.toLowerCase().includes('fine') ||
              venue.cuisine_type?.toLowerCase().includes('italian') ||
              venue.cuisine_type?.toLowerCase().includes('french')) {
            inferredVibeMatch = true;
            vibeMatches.push('romantic (inferred)');
          }
        }
        
        // Casual inference
        if (userPrefs.preferred_vibes.includes('casual')) {
          if (venue.price_range === '$' || venue.price_range === '$$') {
            inferredVibeMatch = true;
            vibeMatches.push('casual (inferred)');
          }
        }
      }
      
      console.log('🎭 SCORING: Vibe matching:', { 
        userVibes: userPrefs.preferred_vibes, 
        venueTags: venue.tags, 
        matches: vibeMatches,
        inferredMatch: inferredVibeMatch,
        score: `+${vibeMatches.length * 10}%`
      });
      
      baseScore += vibeMatches.length * 0.1; // Good bonus for vibe matches
    }

    // Rating bonus - more generous
    if (venue.rating) {
      const ratingBonus = Math.min((venue.rating - 3.0) * 0.05, 0.1); // Up to 10% bonus
      console.log('⭐ SCORING: Rating bonus:', {
        rating: venue.rating,
        bonus: `+${Math.round(ratingBonus * 100)}%`
      });
      baseScore += ratingBonus;
    }

    // Calculate contextual factors
    const contextualScore = await calculateContextualFactors(venueId);
    
    // Final AI score (0-100 scale) with better scaling - ensure higher minimum
    const finalScore = Math.max(35, Math.min(98, (baseScore + contextualScore) * 100)); // Minimum 35% score, max 98%
    
    console.log('🎯 SCORING: Final scoring details:', {
      venue: venue.name,
      baseScore: `${Math.round(baseScore * 100)}%`,
      contextualScore: `${Math.round(contextualScore * 100)}%`,
      finalScore: `${Math.round(finalScore)}%`,
      breakdown: {
        cuisineMatch: userPrefs.preferred_cuisines?.some(c => 
          venue.cuisine_type?.toLowerCase().includes(c.toLowerCase())
        ),
        priceMatch: userPrefs.preferred_price_range?.includes(venue.price_range),
        vibeInferred: true, // Always consider some vibe match
        rating: venue.rating
      }
    });

    // Store the AI score
    const matchFactors = {
      cuisine_match: userPrefs.preferred_cuisines?.includes(venue.cuisine_type) || false,
      price_match: userPrefs.preferred_price_range?.includes(venue.price_range) || false,
      vibe_matches: userPrefs.preferred_vibes?.filter(vibe => 
        venue.tags?.some((tag: string) => tag.toLowerCase().includes(vibe.toLowerCase()))
      ) || [],
      rating_bonus: venue.rating ? Math.min((venue.rating - 3.5) * 0.1, 0.15) : 0
    };

    const { error: insertError } = await supabase
      .from('ai_venue_scores')
      .upsert({
        venue_id: venueId,
        user_id: userId,
        ai_score: Math.round(finalScore * 100) / 100,
        match_factors: matchFactors,
        contextual_score: Math.round(contextualScore * 100) / 100,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing venue AI score:', insertError);
    }

    return finalScore;
  } catch (error) {
    console.error('Error calculating venue AI score:', error);
    return 50; // Default neutral score
  }
};

export const calculateContextualFactors = async (venueId: string): Promise<number> => {
  let contextualBonus = 0;

  // Time-based factors (business hours, peak times)
  const currentHour = new Date().getHours();
  if (currentHour >= 18 && currentHour <= 21) {
    contextualBonus += 0.1; // Prime dinner time
  } else if (currentHour >= 11 && currentHour <= 14) {
    contextualBonus += 0.05; // Lunch time
  }

  // Weather factor (simplified - in real implementation would use weather API)
  // For now, indoor venues get slight preference in winter months
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 || currentMonth <= 2) {
    contextualBonus += 0.05; // Winter months favor indoor venues
  }

  return contextualBonus;
};

export const calculateConfidenceLevel = (aiScore: number, matchFactors: any): number => {
  let confidence = aiScore / 100;
  
  // Boost confidence if we have multiple matching factors
  const matchCount = Object.values(matchFactors || {}).filter(Boolean).length;
  confidence += matchCount * 0.1;
  
  return Math.min(0.95, confidence);
};
