
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAIVenueRecommendations, AIVenueRecommendation } from '@/services/aiVenueService';
import { getCompatibilityScore, CompatibilityScore } from '@/services/aiMatchingService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useAIRecommendations = (partnerId?: string) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [recommendations, setRecommendations] = useState<AIVenueRecommendation[]>([]);
  const [compatibilityScore, setCompatibilityScore] = useState<CompatibilityScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching AI recommendations for user:', user.id);

      // Get venue recommendations
      const venueRecs = await getAIVenueRecommendations(user.id, partnerId, 10);
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
