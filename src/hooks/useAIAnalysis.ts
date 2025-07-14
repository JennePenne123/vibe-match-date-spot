
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getCompatibilityScore } from '@/services/aiMatchingService';
import { getAIVenueRecommendations } from '@/services/aiVenueService';
import { supabase } from '@/integrations/supabase/client';

interface DatePreferences {
  preferred_cuisines?: string[];
  preferred_price_range?: string[];
  preferred_times?: string[];
  preferred_vibes?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
}

export const useAIAnalysis = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [venueRecommendations, setVenueRecommendations] = useState<any[]>([]);
  const [venueSearchError, setVenueSearchError] = useState<string | null>(null);

  // Analyze compatibility and get venue recommendations with timeout and better error handling
  const analyzeCompatibilityAndVenues = useCallback(async (
    sessionId: string, 
    partnerId: string, 
    preferences: DatePreferences,
    userLocation?: { latitude: number; longitude: number; address?: string }
    ) => {
    console.log('🚀 AI ANALYSIS: ===== STARTING AI ANALYSIS =====');
    console.log('🚀 AI ANALYSIS: Function called with params:', { sessionId, partnerId, userLocation, preferences });
    
    if (!user) {
      console.error('🚫 AI ANALYSIS: No user found');
      return;
    }
    
    console.log('👤 AI ANALYSIS: User verified:', user.id);

    console.log('🚀 AI ANALYSIS: Starting comprehensive analysis for session:', sessionId);
    console.log('👥 AI ANALYSIS: User:', user.id, 'Partner:', partnerId);
    console.log('⚙️ AI ANALYSIS: Preferences:', preferences);
    
    // Clear previous errors
    setVenueSearchError(null);

    const timeout = 45000; // Increased to 45 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI analysis timed out after 45 seconds')), timeout)
    );

    try {
      const analysisPromise = async () => {
        console.log('📊 AI ANALYSIS: Step 1 - Getting compatibility score...');
        
        // Get compatibility score
        const compatibility = await getCompatibilityScore(user.id, partnerId);
        
        if (compatibility) {
          console.log('❤️ AI ANALYSIS: Compatibility score received:', compatibility.overall_score + '%');
          setCompatibilityScore(compatibility.overall_score);
          
          // Update session with compatibility score
          await supabase
            .from('date_planning_sessions')
            .update({ 
              ai_compatibility_score: compatibility.overall_score,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
            
          console.log('✅ AI ANALYSIS: Session updated with compatibility score');
        } else {
          console.warn('⚠️ AI ANALYSIS: No compatibility score received, using default');
          setCompatibilityScore(75);
        }

        console.log('🏢 AI ANALYSIS: Step 2 - Getting venue recommendations...');
        console.log('📍 AI ANALYSIS: Real user location validation:', userLocation);
        
        if (!userLocation?.latitude || !userLocation?.longitude) {
          throw new Error('Real user location is required for venue recommendations. Please enable location access.');
        }
        
        console.log('🎯 AI ANALYSIS: Calling Google Places API via getAIVenueRecommendations with real location:', { 
          userId: user.id, 
          partnerId, 
          location: `${userLocation.latitude}, ${userLocation.longitude}` 
        });
        
        // Get AI venue recommendations with REAL user location only
        const venues = await getAIVenueRecommendations(user.id, partnerId, 10, userLocation);
        console.log('📍 AI ANALYSIS: Real venue recommendations received:', venues?.length || 0);
        console.log('🏢 AI ANALYSIS: Real venue details:', venues?.map(v => ({ name: v.venue_name, score: v.ai_score, source: 'Google Places API' })));
        
        if (!venues || venues.length === 0) {
          console.error('❌ AI ANALYSIS: No venue recommendations found!');
          const errorMessage = 'No venues found in your area. Please check your location or try adjusting your preferences.';
          setVenueSearchError(errorMessage);
          setVenueRecommendations([]);
        } else {
          console.log('🎉 AI ANALYSIS: Successfully got venues:', venues.map(v => `${v.venue_name} (${v.ai_score}%)`));
          setVenueRecommendations(venues);
          setVenueSearchError(null); // Clear any previous errors on success
        }
        
        console.log('✅ AI ANALYSIS: Analysis completed successfully');
      };

      await Promise.race([analysisPromise(), timeoutPromise]);

    } catch (error) {
      console.error('❌ AI ANALYSIS: Critical error occurred:', {
        message: error.message,
        stack: error.stack,
        sessionId,
        userId: user.id,
        partnerId
      });
      
      // Set error state and fallback values
      const errorMessage = error.message || 'Failed to get venue recommendations';
      setVenueSearchError(errorMessage);
      setVenueRecommendations([]);
      
      if (!compatibilityScore) {
        setCompatibilityScore(75); // Default compatibility score
      }
      
      handleError(error, {
        toastTitle: 'AI Analysis Error', 
        toastDescription: error.message === 'AI analysis timed out after 45 seconds'
          ? 'Analysis took too long, continuing with available data'
          : 'Could not complete venue search, please try again'
      });
    }
  }, [user, handleError, compatibilityScore]);

  const resetAIState = useCallback(() => {
    setCompatibilityScore(null);
    setVenueRecommendations([]);
    setVenueSearchError(null);
  }, []);

  return {
    compatibilityScore,
    setCompatibilityScore,
    venueRecommendations,
    setVenueRecommendations,
    venueSearchError,
    analyzeCompatibilityAndVenues,
    resetAIState
  };
};
