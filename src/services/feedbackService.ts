// services/feedbackService.ts
// Complete optimized feedback service with AI learning capabilities

import { supabase } from '@/integrations/supabase/client';

// Enhanced Types
export type FeedbackType = 'like' | 'dislike' | 'super_like' | 'skip' | 'visited' | 'interested' | 'not_interested';

export interface DateFeedbackData {
  invitation_id: string;
  rating?: number;
  venue_rating?: number;
  ai_accuracy_rating?: number;
  feedback_text?: string;
  would_recommend_venue?: boolean;
  would_use_ai_again?: boolean;
}

export interface VenueFeedbackData {
  venue_id: string;
  feedback_type: FeedbackType;
  context?: any;
}

export interface FeedbackContext {
  session_id?: string;
  partner_id?: string;
  planning_session_id?: string;
  source?: 'recommendations' | 'search' | 'favorites' | 'quick_feedback';
  timestamp?: string;
  ai_score?: number;
  confidence_level?: number;
}

export interface DateFeedback {
  id: string;
  invitation_id: string;
  user_id: string;
  rating?: number;
  venue_rating?: number;
  ai_accuracy_rating?: number;
  feedback_text?: string;
  would_recommend_venue?: boolean;
  would_use_ai_again?: boolean;
  created_at: string;
}

export interface VenueFeedback {
  id: string;
  user_id: string;
  venue_id: string;
  feedback_type: FeedbackType;
  context?: any;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInsights {
  average_date_rating: number;
  average_venue_rating: number;
  average_ai_accuracy: number;
  total_feedback_count: number;
  venue_recommendation_rate: number;
  ai_usage_rate: number;
}

export interface VenuePopularityStats {
  likes: number;
  dislikes: number;
  superLikes: number;
  skips: number;
  visited: number;
  interested: number;
  notInterested: number;
  totalFeedback: number;
  popularityScore: number;
}

// =============================================================================
// DATE FEEDBACK FUNCTIONS
// =============================================================================

/**
 * Check if a date invitation has been rated by the current user
 */
export const checkDateFeedbackStatus = async (
  invitationId: string
): Promise<{ hasRated: boolean; partnerHasRated: boolean } | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get the invitation to find the partner
    const { data: invitation } = await supabase
      .from('date_invitations')
      .select('sender_id, recipient_id')
      .eq('id', invitationId)
      .single();

    if (!invitation) return null;

    const partnerId = invitation.sender_id === user.id 
      ? invitation.recipient_id 
      : invitation.sender_id;

    // Check if current user has rated
    const { data: userFeedback } = await supabase
      .from('date_feedback')
      .select('id')
      .eq('invitation_id', invitationId)
      .eq('user_id', user.id)
      .maybeSingle();

    // Check if partner has rated
    const { data: partnerFeedback } = await supabase
      .from('date_feedback')
      .select('id')
      .eq('invitation_id', invitationId)
      .eq('user_id', partnerId)
      .maybeSingle();

    return {
      hasRated: !!userFeedback,
      partnerHasRated: !!partnerFeedback,
    };
  } catch (error) {
    console.error('Error checking feedback status:', error);
    return null;
  }
};

/**
 * Get pending date invitations that need rating (completed dates without feedback)
 */
export const getPendingRatings = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get completed invitations
    const { data: invitations, error } = await supabase
      .from('date_invitations')
      .select(`
        *,
        sender:profiles!date_invitations_sender_id_fkey(id, name, avatar_url),
        recipient:profiles!date_invitations_recipient_id_fkey(id, name, avatar_url)
      `)
      .eq('date_status', 'completed')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('proposed_date', { ascending: false });

    if (error) throw error;

    // Filter out invitations that already have feedback from current user
    const pending = [];
    for (const invitation of invitations || []) {
      const { data: feedback } = await supabase
        .from('date_feedback')
        .select('id')
        .eq('invitation_id', invitation.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!feedback) {
        pending.push(invitation);
      }
    }

    return pending;
  } catch (error) {
    console.error('Error getting pending ratings:', error);
    return [];
  }
};

