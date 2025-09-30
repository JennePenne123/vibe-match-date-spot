
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types/app';

export interface CompatibilityScore {
  overall_score: number;
  cuisine_score: number;
  vibe_score: number;
  price_score: number;
  timing_score: number;
  activity_score: number;
  compatibility_factors: any;
}

export interface VenueAIScore {
  venue_id: string;
  ai_score: number;
  match_factors: any;
  contextual_score: number;
  weather_factor: number;
  time_factor: number;
  crowd_factor: number;
  event_factor: number;
}

export const calculateCompatibilityScore = async (
  user1Id: string,
  user2Id: string
): Promise<CompatibilityScore | null> => {
  try {
    console.log('🔄 COMPATIBILITY: Calculating compatibility for users:', user1Id, user2Id);

    // Get both users' preferences
    console.log('🔍 COMPATIBILITY: Querying preferences for users:', [user1Id, user2Id]);
    
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .in('user_id', [user1Id, user2Id]);

    if (prefError) {
      console.error('🚨 COMPATIBILITY: Error fetching preferences:', prefError);
      throw prefError;
    }

    console.log('📊 COMPATIBILITY: Retrieved preferences:', preferences);
    console.log('📊 COMPATIBILITY: Preferences count:', preferences?.length || 0);
    
    // Debug: Check individual user preferences
    const user1Prefs = preferences?.find(p => p.user_id === user1Id);
    const user2Prefs = preferences?.find(p => p.user_id === user2Id);
    console.log('📊 COMPATIBILITY: User 1 preferences found:', !!user1Prefs);
    console.log('📊 COMPATIBILITY: User 2 preferences found:', !!user2Prefs);

    if (!preferences || preferences.length < 2) {
      console.log('⚠️ COMPATIBILITY: Not enough preference data for calculation. Found:', preferences?.length || 0, 'preferences');
      console.log('⚠️ COMPATIBILITY: Expected 2 users, but only found preferences for:', preferences?.map(p => p.user_id) || []);
      return null;
    }

    if (!user1Prefs || !user2Prefs) {
      console.log('⚠️ COMPATIBILITY: Missing preferences for one or both users');
      console.log('User 1 preferences:', !!user1Prefs);
      console.log('User 2 preferences:', !!user2Prefs);
      return null;
    }

    console.log('✅ COMPATIBILITY: Found preferences for both users, calling AI analysis...');

    // Call AI edge function for intelligent compatibility analysis
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-compatibility', {
      body: {
        user1Preferences: user1Prefs,
        user2Preferences: user2Prefs
      }
    });

    if (aiError) {
      console.error('🚨 COMPATIBILITY: AI analysis error:', aiError);
      // Fallback to rule-based calculation if AI fails
      return calculateCompatibilityFallback(user1Prefs, user2Prefs);
    }

    console.log('🤖 COMPATIBILITY: AI analysis complete:', aiResult);

    const compatibilityData: CompatibilityScore = {
      overall_score: aiResult.overall_score,
      cuisine_score: aiResult.cuisine_score,
      vibe_score: aiResult.vibe_score,
      price_score: aiResult.price_score,
      timing_score: aiResult.timing_score,
      activity_score: aiResult.activity_score,
      compatibility_factors: aiResult.compatibility_factors
    };

    console.log('💾 COMPATIBILITY: Storing compatibility data:', compatibilityData);

    // Store the compatibility score
    const { data: storedData, error: insertError } = await supabase
      .from('ai_compatibility_scores')
      .upsert({
        user1_id: user1Id,
        user2_id: user2Id,
        ...compatibilityData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('🚨 COMPATIBILITY: Error storing compatibility score:', insertError);
    } else {
      console.log('✅ COMPATIBILITY: Successfully stored compatibility score:', storedData);
    }

    return compatibilityData;
  } catch (error) {
    console.error('Error calculating compatibility:', error);
    return null;
  }
};

