
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
    preferences: DatePreferences,
    userLocation?: { latitude: number; longitude: number; address?: string }
  ) => {
    if (!user) {
      console.error('🚫 AI ANALYSIS: No user found');
      return;
    }

    console.log('🚀 AI ANALYSIS: Starting comprehensive analysis for session:', sessionId);
    console.log('👥 AI ANALYSIS: User:', user.id, 'Partner:', partnerId);
    console.log('⚙️ AI ANALYSIS: Preferences:', preferences);

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
        console.log('📍 AI ANALYSIS: Using location:', userLocation);
        
        // Get AI venue recommendations with user location
        const venues = await getAIVenueRecommendations(user.id, partnerId, 10, userLocation);
        console.log('📍 AI ANALYSIS: Venue recommendations received:', venues?.length || 0);
        
        if (!venues || venues.length === 0) {
          console.error('❌ AI ANALYSIS: No venue recommendations found!');
          console.log('🔍 AI ANALYSIS: This indicates either:');
          console.log('  - Google Places API issues');
          console.log('  - No database venues available');
          console.log('  - Scoring algorithm too restrictive');
          console.log('  - User preferences too specific');
          
          // Set empty array but continue flow
          setVenueRecommendations([]);
        } else {
          console.log('🎉 AI ANALYSIS: Successfully got venues:', venues.map(v => `${v.venue_name} (${v.ai_score}%)`));
          setVenueRecommendations(venues);
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
      
      // Set fallback values to unblock the UI
      setVenueRecommendations([]);
      if (!compatibilityScore) {
        setCompatibilityScore(75); // Default compatibility score
      }
      
      handleError(error, {
        toastTitle: 'AI Analysis Error',
        toastDescription: error.message === 'AI analysis timed out after 45 seconds' 
          ? 'Analysis took too long, continuing with available data'
          : 'Could not complete full analysis, continuing with defaults'
      });
    }
  }, [user, handleError, compatibilityScore]);

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
