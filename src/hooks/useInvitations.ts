
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeInvitations } from './useRealtimeInvitations';
import { useErrorHandler } from './useErrorHandler';

interface DateInvitation {
  id: string;
  sender_id: string;
  recipient_id: string;
  venue_id?: string;
  title: string;
  message?: string;
  proposed_date?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  // Enhanced AI fields
  ai_compatibility_score?: number;
  ai_reasoning?: string;
  venue_match_factors?: any;
  ai_generated_message?: string;
  planning_session_id?: string;
  sender?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  venue?: {
    name: string;
    address: string;
    image_url?: string;
  };
}

export const useInvitations = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [invitations, setInvitations] = useState<DateInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('date_invitations')
        .select(`
          *,
          sender:profiles!sender_id(name, email, avatar_url),
          venue:venues(name, address, image_url)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to load invitations',
          toastDescription: 'Please try refreshing the page',
        });
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to load invitations',
        toastDescription: 'Please try refreshing the page',
      });
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // Real-time subscription handlers
  const handleInvitationReceived = useCallback(() => {
    console.log('New invitation received - refreshing list');
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInvitationUpdated = useCallback(() => {
    console.log('Invitation updated - refreshing list');
    fetchInvitations();
  }, [fetchInvitations]);

  // Set up real-time subscriptions
  useRealtimeInvitations({
    onInvitationReceived: handleInvitationReceived,
    onInvitationUpdated: handleInvitationUpdated,
  });

  const acceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('date_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to accept invitation',
          toastDescription: 'Please try again',
        });
        return;
      }

      // Update local state optimistically
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'accepted' as const }
            : inv
        )
      );
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to accept invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('date_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to decline invitation',
          toastDescription: 'Please try again',
        });
        return;
      }

      // Update local state optimistically
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'declined' as const }
            : inv
        )
      );
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to decline invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const sendInvitation = async (recipientId: string, venueId: string, title: string, message?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          venue_id: venueId,
          title,
          message,
          status: 'pending'
        });

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to send invitation',
          toastDescription: 'Please try again',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to send invitation',
        toastDescription: 'Please try again',
      });
      return false;
    }
  };

  // Submit date feedback after a date
  const submitDateFeedback = async (
    invitationId: string, 
    rating: number,
    venueRating: number,
    aiAccuracyRating: number,
    feedbackText?: string,
    wouldRecommendVenue?: boolean,
    wouldUseAiAgain?: boolean
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('date_feedback')
        .insert({
          invitation_id: invitationId,
          user_id: user.id,
          rating,
          venue_rating: venueRating,
          ai_accuracy_rating: aiAccuracyRating,
          feedback_text: feedbackText,
          would_recommend_venue: wouldRecommendVenue,
          would_use_ai_again: wouldUseAiAgain
        });

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to submit feedback',
          toastDescription: 'Please try again',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to submit feedback',
        toastDescription: 'Please try again',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    acceptInvitation,
    declineInvitation,
    sendInvitation,
    submitDateFeedback,
    fetchInvitations
  };
};
