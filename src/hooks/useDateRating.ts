import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { learnFromFeedback } from '@/services/aiLearningService';

export interface DateRatingData {
  overallRating: number;
  feedbackText: string;
}

export interface DateRatingOptions {
  venueId?: string;
  partnerId?: string;
  aiPredictedScore?: number | null;
  aiPredictedFactors?: Record<string, unknown> | null;
}

export const useDateRating = (invitationId: string, options?: DateRatingOptions) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingData, setRatingData] = useState<DateRatingData>({
    overallRating: 0,
    feedbackText: '',
  });

  const updateRatingData = (updates: Partial<DateRatingData>) => {
    setRatingData(prev => ({ ...prev, ...updates }));
  };

  const canSubmit = (): boolean => {
    return ratingData.overallRating > 0;
  };

  const submitRating = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create date feedback entry — single overall rating stored in both rating and venue_rating
      const { data: feedback, error: feedbackError } = await supabase
        .from('date_feedback')
        .insert({
          invitation_id: invitationId,
          user_id: user.id,
          rating: ratingData.overallRating,
          venue_rating: ratingData.overallRating,
          feedback_text: ratingData.feedbackText || null,
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Award points for rating
      const pointsEarned = ratingData.feedbackText.trim().length > 10 ? 15 : 10;

      const { error: rewardError } = await supabase
        .from('feedback_rewards')
        .insert({
          feedback_id: feedback.id,
          user_id: user.id,
          points_earned: pointsEarned,
          badges_earned: [],
          completion_level: ratingData.feedbackText.trim().length > 10 ? 'detailed' : 'basic',
          speed_bonus: false,
          both_rated_bonus: false,
        });

      if (rewardError) throw rewardError;

      // Update user points
      const { data: existingPoints } = await supabase
        .from('user_points')
        .select('total_points, streak_count, last_review_date')
        .eq('user_id', user.id)
        .single();

      const newTotal = (existingPoints?.total_points || 0) + pointsEarned;
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

      await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          total_points: newTotal,
          streak_count: newStreak,
          last_review_date: today.toISOString(),
        });

      // Send feedback to AI learning system
      if (options?.venueId) {
        try {
          await learnFromFeedback({
            userId: user.id,
            partnerId: options.partnerId,
            venueId: options.venueId,
            invitationId,
            predictedScore: options.aiPredictedScore ?? 75,
            predictedFactors: options.aiPredictedFactors ?? {},
            actualRating: ratingData.overallRating,
            venueRating: ratingData.overallRating,
            contextData: {
              feedbackText: ratingData.feedbackText,
            },
          });
        } catch (err) {
          console.error('⚠️ AI learning failed (non-blocking):', err);
        }
      }

      toast({
        title: "🎉 Bewertung abgegeben!",
        description: `Du hast ${pointsEarned} Punkte verdient. Danke für dein Feedback!`,
      });

      return { success: true, points: pointsEarned };
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht gespeichert werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
      return { success: false, points: 0 };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ratingData,
    isSubmitting,
    updateRatingData,
    canSubmit,
    submitRating,
  };
};
