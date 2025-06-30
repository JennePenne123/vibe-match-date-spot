
import { supabase } from '@/integrations/supabase/client';

export interface AIVenueRecommendation {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_image?: string;
  ai_score: number;
  match_factors: any;
  contextual_score: number;
  ai_reasoning: string;
  confidence_level: number;
}

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

    // Cuisine matching
    if (userPrefs.preferred_cuisines && venue.cuisine_type) {
      const cuisineMatch = userPrefs.preferred_cuisines.includes(venue.cuisine_type);
      baseScore += cuisineMatch ? 0.3 : -0.1;
    }

    // Price range matching
    if (userPrefs.preferred_price_range && venue.price_range) {
      const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
      baseScore += priceMatch ? 0.2 : -0.05;
    }

    // Vibe matching through tags
    if (userPrefs.preferred_vibes && venue.tags) {
      const vibeMatches = userPrefs.preferred_vibes.filter(vibe => 
        venue.tags.some((tag: string) => tag.toLowerCase().includes(vibe.toLowerCase()))
      );
      baseScore += vibeMatches.length * 0.1;
    }

    // Rating bonus
    if (venue.rating) {
      baseScore += Math.min((venue.rating - 3.5) * 0.1, 0.15);
    }

    // Calculate contextual factors
    const contextualScore = await calculateContextualFactors(venueId);
    
    // Final AI score (0-100 scale)
    const finalScore = Math.max(0, Math.min(100, (baseScore + contextualScore) * 100));

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

const calculateContextualFactors = async (venueId: string): Promise<number> => {
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

export const getAIVenueRecommendations = async (
  userId: string,
  partnerId?: string,
  limit: number = 10
): Promise<AIVenueRecommendation[]> => {
  try {
    console.log('Getting AI venue recommendations for user:', userId);

    // Get venues with basic filtering
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .limit(50); // Get more venues to score and rank

    if (venuesError) throw venuesError;

    const recommendations: AIVenueRecommendation[] = [];

    // Calculate AI scores for each venue
    for (const venue of venues) {
      const aiScore = await calculateVenueAIScore(venue.id, userId, partnerId);
      
      // Get stored AI score data for additional context
      const { data: scoreData } = await supabase
        .from('ai_venue_scores')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('user_id', userId)
        .single();

      const recommendation: AIVenueRecommendation = {
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.address,
        venue_image: venue.image_url,
        ai_score: aiScore,
        match_factors: scoreData?.match_factors || {},
        contextual_score: scoreData?.contextual_score || 0,
        ai_reasoning: generateAIReasoning(venue, scoreData?.match_factors, aiScore),
        confidence_level: calculateConfidenceLevel(aiScore, scoreData?.match_factors)
      };

      recommendations.push(recommendation);
    }

    // Sort by AI score and return top recommendations
    return recommendations
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting AI venue recommendations:', error);
    return [];
  }
};

const generateAIReasoning = (venue: any, matchFactors: any, aiScore: number): string => {
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
  
  return reasons.join('. ') + `.`;
};

const calculateConfidenceLevel = (aiScore: number, matchFactors: any): number => {
  let confidence = aiScore / 100;
  
  // Boost confidence if we have multiple matching factors
  const matchCount = Object.values(matchFactors || {}).filter(Boolean).length;
  confidence += matchCount * 0.1;
  
  return Math.min(0.95, confidence);
};
