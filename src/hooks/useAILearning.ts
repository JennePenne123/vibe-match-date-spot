import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAIInsights, AIInsights } from '@/services/aiLearningService';

export const useAILearning = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAIInsights(user.id);
      setInsights(data);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const refreshInsights = () => {
    fetchInsights();
  };

  return {
    insights,
    loading,
    error,
    refreshInsights
  };
};
