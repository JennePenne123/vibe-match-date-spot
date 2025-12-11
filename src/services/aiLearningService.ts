import { supabase } from '@/integrations/supabase/client';

export interface LearningMetrics {
  totalRatings: number;
  aiAccuracy: string;
  improvementPercent: string;
  predictionError: string | null;
}

export interface TrendData {
  ratingTrend: 'improving' | 'stable' | 'declining';
  accuracyTrend: 'improving' | 'stable' | 'declining';
  recentAvgRating: number;
  previousAvgRating: number;
  improvementPercent: number;
}

export interface CategoryStat {
  count: number;
  avgRating: number;
  successRate: number;
}

export interface CategoryPerformance {
  byCuisine: Record<string, CategoryStat>;
  byVibe: Record<string, CategoryStat>;
  byPrice: Record<string, CategoryStat>;
}

export interface TimelineEntry {
  date: string;
  rating: number;
  predicted: number;
  accuracy: number;
}

export interface RadarDataPoint {
  category: string;
  value: number;
  fullMark: number;
}

export interface AIInsights {
  totalDates: number;
  successfulDates: number;
  avgRating: string;
  aiAccuracy: string;
  learningProgress: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  textInsights: string[];
  featureWeights: Record<string, number> | null;
  topSuccessPatterns: Array<{ pattern: string; count: number }>;
  topFailurePatterns: Array<{ pattern: string; count: number }>;
  // Advanced insights
  trends?: TrendData;
  categoryPerformance?: CategoryPerformance;
  timelineData?: TimelineEntry[];
  predictions?: string[];
  radarData?: RadarDataPoint[];
}

export interface LearnFromFeedbackParams {
  userId: string;
  partnerId?: string;
  venueId: string;
  invitationId?: string;
  predictedScore: number;
  predictedFactors?: Record<string, unknown>;
  actualRating: number;
  venueRating?: number;
  aiAccuracyRating?: number;
  wouldRecommend?: boolean;
  contextData?: Record<string, unknown>;
}

export const learnFromFeedback = async (params: LearnFromFeedbackParams): Promise<LearningMetrics | null> => {
  try {
    console.log('📚 Sending feedback to AI learning system:', params.venueId);

    const { data, error } = await supabase.functions.invoke('learn-from-feedback', {
      body: params
    });

    if (error) {
      console.error('Error calling learn-from-feedback:', error);
      throw error;
    }

    console.log('✅ AI learning response:', data);
    return data.metrics;
  } catch (err) {
    console.error('Failed to learn from feedback:', err);
    return null;
  }
};

export const getAIInsights = async (userId: string): Promise<AIInsights | null> => {
  try {
    console.log('🔍 Fetching AI insights for user:', userId);

    const { data, error } = await supabase.functions.invoke('get-ai-insights', {
      body: { userId }
    });

    if (error) {
      console.error('Error calling get-ai-insights:', error);
      throw error;
    }

    console.log('✅ AI insights received:', data);
    return data.insights;
  } catch (err) {
    console.error('Failed to get AI insights:', err);
    return null;
  }
};

export const getUserLearningData = async (userId: string) => {
  const { data, error } = await supabase
    .from('ai_learning_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching learning data:', error);
    return [];
  }

  return data || [];
};

export const getUserPreferenceVectors = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_preference_vectors')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preference vectors:', error);
    return null;
  }

  return data;
};
