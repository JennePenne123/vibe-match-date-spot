
import { supabase } from '@/integrations/supabase/client';

export const calculateVenueAIScore = async (
  venueId: string,
  userId: string,
  partnerId?: string
): Promise<number> => {
  try {
    console.log('Calculating AI score for venue:', venueId, 'user:', userId);

    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError) throw prefsError;

    // Get venue data
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (venueError) throw venueError;

    // Calculate base match score
    let baseScore = 0.5; // Default neutral score

    // Cuisine matching - make it case insensitive and more flexible
    if (userPrefs.preferred_cuisines && venue.cuisine_type) {
      const userCuisines = userPrefs.preferred_cuisines.map(c => c.toLowerCase());
      const venueCuisine = venue.cuisine_type.toLowerCase();
      const cuisineMatch = userCuisines.includes(venueCuisine);
      console.log('Cuisine matching:', { userCuisines, venueCuisine, match: cuisineMatch });
      baseScore += cuisineMatch ? 0.3 : -0.05; // Less harsh penalty
    }

    // Price range matching with more flexible scoring
    if (userPrefs.preferred_price_range && venue.price_range) {
      const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
      console.log('Price matching:', { userPrefs: userPrefs.preferred_price_range, venue: venue.price_range, match: priceMatch });
      if (priceMatch) {
        baseScore += 0.2;
      } else {
        // Very minimal penalty to allow more venues
        baseScore += -0.01;
      }
    }

    // Vibe matching through tags - improved matching
    if (userPrefs.preferred_vibes && venue.tags) {
      const vibeMatches = userPrefs.preferred_vibes.filter(vibe => 
        venue.tags.some((tag: string) => 
          tag.toLowerCase().includes(vibe.toLowerCase()) ||
          vibe.toLowerCase().includes(tag.toLowerCase())
        )
      );
      console.log('Vibe matching:', { userVibes: userPrefs.preferred_vibes, venueTags: venue.tags, matches: vibeMatches });
      baseScore += vibeMatches.length * 0.15; // Increased weight for vibe matches
    }

    // Rating bonus
    if (venue.rating) {
      baseScore += Math.min((venue.rating - 3.5) * 0.1, 0.15);
    }

    // Calculate contextual factors
    const contextualScore = await calculateContextualFactors(venueId);
    
    // Final AI score (0-100 scale) with better scaling
    const finalScore = Math.max(25, Math.min(100, (baseScore + contextualScore) * 100)); // Minimum 25% score
    
    console.log('Venue scoring details:', {
      venue: venue.name,
      baseScore,
      contextualScore,
      finalScore,
      userPrefs: {
        cuisines: userPrefs.preferred_cuisines,
        vibes: userPrefs.preferred_vibes,
        priceRange: userPrefs.preferred_price_range
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
