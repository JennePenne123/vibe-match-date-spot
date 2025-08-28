import { supabase } from '@/integrations/supabase/client';

// Filter venues by user preferences to improve matching
export const filterVenuesByPreferences = async (userId: string, venues: any[]) => {
  try {
    console.log('🎯 PREFERENCE FILTER: Filtering venues for user:', userId);
    
    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      console.log('⚠️ PREFERENCE FILTER: No preferences found, returning all venues');
      return venues;
    }

    console.log('🎯 PREFERENCE FILTER: User preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      priceRanges: userPrefs.preferred_price_range,
      vibes: userPrefs.preferred_vibes,
      dietary: userPrefs.dietary_restrictions
    });

    // Score venues based on preference matches
    const scoredVenues = venues.map(venue => {
      let score = 0;
      let maxScore = 0;

      // Cuisine matching (40% weight)
      maxScore += 40;
      if (userPrefs.preferred_cuisines?.includes(venue.cuisine_type)) {
        score += 40;
        console.log(`✅ CUISINE MATCH: ${venue.name} matches ${venue.cuisine_type}`);
      }

      // Price range matching (30% weight)
      maxScore += 30;
      if (userPrefs.preferred_price_range?.includes(venue.price_range)) {
        score += 30;
        console.log(`✅ PRICE MATCH: ${venue.name} matches ${venue.price_range}`);
      }

      // Vibe/tag matching (20% weight)
      maxScore += 20;
      if (venue.tags && userPrefs.preferred_vibes) {
        const vibeMatches = venue.tags.filter(tag => 
          userPrefs.preferred_vibes.includes(tag)
        );
        if (vibeMatches.length > 0) {
          score += 20;
          console.log(`✅ VIBE MATCH: ${venue.name} matches vibes:`, vibeMatches);
        }
      }

      // Dietary restrictions (10% weight)
      maxScore += 10;
      if (userPrefs.dietary_restrictions?.length > 0) {
        // Check if venue supports dietary restrictions
        const supportsDietary = venue.tags?.some(tag => 
          ['vegetarian', 'vegan', 'gluten-free', 'halal'].includes(tag.toLowerCase())
        );
        if (supportsDietary || userPrefs.dietary_restrictions.length === 0) {
          score += 10;
        }
      } else {
        score += 10; // No restrictions = full score
      }

      const matchPercentage = maxScore > 0 ? (score / maxScore) * 100 : 50;
      
      return {
        ...venue,
        preferenceScore: matchPercentage
      };
    });

    // Sort by preference score and return venues with at least some match
    const filteredVenues = scoredVenues
      .filter(venue => venue.preferenceScore >= 25) // At least 25% match
      .sort((a, b) => b.preferenceScore - a.preferenceScore);

    console.log(`🎯 PREFERENCE FILTER: Filtered ${venues.length} -> ${filteredVenues.length} venues`);
    console.log('🎯 TOP MATCHES:', filteredVenues.slice(0, 5).map(v => 
      `${v.name}: ${Math.round(v.preferenceScore)}%`
    ));

    // Return at least 10 venues if available, otherwise all filtered
    return filteredVenues.slice(0, Math.max(10, filteredVenues.length));
  } catch (error) {
    console.error('❌ PREFERENCE FILTER: Error filtering venues:', error);
    return venues; // Return original venues if filtering fails
  }
};

// Enhanced collaborative preference filtering for two users
export const filterVenuesByCollaborativePreferences = async (
  userId: string, 
  partnerId: string, 
  venues: any[]
) => {
  try {
    console.log('🤝 COLLABORATIVE FILTER: Filtering for users:', userId, 'and', partnerId);
    
    // Get both users' preferences
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: partnerPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', partnerId)
      .single();

    if (!userPrefs || !partnerPrefs) {
      console.log('⚠️ COLLABORATIVE FILTER: Missing preferences, using single user filter');
      return filterVenuesByPreferences(userId, venues);
    }

    console.log('🤝 COLLABORATIVE FILTER: Both users preferences loaded');

    // Score venues based on combined preferences
    const collaborativeScoredVenues = venues.map(venue => {
      let userScore = 0;
      let partnerScore = 0;
      let sharedScore = 0;

      // Check individual matches
      const userCuisineMatch = userPrefs.preferred_cuisines?.includes(venue.cuisine_type);
      const partnerCuisineMatch = partnerPrefs.preferred_cuisines?.includes(venue.cuisine_type);
      const userPriceMatch = userPrefs.preferred_price_range?.includes(venue.price_range);
      const partnerPriceMatch = partnerPrefs.preferred_price_range?.includes(venue.price_range);

      // Individual scoring
      if (userCuisineMatch) userScore += 40;
      if (partnerCuisineMatch) partnerScore += 40;
      if (userPriceMatch) userScore += 30;
      if (partnerPriceMatch) partnerScore += 30;

      // Shared preferences bonus (highly weighted)
      if (userCuisineMatch && partnerCuisineMatch) {
        sharedScore += 50;
        console.log(`🎉 SHARED CUISINE: ${venue.name} - both love ${venue.cuisine_type}`);
      }
      if (userPriceMatch && partnerPriceMatch) {
        sharedScore += 30;
        console.log(`🎉 SHARED PRICE: ${venue.name} - both okay with ${venue.price_range}`);
      }

      // Vibe matching
      if (venue.tags && userPrefs.preferred_vibes && partnerPrefs.preferred_vibes) {
        const userVibeMatches = venue.tags.filter(tag => userPrefs.preferred_vibes.includes(tag));
        const partnerVibeMatches = venue.tags.filter(tag => partnerPrefs.preferred_vibes.includes(tag));
        const sharedVibeMatches = userVibeMatches.filter(tag => partnerVibeMatches.includes(tag));
        
        if (sharedVibeMatches.length > 0) {
          sharedScore += 20;
          console.log(`🎉 SHARED VIBE: ${venue.name} - both like:`, sharedVibeMatches);
        }
      }

      // Calculate final collaborative score
      // Heavily weight shared preferences, moderately weight individual
      const collaborativeScore = (sharedScore * 1.5 + (userScore + partnerScore) * 0.5) / 2;
      
      return {
        ...venue,
        collaborativeScore,
        userScore,
        partnerScore,
        sharedScore
      };
    });

    // Sort by collaborative score
    const filteredVenues = collaborativeScoredVenues
      .filter(venue => venue.collaborativeScore >= 20) // Minimum collaborative threshold
      .sort((a, b) => b.collaborativeScore - a.collaborativeScore);

    console.log(`🤝 COLLABORATIVE FILTER: Scored ${venues.length} venues`);
    console.log('🤝 TOP COLLABORATIVE MATCHES:', filteredVenues.slice(0, 5).map(v => 
      `${v.name}: ${Math.round(v.collaborativeScore)}% (shared: ${Math.round(v.sharedScore)}%)`
    ));

    return filteredVenues.slice(0, Math.max(15, filteredVenues.length));
  } catch (error) {
    console.error('❌ COLLABORATIVE FILTER: Error:', error);
    return filterVenuesByPreferences(userId, venues);
  }
};