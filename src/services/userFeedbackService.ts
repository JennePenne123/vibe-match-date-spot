
import { supabase } from '@/integrations/supabase/client';

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
  feedback_type: 'like' | 'dislike' | 'visited' | 'interested' | 'not_interested';
  context?: any;
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
  feedback_type: string;
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

// Date Feedback Functions
export const createDateFeedback = async (
  feedbackData: DateFeedbackData
): Promise<DateFeedback | null> => {
  try {
    console.log('Creating date feedback:', feedbackData);
    
    const { data, error } = await supabase
      .from('date_feedback')
      .insert({
        ...feedbackData,
        user_id: (await supabase.auth.getUser()).data.user?.id
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
    
    const { data, error } = await supabase
      .from('date_feedback')
      .select('*')
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

// Venue Feedback Functions
export const createVenueFeedback = async (
  feedbackData: VenueFeedbackData
): Promise<VenueFeedback | null> => {
  try {
    console.log('Creating venue feedback:', feedbackData);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      console.error('No authenticated user found');
      return null;
    }

    // Check if feedback already exists for this user-venue combination
    const { data: existingFeedback } = await supabase
      .from('user_venue_feedback')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('venue_id', feedbackData.venue_id)
      .eq('feedback_type', feedbackData.feedback_type)
      .maybeSingle();

    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('user_venue_feedback')
        .update({
          context: feedbackData.context,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating venue feedback:', error);
        throw error;
      }

      return data;
    } else {
      // Create new feedback
      const { data, error } = await supabase
        .from('user_venue_feedback')
        .insert({
          ...feedbackData,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating venue feedback:', error);
        throw error;
      }

      console.log('Venue feedback created successfully:', data);
      return data;
    }
  } catch (error) {
    console.error('Error in createVenueFeedback:', error);
    return null;
  }
};

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

export const getUserVenueFeedback = async (): Promise<VenueFeedback[]> => {
  try {
    console.log('Getting user venue feedback');
    
    const { data, error } = await supabase
      .from('user_venue_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user venue feedback:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserVenueFeedback:', error);
    return [];
  }
};

export const removeVenueFeedback = async (
  venueId: string,
  feedbackType: string
): Promise<boolean> => {
  try {
    console.log('Removing venue feedback:', { venueId, feedbackType });
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('user_venue_feedback')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('venue_id', venueId)
      .eq('feedback_type', feedbackType);

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

// Analytics Functions
export const getFeedbackInsights = async (): Promise<FeedbackInsights | null> => {
  try {
    console.log('Getting feedback insights');
    
    const { data, error } = await supabase
      .from('date_feedback')
      .select('rating, venue_rating, ai_accuracy_rating, would_recommend_venue, would_use_ai_again');

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
      average_rating: average,
      total_ratings: ratings.length
    };
  } catch (error) {
    console.error('Error in getVenueRatingsAggregate:', error);
    return null;
  }
};

export const getUserFeedbackStats = async (): Promise<{
  total_date_feedback: number;
  total_venue_feedback: number;
  average_date_rating: number;
  most_common_feedback_type: string;
} | null> => {
  try {
    console.log('Getting user feedback stats');
    
    const [dateFeedback, venueFeedback] = await Promise.all([
      getUserDateFeedback(),
      getUserVenueFeedback()
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
      average_date_rating: dateRatings.length > 0 ? dateRatings.reduce((a, b) => a + b, 0) / dateRatings.length : 0,
      most_common_feedback_type: mostCommonType
    };

    console.log('User feedback stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error in getUserFeedbackStats:', error);
    return null;
  }
};
