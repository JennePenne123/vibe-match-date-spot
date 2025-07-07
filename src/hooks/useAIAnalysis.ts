
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

  // Analyze compatibility and get venue recommendations
  const analyzeCompatibilityAndVenues = useCallback(async (
    sessionId: string, 
    partnerId: string, 
    preferences: DatePreferences
  ) => {
    if (!user) return;

    try {
      console.log('Analyzing compatibility and venues...');
      
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
      console.log('Venue recommendations:', venues);
      
      setVenueRecommendations(venues);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      handleError(error, {
        toastTitle: 'AI Analysis Error',
        toastDescription: 'Could not complete compatibility analysis'
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
