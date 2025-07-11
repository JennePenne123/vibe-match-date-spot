import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateVenueAIScore } from '@/services/aiVenueService/scoring';

export const useVenueScoringTest = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testVenueScoring = async () => {
    setLoading(true);
    setResults(null);
    console.log('🧪 Testing venue scoring system...');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResults({ type: 'error', message: 'User not authenticated' });
        return;
      }

      // Get user preferences
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('👤 User preferences:', userPrefs);

      // Get existing venues from database
      const { data: venues } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .limit(10);

      console.log('🏢 Database venues:', venues);

      if (!venues || venues.length === 0) {
        setResults({ type: 'error', message: 'No venues found in database' });
        return;
      }

      // Test scoring for each venue
      const scoredVenues = [];
      for (const venue of venues) {
        const score = await calculateVenueAIScore(venue.id, user.id);
        console.log(`🎯 Venue "${venue.name}" scored: ${score}%`);
        scoredVenues.push({ ...venue, ai_score: score });
      }

      setResults({
        type: 'venue-scoring',
        userPrefs,
        venues: scoredVenues.sort((a, b) => b.ai_score - a.ai_score),
        topVenue: scoredVenues.sort((a, b) => b.ai_score - a.ai_score)[0]
      });
    } catch (err: any) {
      console.error('🔥 Venue Scoring Test Failed:', err);
      setResults({ 
        type: 'error', 
        message: `Scoring Test Failed: ${err.message}`,
        details: err 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    testVenueScoring
  };
};