import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { learnFromFeedback } from '@/services/aiLearningService';
import { calculateLevel } from '@/services/pointsService';
import { checkAndAwardBadges } from '@/services/badgeService';

export interface DateRatingData {
  overallRating: number;
  venueRating: number;
  feedbackText: string;
  wouldRecommendVenue: boolean | null;
}

export interface LearningImpact {
  weightChanges: Record<string, string>;
  totalRatings: number;
  aiAccuracy: string;
  improvementPercent: string;
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
  const [learningImpact, setLearningImpact] = useState<LearningImpact | null>(null);
  const [ratingData, setRatingData] = useState<DateRatingData>({
    overallRating: 0,
    venueRating: 0,
    feedbackText: '',
    wouldRecommendVenue: null,
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

      // Fetch invitation to check date time for speed bonus
      const { data: invitation } = await supabase
        .from('date_invitations')
        .select('actual_date_time, proposed_date')
        .eq('id', invitationId)
        .single();

      const dateTime = invitation?.actual_date_time || invitation?.proposed_date;
      const hoursSinceDate = dateTime
        ? (Date.now() - new Date(dateTime).getTime()) / (1000 * 60 * 60)
        : 999;
      const hasSpeedBonus = hoursSinceDate <= 24;

      const { data: feedback, error: feedbackError } = await supabase
        .from('date_feedback')
        .insert({
          invitation_id: invitationId,
          user_id: user.id,
          rating: ratingData.overallRating,
          venue_rating: ratingData.venueRating > 0 ? ratingData.venueRating : null,
          would_recommend_venue: ratingData.wouldRecommendVenue,
          feedback_text: ratingData.feedbackText || null,
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Calculate points based on completeness
      let pointsEarned = 10; // base for overall rating
      if (ratingData.venueRating > 0) pointsEarned += 5;
      if (ratingData.feedbackText.trim().length > 10) pointsEarned += 10;
      if (ratingData.wouldRecommendVenue !== null) pointsEarned += 5;
      if (hasSpeedBonus) pointsEarned += 10; // speed bonus

      const completionLevel = pointsEarned >= 25 ? 'complete' : pointsEarned >= 15 ? 'detailed' : 'basic';

      const { error: rewardError } = await supabase
        .from('feedback_rewards')
        .insert({
          feedback_id: feedback.id,
          user_id: user.id,
          points_earned: pointsEarned,
          badges_earned: [],
          completion_level: completionLevel,
          speed_bonus: hasSpeedBonus,
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

      const newLevel = calculateLevel(newTotal);

      await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          total_points: newTotal,
          level: newLevel,
          streak_count: newStreak,
          last_review_date: today.toISOString(),
        });

      // Check badges asynchronously (non-blocking)
      checkAndAwardBadges(user.id).catch(err =>
        console.error('⚠️ Badge check failed (non-blocking):', err)
      );

      // AI learning from predicted vs actual
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
            venueRating: ratingData.venueRating > 0 ? ratingData.venueRating : ratingData.overallRating,
            wouldRecommend: ratingData.wouldRecommendVenue ?? undefined,
            contextData: {
              feedbackText: ratingData.feedbackText,
            },
          });
        } catch (err) {
          console.error('⚠️ AI learning failed (non-blocking):', err);
        }
      }

      // Notify venue partner about new review (non-blocking)
      supabase.functions.invoke('notify-venue-partner', {
        body: {
          invitationId,
          venueRating: ratingData.venueRating,
          overallRating: ratingData.overallRating,
        },
      }).catch(err => console.error('⚠️ Partner notification failed (non-blocking):', err));

      const speedText = hasSpeedBonus ? ' (inkl. ⚡ Speed-Bonus!)' : '';
      toast({
        title: "🎉 Bewertung abgegeben!",
        description: `Du hast ${pointsEarned} Punkte verdient${speedText}. Danke für dein Feedback!`,
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
