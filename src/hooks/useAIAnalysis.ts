
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

  // Analyze compatibility and get venue recommendations with timeout and better error handling
  const analyzeCompatibilityAndVenues = useCallback(async (
    sessionId: string, 
    partnerId: string, 
    preferences: DatePreferences
  ) => {
    if (!user) return;

    const timeout = 30000; // 30 second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI analysis timed out')), timeout)
    );

    try {
      console.log('Analyzing compatibility and venues...');
      
      const analysisPromise = async () => {
        // Get compatibility score
        const compatibility = await getCompatibilityScore(user.id, partnerId);
        
        if (compatibility) {
          console.log('Compatibility score:', compatibility.overall_score);
          setCompatibilityScore(compatibility.overall_score);
          
          // Update session with compatibility score
          await supabase
            .from('date_planning_sessions')
            .update({ 
              ai_compatibility_score: compatibility.overall_score,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        }

        // Get AI venue recommendations
        console.log('Getting venue recommendations...');
        const venues = await getAIVenueRecommendations(user.id, partnerId, 10);
        console.log('Venue recommendations received:', venues?.length || 0);
        
        // Ensure we always have some venues, even if scoring is low
        if (!venues || venues.length === 0) {
          console.warn('No AI venue recommendations found, this might indicate a matching issue');
          // Still set empty array to complete the flow
          setVenueRecommendations([]);
        } else {
          setVenueRecommendations(venues);
        }
      };

      await Promise.race([analysisPromise(), timeoutPromise]);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      
      // Set empty recommendations to unblock the UI
      setVenueRecommendations([]);
      setCompatibilityScore(75); // Default compatibility score
      
      handleError(error, {
        toastTitle: 'AI Analysis Error',
        toastDescription: error.message === 'AI analysis timed out' 
          ? 'Analysis took too long, using default recommendations'
          : 'Could not complete compatibility analysis, using defaults'
      });
    }
  }, [user, handleError]);

  const resetAIState = useCallback(() => {
    setCompatibilityScore(null);
    setVenueRecommendations([]);
  }, []);

  return {
    compatibilityScore,
    setCompatibilityScore,
    venueRecommendations,
    setVenueRecommendations,
    analyzeCompatibilityAndVenues,
    resetAIState
  };
};
