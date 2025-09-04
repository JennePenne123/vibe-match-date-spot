import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getCompatibilityScore, CompatibilityScore } from '@/services/aiMatchingService';
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
  
  // Enhanced state management
  const [compatibilityScore, setCompatibilityScore] = useState<CompatibilityScore | number | null>(null);
  const [venueRecommendations, setVenueRecommendations] = useState<any[]>([]);
  const [venueSearchError, setVenueSearchError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');

  // Google Places API validation function
  const validateGooglePlacesAPI = async (): Promise<boolean> => {
    try {
      console.log('🔍 AI ANALYSIS: Validating Google Places API setup...');
      
      const { data, error } = await supabase.functions.invoke('validate-google-places-setup', {
        body: { test: true }
      });
      
      if (error) {
        console.error('❌ AI ANALYSIS: Google Places validation failed:', error);
        return false;
      }
      
      console.log('✅ AI ANALYSIS: Google Places API validation result:', data);
      return data?.isValid === true;
    } catch (error) {
      console.error('❌ AI ANALYSIS: Error validating Google Places:', error);
      return false;
    }
  };

  // Retry function with exponential backoff
  const retryAnalysisWithBackoff = async (
    analysisFunction: () => Promise<any>,
    maxRetries: number = 2,
    baseDelay: number = 2000
  ): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI ANALYSIS: Retry attempt ${attempt}/${maxRetries}`);
        setRetryCount(attempt - 1);
        
        const result = await analysisFunction();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        console.error(`❌ AI ANALYSIS: Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ AI ANALYSIS: Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Last attempt failed
        }
      }
    }
  };

  // Main analysis function with enhanced error handling and retry logic
  const analyzeCompatibilityAndVenues = useCallback(async (
    sessionId: string, 
    partnerId: string, 
    preferences: DatePreferences,
    userLocation?: { latitude: number; longitude: number; address?: string }
  ) => {
    console.log('🚀 AI ANALYSIS: ===== STARTING ENHANCED AI ANALYSIS =====');
    
    // Prevent multiple simultaneous executions
    if (isAnalyzing) {
      console.warn('🚫 AI ANALYSIS: Analysis already in progress, skipping...');
      return;
    }
    
    if (!user) {
      console.error('🚫 AI ANALYSIS: No user found');
      setAnalysisError('User not authenticated');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setVenueSearchError(null);
    setRetryCount(0);

    try {
      // STEP 1: Validate Google Places API Setup
      console.log('🔍 AI ANALYSIS: Step 0 - Validating Google Places API...');
      setCurrentStep('Validating Google Places API...');
      
      const isGooglePlacesValid = await validateGooglePlacesAPI();
      
      if (!isGooglePlacesValid) {
        console.warn('⚠️ AI ANALYSIS: Google Places API validation failed, proceeding with fallback...');
        setVenueSearchError('Google Places API not available, using fallback venues');
      }

      // STEP 2: Compatibility Score with Retry
      console.log('📊 AI ANALYSIS: Step 1 - Getting compatibility score with retry...');
      setCurrentStep('Calculating compatibility...');
      
      const compatibility = await retryAnalysisWithBackoff(async () => {
        return await getCompatibilityScore(user.id, partnerId);
      });
      
      if (compatibility) {
        console.log('❤️ AI ANALYSIS: Compatibility score received:', compatibility.overall_score + '%');
        console.log('📊 AI ANALYSIS: Full compatibility data:', compatibility);
        setCompatibilityScore(compatibility); // Store full compatibility object
        
        await supabase
          .from('date_planning_sessions')
          .update({ 
            ai_compatibility_score: compatibility.overall_score,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      } else {
        console.warn('⚠️ AI ANALYSIS: No compatibility score, using default');
        setCompatibilityScore(75);
      }

      // STEP 3: Venue Recommendations with enhanced retry and fallback
      console.log('🏢 AI ANALYSIS: Step 2 - Getting venue recommendations with enhanced retry...');
      setCurrentStep('Searching for venues...');
      
      if (!userLocation?.latitude || !userLocation?.longitude) {
        throw new Error('Real user location is required for venue recommendations');
      }

      console.log('📍 AI ANALYSIS: User location validated:', userLocation);

      const venues = await retryAnalysisWithBackoff(async () => {
        console.log('🎯 AI ANALYSIS: Calling getAIVenueRecommendations...');
        setCurrentStep('Finding perfect matches...');
        return await getAIVenueRecommendations(user.id, partnerId, 10, userLocation);
      }, 3, 3000); // 3 Retries with 3s, 6s, 12s delays

      if (!venues || venues.length === 0) {
        console.error('❌ AI ANALYSIS: No venues found after all retries');
        const errorMessage = isGooglePlacesValid 
          ? 'No venues found in your area. Please try a different location or adjust your preferences.'
          : 'Venue search temporarily unavailable. Please try again later.';
        setVenueSearchError(errorMessage);
        setVenueRecommendations([]);
      } else {
        console.log('🎉 AI ANALYSIS: Successfully got venues:', venues.map(v => `${v.venue_name} (${v.ai_score}%)`));
        console.log('🎉 AI ANALYSIS: Setting venue recommendations in state, count:', venues.length);
        console.log('🎉 AI ANALYSIS: First venue details:', venues[0]);
        console.log('🔍 AI ANALYSIS: First venue venue_id debug:', {
          venue_id: venues[0]?.venue_id,
          venue_id_type: typeof venues[0]?.venue_id,
          venue_id_serialized: JSON.stringify(venues[0]?.venue_id),
          full_venue_keys: venues[0] ? Object.keys(venues[0]) : []
        });
        setVenueRecommendations(venues);
        setVenueSearchError(null);
        
        // Add a small delay to check if state was set correctly
        setTimeout(() => {
          console.log('🔍 AI ANALYSIS: Venue recommendations state check - should have venues now');
        }, 100);
      }

      setCurrentStep('Analysis complete!');
      console.log('✅ AI ANALYSIS: Enhanced analysis completed successfully');

    } catch (error) {
      console.error('❌ AI ANALYSIS: Critical error in enhanced analysis:', {
        message: error.message,
        stack: error.stack,
        sessionId,
        userId: user.id,
        partnerId,
        retryCount
      });
      
      setAnalysisError(error.message || 'Analysis failed');
      
      // Fallback strategies based on error type
      if (error.message?.includes('timeout')) {
        setVenueSearchError('Search took too long, please try again with a smaller search radius');
      } else if (error.message?.includes('location')) {
        setVenueSearchError('Location error: Please enable location access and try again');
      } else if (error.message?.includes('Google Places')) {
        setVenueSearchError('Venue search temporarily unavailable, please try again later');
      } else {
        setVenueSearchError('Could not complete venue search, please try again');
      }
      
      setVenueRecommendations([]);
      
      if (!compatibilityScore) {
        setCompatibilityScore(75);
      }
      
      handleError(error, {
        toastTitle: 'AI Analysis Error',
        toastDescription: error.message?.includes('timeout')
          ? 'Analysis took too long, continuing with available data'
          : 'Could not complete analysis, please try again'
      });
    } finally {
      setIsAnalyzing(false);
      setRetryCount(0);
      setCurrentStep('');
    }
  }, [user, handleError, isAnalyzing]);

  const resetAIState = useCallback(() => {
    setCompatibilityScore(null);
    setVenueRecommendations([]);
    setVenueSearchError(null);
    setAnalysisError(null);
    setRetryCount(0);
    setCurrentStep('');
  }, []);

  return {
    compatibilityScore,
    setCompatibilityScore,
    venueRecommendations,
    setVenueRecommendations,
    venueSearchError,
    analysisError,
    isAnalyzing,
    retryCount,
    currentStep,
    analyzeCompatibilityAndVenues,
    resetAIState
  };
};