export const createDateFeedback = async (
  feedbackData: DateFeedbackData
): Promise<DateFeedback | null> => {
  try {
    console.log('Creating date feedback:', feedbackData);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('date_feedback')
      .insert({
        ...feedbackData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating date feedback:', error);
      throw error;
    }

    console.log('Date feedback created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createDateFeedback:', error);
    return null;
  }
};

export const getDateFeedback = async (
  invitationId: string
): Promise<DateFeedback | null> => {
  try {
    console.log('Getting date feedback for invitation:', invitationId);
    
    const { data, error } = await supabase
      .from('date_feedback')
      .select('*')
      .eq('invitation_id', invitationId)
      .maybeSingle();

    if (error) {
      console.error('Error getting date feedback:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getDateFeedback:', error);
    return null;
  }
};

export const getUserDateFeedback = async (): Promise<DateFeedback[]> => {
  try {
    console.log('Getting user date feedback');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('date_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user date feedback:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserDateFeedback:', error);
    return [];
  }
};

// =============================================================================
// VENUE FEEDBACK FUNCTIONS (OPTIMIZED)
// =============================================================================

/**
 * Record user feedback on a venue with AI learning optimization
 */
export const recordVenueFeedback = async (
  venueId: string,
  feedbackType: FeedbackType,
  context: FeedbackContext = {}
): Promise<VenueFeedback | null> => {
  try {
    console.log('Recording venue feedback:', {
      venueId,
      feedbackType,
      context
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Enhanced context with timestamp and source tracking
    const enhancedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      source: context.source || 'quick_feedback',
      user_agent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Use upsert to replace any existing feedback for this venue
    const { data, error } = await supabase
      .from('user_venue_feedback')
      .upsert({
        user_id: user.id,
        venue_id: venueId,
        feedback_type: feedbackType,
        context: enhancedContext,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,venue_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording venue feedback:', error);
      throw error;
    }

    console.log('Venue feedback recorded successfully:', data);

    // Trigger ML retraining in background (non-blocking)
    triggerMLUpdate(user.id, venueId, feedbackType).catch(console.error);

    return data;
  } catch (error) {
    console.error('Error in recordVenueFeedback:', error);
    return null;
  }
};

/**
 * Get user's current feedback for a specific venue
 */
export const getUserVenueFeedback = async (
  venueId: string
): Promise<VenueFeedback | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_venue_feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('venue_id', venueId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user venue feedback:', error);
    return null;
  }
};

/**
 * Get all venue feedback for a specific venue (for analytics)
 */
export const getVenueFeedback = async (
  venueId: string
): Promise<VenueFeedback[]> => {
  try {
    console.log('Getting venue feedback for venue:', venueId);
    
    const { data, error } = await supabase
      .from('user_venue_feedback')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting venue feedback:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVenueFeedback:', error);
    return [];
  }
};

/**
 * Get all user's venue feedback (for ML training)
 */
export const getUserVenueFeedbackHistory = async (
  limit: number = 100
): Promise<VenueFeedback[]> => {
  try {
    console.log('Getting user venue feedback history');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_venue_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting user venue feedback:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserVenueFeedbackHistory:', error);
    return [];
  }
};

/**
 * Remove venue feedback
 */
export const removeVenueFeedback = async (
  venueId: string
): Promise<boolean> => {
  try {
    console.log('Removing venue feedback for venue:', venueId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('user_venue_feedback')
      .delete()
      .eq('user_id', user.id)
      .eq('venue_id', venueId);

    if (error) {
      console.error('Error removing venue feedback:', error);
      throw error;
    }

    console.log('Venue feedback removed successfully');
    return true;
  } catch (error) {
    console.error('Error in removeVenueFeedback:', error);
    return false;
  }
};

// =============================================================================
// ANALYTICS & INSIGHTS FUNCTIONS (ENHANCED)
// =============================================================================

/**
 * Get comprehensive venue popularity statistics
 */
export const getVenuePopularityStats = async (
  venueId: string
): Promise<VenuePopularityStats> => {
  try {
    const { data, error } = await supabase
      .from('user_venue_feedback')
      .select('feedback_type')
      .eq('venue_id', venueId);

    if (error) throw error;

    const stats = {
      likes: 0,
      dislikes: 0,
      superLikes: 0,
      skips: 0,
      visited: 0,
      interested: 0,
      notInterested: 0
    };

    data?.forEach(feedback => {
      switch (feedback.feedback_type) {
        case 'like':
          stats.likes++;
          break;
        case 'dislike':
          stats.dislikes++;
          break;
        case 'super_like':
          stats.superLikes++;
          break;
        case 'skip':
          stats.skips++;
          break;
        case 'visited':
          stats.visited++;
          break;
        case 'interested':
          stats.interested++;
          break;
        case 'not_interested':
          stats.notInterested++;
          break;
      }
    });

    const totalFeedback = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    // Enhanced popularity scoring: super_likes=5, visited=4, likes=3, interested=2, skips=1, dislikes=0
    const popularityScore = totalFeedback > 0 
      ? ((stats.superLikes * 5) + (stats.visited * 4) + (stats.likes * 3) + (stats.interested * 2) + (stats.skips * 1)) / (totalFeedback * 5)
      : 0;

    return {
      ...stats,
      totalFeedback,
      popularityScore: Math.round(popularityScore * 100) / 100
    };
  } catch (error) {
    console.error('Error getting venue popularity stats:', error);
    return {
      likes: 0,
      dislikes: 0,
      superLikes: 0,
      skips: 0,
      visited: 0,
      interested: 0,
      notInterested: 0,
      totalFeedback: 0,
      popularityScore: 0
    };
  }
};

/**
 * Get comprehensive feedback insights
 */
export const getFeedbackInsights = async (): Promise<FeedbackInsights | null> => {
  try {
    console.log('Getting feedback insights');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('date_feedback')
      .select('rating, venue_rating, ai_accuracy_rating, would_recommend_venue, would_use_ai_again')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error getting feedback insights:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        average_date_rating: 0,
        average_venue_rating: 0,
        average_ai_accuracy: 0,
        total_feedback_count: 0,
        venue_recommendation_rate: 0,
        ai_usage_rate: 0
      };
    }

    const ratings = data.filter(item => item.rating !== null).map(item => item.rating);
    const venueRatings = data.filter(item => item.venue_rating !== null).map(item => item.venue_rating);
    const aiRatings = data.filter(item => item.ai_accuracy_rating !== null).map(item => item.ai_accuracy_rating);
    const venueRecommendations = data.filter(item => item.would_recommend_venue === true).length;
    const aiUsageAgain = data.filter(item => item.would_use_ai_again === true).length;

    const insights: FeedbackInsights = {
      average_date_rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      average_venue_rating: venueRatings.length > 0 ? venueRatings.reduce((a, b) => a + b, 0) / venueRatings.length : 0,
      average_ai_accuracy: aiRatings.length > 0 ? aiRatings.reduce((a, b) => a + b, 0) / aiRatings.length : 0,
      total_feedback_count: data.length,
      venue_recommendation_rate: data.length > 0 ? (venueRecommendations / data.length) * 100 : 0,
      ai_usage_rate: data.length > 0 ? (aiUsageAgain / data.length) * 100 : 0
    };

    console.log('Feedback insights calculated:', insights);
    return insights;
  } catch (error) {
    console.error('Error in getFeedbackInsights:', error);
    return null;
  }
};

/**
 * Get venue ratings aggregate
 */
export const getVenueRatingsAggregate = async (
  venueId: string
): Promise<{ average_rating: number; total_ratings: number } | null> => {
  try {
    console.log('Getting venue ratings aggregate for:', venueId);
    
    const { data, error } = await supabase
      .from('date_feedback')
      .select('venue_rating')
      .eq('venue_id', venueId)
      .not('venue_rating', 'is', null);

    if (error) {
      console.error('Error getting venue ratings:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { average_rating: 0, total_ratings: 0 };
    }

    const ratings = data.map(item => item.venue_rating);
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    return {
      average_rating: Math.round(average * 100) / 100,
      total_ratings: ratings.length
    };
  } catch (error) {
    console.error('Error in getVenueRatingsAggregate:', error);
    return null;
  }
};

/**
 * Get comprehensive user feedback statistics
 */
export const getUserFeedbackStats = async (): Promise<{
  total_date_feedback: number;
  total_venue_feedback: number;
  average_date_rating: number;
  most_common_feedback_type: string;
  feedback_trends: Record<string, number>;
} | null> => {
  try {
    console.log('Getting user feedback stats');
    
    const [dateFeedback, venueFeedback] = await Promise.all([
      getUserDateFeedback(),
      getUserVenueFeedbackHistory()
    ]);

    const dateRatings = dateFeedback
      .filter(item => item.rating !== null && item.rating !== undefined)
      .map(item => item.rating!);

    const feedbackTypes = venueFeedback.map(item => item.feedback_type);
    const feedbackTypeCounts = feedbackTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonType = Object.keys(feedbackTypeCounts).length > 0 
      ? Object.keys(feedbackTypeCounts).reduce((a, b) => feedbackTypeCounts[a] > feedbackTypeCounts[b] ? a : b)
      : 'none';

    const stats = {
      total_date_feedback: dateFeedback.length,
      total_venue_feedback: venueFeedback.length,
      average_date_rating: dateRatings.length > 0 ? Math.round((dateRatings.reduce((a, b) => a + b, 0) / dateRatings.length) * 100) / 100 : 0,
      most_common_feedback_type: mostCommonType,
      feedback_trends: feedbackTypeCounts
    };

    console.log('User feedback stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error in getUserFeedbackStats:', error);
    return null;
  }
};

// =============================================================================
// ML TRAINING & OPTIMIZATION FUNCTIONS
// =============================================================================

/**
 * Trigger ML model update (background process)
 */
const triggerMLUpdate = async (
  userId: string, 
  venueId: string, 
  feedbackType: FeedbackType
): Promise<void> => {
  try {
    // Log for ML training pipeline
    console.log('ML Update triggered:', {
      userId,
      venueId,
      feedbackType,
      timestamp: new Date().toISOString()
    });

    // Future: Send to ML pipeline
    // await mlService.updateUserPreferences(userId, venueId, feedbackType);
    
  } catch (error) {
    console.error('Error triggering ML update:', error);
  }
};

/**
 * Get user feedback patterns for ML training
 */
export const getUserFeedbackPatterns = async (): Promise<{
  preferred_cuisines: string[];
  preferred_vibes: string[];
  feedback_frequency: number;
  feedback_consistency: number;
} | null> => {
  try {
    const venueFeedback = await getUserVenueFeedbackHistory(200);
    
    if (venueFeedback.length === 0) return null;

    // Analyze patterns
    const positiveFeedback = venueFeedback.filter(f => 
      ['like', 'super_like', 'visited', 'interested'].includes(f.feedback_type)
    );

    // Extract cuisine and vibe preferences from context
    const cuisinePattern = positiveFeedback
      .map(f => f.context?.cuisine_type)
      .filter(Boolean);
    
    const vibePattern = positiveFeedback
      .map(f => f.context?.vibe_type)
      .filter(Boolean);

    // Calculate feedback frequency (feedbacks per week)
    const firstFeedback = new Date(venueFeedback[venueFeedback.length - 1].created_at);
    const latestFeedback = new Date(venueFeedback[0].created_at);
    const weeksDiff = (latestFeedback.getTime() - firstFeedback.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const frequency = weeksDiff > 0 ? venueFeedback.length / weeksDiff : 0;

    // Calculate consistency (how often user gives same feedback type)
    const feedbackTypeCounts = venueFeedback.reduce((acc, f) => {
      acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(feedbackTypeCounts));
    const consistency = maxCount / venueFeedback.length;

    return {
      preferred_cuisines: [...new Set(cuisinePattern)],
      preferred_vibes: [...new Set(vibePattern)],
      feedback_frequency: Math.round(frequency * 100) / 100,
      feedback_consistency: Math.round(consistency * 100) / 100
    };
  } catch (error) {
    console.error('Error analyzing user feedback patterns:', error);
    return null;
  }
};

/**
 * Bulk operations for data migration/import
 */
export const bulkRecordFeedback = async (
  feedbacks: Array<{
    venueId: string;
    feedbackType: FeedbackType;
    context?: FeedbackContext;
  }>
): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const feedbackRecords = feedbacks.map(fb => ({
      user_id: user.id,
      venue_id: fb.venueId,
      feedback_type: fb.feedbackType,
      context: fb.context || {},
    }));

    const { data, error } = await supabase
      .from('user_venue_feedback')
      .upsert(feedbackRecords, {
        onConflict: 'user_id,venue_id'
      })
      .select();

    if (error) throw error;

    console.log(`Bulk recorded ${data?.length || 0} feedback entries`);
    return data?.length || 0;
  } catch (error) {
    console.error('Error bulk recording feedback:', error);
    return 0;
  }
};