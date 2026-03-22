
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAIVenueRecommendations, AIVenueRecommendation } from '@/services/aiVenueService';
import { getCompatibilityScore, CompatibilityScore } from '@/services/aiMatchingService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getLocationFallback } from '@/utils/locationFallback';

export const useAIRecommendations = (partnerId?: string) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [recommendations, setRecommendations] = useState<AIVenueRecommendation[]>([]);
  const [compatibilityScore, setCompatibilityScore] = useState<CompatibilityScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!user) {
      console.log('🚫 AI RECOMMENDATIONS: No user found, skipping');
      return;
    }

    console.log('🎯 AI RECOMMENDATIONS: Starting fetch for user:', user.id, 'with partner:', partnerId);
    setLoading(true);
    setError(null);

    try {
      // Get venue recommendations
      console.log('📍 AI RECOMMENDATIONS: Calling getAIVenueRecommendations...');
      const locationFallback = await getLocationFallback(user.id);
      if (!locationFallback) {
        console.warn('📍 AI RECOMMENDATIONS: No location available — user must set location');
        setError('Bitte setze deinen Standort in den Einstellungen, um Venues zu finden.');
        setLoading(false);
        return;
      }
      const userLocation = {
        latitude: locationFallback.latitude,
        longitude: locationFallback.longitude,
        address: locationFallback.address,
      };
      console.log('📍 AI RECOMMENDATIONS: Using location:', userLocation.address, `(${locationFallback.source})`);
      const venueRecs = await getAIVenueRecommendations(user.id, partnerId, 10, userLocation);
      console.log('✅ AI RECOMMENDATIONS: Received', venueRecs.length, 'venue recommendations');
      setRecommendations(venueRecs);

      // Get compatibility score if partner is specified
      if (partnerId) {
        const compScore = await getCompatibilityScore(user.id, partnerId);
        setCompatibilityScore(compScore);
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch AI recommendations';
      setError(errorMessage);
      handleError(err, {
        toastTitle: 'AI Recommendations Error',
        toastDescription: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = () => {
    fetchRecommendations();
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user, partnerId]);

  return {
    recommendations,
    compatibilityScore,
    loading,
    error,
    refreshRecommendations
  };
};
