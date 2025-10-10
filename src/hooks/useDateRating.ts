import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface DateRatingData {
  overallRating: number;
  sentiment: 'loved' | 'good' | 'okay' | 'meh' | 'bad' | null;
  venueRating: number;
  venueTags: string[];
  aiAccuracyRating: number | null;
  feedbackText: string;
  wouldRecommendVenue: boolean | null;
  wouldUseAiAgain: boolean | null;
}

export interface PointsPreview {
  basic: number;
  aiAccuracy: number;
  detailedFeedback: number;
  completeAll: number;
  speedBonus: number;
  total: number;
}

export const useDateRating = (invitationId: string) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingData, setRatingData] = useState<DateRatingData>({
    overallRating: 0,
    sentiment: null,
    venueRating: 0,
    venueTags: [],
    aiAccuracyRating: null,
    feedbackText: '',
    wouldRecommendVenue: null,
    wouldUseAiAgain: null,
  });

  const calculatePoints = (): PointsPreview => {
    let points = {
      basic: 0,
      aiAccuracy: 0,
      detailedFeedback: 0,
      completeAll: 0,
      speedBonus: 0,
      total: 0,
    };

    // Basic rating (Steps 1-2)
    if (ratingData.overallRating > 0 && ratingData.venueRating > 0) {
      points.basic = 10;
    }

    // AI accuracy rating (Step 3)
    if (ratingData.aiAccuracyRating !== null) {
      points.aiAccuracy = 5;
    }

    // Detailed feedback (Step 4)
    if (ratingData.feedbackText.trim().length > 20) {
      points.detailedFeedback = 10;
    }

    // Complete all questions (Step 5)
    if (
      ratingData.wouldRecommendVenue !== null &&
      ratingData.wouldUseAiAgain !== null
    ) {
      points.completeAll = 15;
    }

    // Speed bonus (if submitted within 24h - calculated server-side)
    // This will be determined when we submit
    points.speedBonus = 5; // Preview value

    points.total = 
      points.basic + 
      points.aiAccuracy + 
      points.detailedFeedback + 
      points.completeAll + 
      points.speedBonus;

    return points;
  };

  const updateRatingData = (updates: Partial<DateRatingData>) => {
    setRatingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return ratingData.overallRating > 0 && ratingData.sentiment !== null;
      case 2:
        return ratingData.venueRating > 0;
      case 3:
      case 4:
      case 5:
        return true; // These steps are optional
      default:
        return false;
    }
  };

  const getCompletionLevel = (): 'basic' | 'detailed' | 'complete' => {
    const hasBasic = ratingData.overallRating > 0 && ratingData.venueRating > 0;
    const hasAiRating = ratingData.aiAccuracyRating !== null;
    const hasFeedback = ratingData.feedbackText.trim().length > 20;
    const hasRecommendations = 
      ratingData.wouldRecommendVenue !== null && 
      ratingData.wouldUseAiAgain !== null;

    if (hasBasic && hasAiRating && hasFeedback && hasRecommendations) {
      return 'complete';
    } else if (hasBasic && (hasAiRating || hasFeedback)) {
      return 'detailed';
    } else {
      return 'basic';
    }
  };

  const submitRating = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create date feedback entry
      const { data: feedback, error: feedbackError } = await supabase
        .from('date_feedback')
        .insert({
          invitation_id: invitationId,
          user_id: user.id,
          rating: ratingData.overallRating,
          venue_rating: ratingData.venueRating,
          ai_accuracy_rating: ratingData.aiAccuracyRating,
          would_recommend_venue: ratingData.wouldRecommendVenue,
          would_use_ai_again: ratingData.wouldUseAiAgain,
          feedback_text: ratingData.feedbackText || null,
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Calculate points and badges
      const completionLevel = getCompletionLevel();
      const points = calculatePoints();

      // Create feedback reward entry
      const { error: rewardError } = await supabase
        .from('feedback_rewards')
        .insert({
          feedback_id: feedback.id,
          user_id: user.id,
          points_earned: points.total,
          badges_earned: [],
          completion_level: completionLevel,
          speed_bonus: true, // Will be validated server-side
          both_rated_bonus: false, // Will be calculated server-side
        });

      if (rewardError) throw rewardError;

      // Update user points
      const { data: existingPoints } = await supabase
        .from('user_points')
        .select('total_points, streak_count, last_review_date')
        .eq('user_id', user.id)
        .single();

      const newTotal = (existingPoints?.total_points || 0) + points.total;
      
      // Calculate streak
      const lastReview = existingPoints?.last_review_date 
        ? new Date(existingPoints.last_review_date)
        : null;
      const today = new Date();
      const daysSinceLastReview = lastReview 
        ? Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      const newStreak = daysSinceLastReview <= 1 
        ? (existingPoints?.streak_count || 0) + 1 
        : 1;

      const { error: pointsError } = await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          total_points: newTotal,
          streak_count: newStreak,
          last_review_date: today.toISOString(),
        });

      if (pointsError) throw pointsError;

      toast({
        title: "🎉 Rating Submitted!",
        description: `You earned ${points.total} points! Thank you for your feedback.`,
      });

      return { success: true, points: points.total };
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your rating. Please try again.",
        variant: "destructive",
      });
      return { success: false, points: 0 };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    ratingData,
    isSubmitting,
    updateRatingData,
    nextStep,
    prevStep,
    canProceed,
    calculatePoints,
    submitRating,
    setCurrentStep,
  };
};