// Fallback function for rule-based calculation when AI is unavailable
const calculateCompatibilityFallback = (user1Prefs: any, user2Prefs: any): CompatibilityScore => {
  console.log('🔄 COMPATIBILITY: Using fallback rule-based calculation');

  const cuisineScore = calculateArrayCompatibility(
    user1Prefs.preferred_cuisines || [],
    user2Prefs.preferred_cuisines || []
  );

  const vibeScore = calculateArrayCompatibility(
    user1Prefs.preferred_vibes || [],
    user2Prefs.preferred_vibes || []
  );

  const priceScore = calculateArrayCompatibility(
    user1Prefs.preferred_price_range || [],
    user2Prefs.preferred_price_range || []
  );

  const timingScore = calculateArrayCompatibility(
    user1Prefs.preferred_times || [],
    user2Prefs.preferred_times || []
  );

  const activityScore = calculateDietaryCompatibility(
    user1Prefs.dietary_restrictions || [],
    user2Prefs.dietary_restrictions || []
  );

  const overallScore = (
    cuisineScore * 0.3 +
    vibeScore * 0.25 +
    priceScore * 0.2 +
    timingScore * 0.15 +
    activityScore * 0.1
  );

  return {
    overall_score: Math.round(overallScore * 100) / 100,
    cuisine_score: Math.round(cuisineScore * 100) / 100,
    vibe_score: Math.round(vibeScore * 100) / 100,
    price_score: Math.round(priceScore * 100) / 100,
    timing_score: Math.round(timingScore * 100) / 100,
    activity_score: Math.round(activityScore * 100) / 100,
    compatibility_factors: {
      shared_cuisines: getSharedItems(user1Prefs.preferred_cuisines || [], user2Prefs.preferred_cuisines || []),
      shared_vibes: getSharedItems(user1Prefs.preferred_vibes || [], user2Prefs.preferred_vibes || []),
      shared_price_ranges: getSharedItems(user1Prefs.preferred_price_range || [], user2Prefs.preferred_price_range || []),
      shared_times: getSharedItems(user1Prefs.preferred_times || [], user2Prefs.preferred_times || []),
      reasoning: 'Fallback rule-based calculation'
    }
  };
};

const calculateArrayCompatibility = (arr1: string[], arr2: string[]): number => {
  // Both have empty preferences - no data for compatibility
  if (arr1.length === 0 && arr2.length === 0) return 0.0;
  
  // One has empty preferences - can't calculate meaningful compatibility
  if (arr1.length === 0 || arr2.length === 0) return 0.0;

  const shared = getSharedItems(arr1, arr2);
  const total = new Set([...arr1, ...arr2]).size;
  
  return shared.length / total;
};

const calculateDietaryCompatibility = (diet1: string[], diet2: string[]): number => {
  // If no dietary restrictions, perfect compatibility
  if (diet1.length === 0 && diet2.length === 0) return 1.0;
  
  // If one has restrictions and other doesn't, moderate compatibility
  if (diet1.length === 0 || diet2.length === 0) return 0.7;
  
  // If both have restrictions, check overlap
  const shared = getSharedItems(diet1, diet2);
  return shared.length > 0 ? 0.9 : 0.3;
};

const getSharedItems = (arr1: string[], arr2: string[]): string[] => {
  return arr1.filter(item => arr2.includes(item));
};

export const clearCachedCompatibilityScores = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 COMPATIBILITY: Clearing cached compatibility scores for user:', userId);
    
    const { error } = await supabase
      .from('ai_compatibility_scores')
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) {
      console.error('🚨 COMPATIBILITY: Error clearing cached scores:', error);
      throw error;
    }

    console.log('✅ COMPATIBILITY: Cached compatibility scores cleared successfully');
  } catch (error) {
    console.error('❌ COMPATIBILITY: Failed to clear cached scores:', error);
  }
};

export const getCompatibilityScore = async (
  user1Id: string,
  user2Id: string
): Promise<CompatibilityScore | null> => {
  try {
    console.log('🔍 COMPATIBILITY: Checking for cached compatibility score between users:', user1Id, user2Id);
    
    const { data, error } = await supabase
      .from('ai_compatibility_scores')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      console.log('💫 COMPATIBILITY: No cached score found, calculating fresh compatibility');
      // Calculate new compatibility if not exists
      return await calculateCompatibilityScore(user1Id, user2Id);
    }

    console.log('📋 COMPATIBILITY: Using cached compatibility score from:', data.created_at);
    return {
      overall_score: data.overall_score,
      cuisine_score: data.cuisine_score,
      vibe_score: data.vibe_score,
      price_score: data.price_score,
      timing_score: data.timing_score,
      activity_score: data.activity_score,
      compatibility_factors: data.compatibility_factors
    };
  } catch (error) {
    console.error('Error getting compatibility score:', error);
    return null;
  }
};
