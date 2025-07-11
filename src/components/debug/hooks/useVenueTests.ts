import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAIVenueRecommendations } from '@/services/aiVenueService/recommendations';
import { calculateVenueAIScore } from '@/services/aiVenueService/scoring';

export const useVenueTests = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGooglePlacesAPI = async () => {
    setLoading(true);
    setResults(null);
    console.log('🧪 Testing Google Places API directly...');
    
    try {
      // Test direct API call to search-venues function
      const { data: searchResult, error } = await supabase.functions.invoke('search-venues', {
        body: {
          location: 'San Francisco, CA',
          cuisines: ['italian'],
          vibes: ['romantic'],
          latitude: 37.7749,
          longitude: -122.4194,
          radius: 16093.4 // 10 miles in meters
        }
      });

      console.log('🏢 Google Places API Response:', { searchResult, error });
      
      if (error) {
        setResults({ 
          type: 'error', 
          message: `Google Places API Error: ${error.message}`,
          details: error 
        });
        return;
      }

      setResults({
        type: 'google-places',
        data: searchResult,
        venueCount: searchResult?.venues?.length || 0
      });
    } catch (err: any) {
      console.error('🔥 Google Places API Test Failed:', err);
      setResults({ 
        type: 'error', 
        message: `API Test Failed: ${err.message}`,
        details: err 
      });
    } finally {
      setLoading(false);
    }
  };

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

  const testFullRecommendationFlow = async () => {
    setLoading(true);
    setResults(null);
    console.log('🧪 Testing full recommendation flow...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResults({ type: 'error', message: 'User not authenticated' });
        return;
      }

      console.log('🔄 Calling getAIVenueRecommendations...');
      const recommendations = await getAIVenueRecommendations(user.id, undefined, 10);
      
      console.log('📋 AI Venue Recommendations:', recommendations);

      setResults({
        type: 'full-flow',
        recommendations,
        count: recommendations.length,
        topRecommendation: recommendations[0]
      });
    } catch (err: any) {
      console.error('🔥 Full Flow Test Failed:', err);
      setResults({ 
        type: 'error', 
        message: `Full Flow Test Failed: ${err.message}`,
        details: err 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    testGooglePlacesAPI,
    testVenueScoring,
    testFullRecommendationFlow
  };
};