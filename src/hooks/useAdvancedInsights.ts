import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAIInsights, AIInsights } from '@/services/aiLearningService';

export const useAdvancedInsights = () => {
  const { user } = useAuth();

  const { 
    data: insights, 
    isLoading: loading, 
    error,
    refetch: refreshInsights 
  } = useQuery<AIInsights | null>({
    queryKey: ['ai-insights', user?.id],
    queryFn: () => user ? getAIInsights(user.id) : null,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    insights,
    loading,
    error: error ? 'Failed to load AI insights' : null,
    refreshInsights
  };
};
