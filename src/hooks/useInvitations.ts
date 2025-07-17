
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
      // Get invitation details for enhanced feedback
      const invitation = invitations.find(inv => inv.id === invitationId);
      
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

      // Create notification for sender about acceptance
      if (invitation?.sender_id) {
        await createNotificationForSender(invitation.sender_id, {
          type: 'invitation_accepted',
          message: `${user?.email?.split('@')[0] || 'Your friend'} accepted your date invitation!`,
          invitationId,
          venueName: invitation.venue?.name
        });
      }
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to accept invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      // Get invitation details for enhanced feedback
      const invitation = invitations.find(inv => inv.id === invitationId);
      
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

      // Create notification for sender about decline
      if (invitation?.sender_id) {
        await createNotificationForSender(invitation.sender_id, {
          type: 'invitation_declined',
          message: `Your date invitation was declined. Don't worry, there are plenty of other opportunities!`,
          invitationId,
          venueName: invitation.venue?.name
        });
      }
    } catch (error) {
      handleError(error, {
        toastTitle: 'Failed to decline invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const sendInvitation = async (
    recipientId: string, 
    venueId: string, 
    title: string, 
    message?: string,
    aiData?: {
      compatibility_score?: number;
      ai_reasoning?: string;
      venue_match_factors?: any;
      planning_session_id?: string;
    }
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          venue_id: venueId,
          title,
          message,
          status: 'pending',
          ai_compatibility_score: aiData?.compatibility_score,
          ai_reasoning: aiData?.ai_reasoning,
          venue_match_factors: aiData?.venue_match_factors,
          planning_session_id: aiData?.planning_session_id
        })
        .select()
        .single();

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to send invitation',
          toastDescription: 'Please try again',
        });
        return false;
      }

      // Get recipient info for notification
      const { data: recipientData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', recipientId)
        .single();

      // Create notification for recipient
      await createNotificationForRecipient(recipientId, {
        type: 'invitation_received',
        message: `You have a new date invitation from ${user.email?.split('@')[0] || 'a friend'}!`,
        invitationId: data.id,
        senderName: user.email?.split('@')[0] || 'Friend'
      });

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

  // Helper function to create notifications for sender
  const createNotificationForSender = async (senderId: string, notification: any) => {
    // This could be enhanced with a proper notifications table
    // For now, we'll use real-time updates to show toasts
    console.log('Notification for sender:', senderId, notification);
  };

  // Helper function to create notifications for recipient  
  const createNotificationForRecipient = async (recipientId: string, notification: any) => {
    // This could be enhanced with a proper notifications table
    // For now, we'll use real-time updates to show toasts
    console.log('Notification for recipient:', recipientId, notification);
  };

  // Create test invitation data for development
  const createTestInvitation = async () => {
    if (!user) return false;

    try {
      // Get current user's friends for test data
      const { data: friends } = await supabase
        .from('friendships')
        .select('friend_id, profiles!friend_id(name)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .limit(1);

      if (!friends || friends.length === 0) {
        console.log('No friends found for test invitation');
        return false;
      }

      // Get a venue for test data
      const { data: venues } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (!venues || venues.length === 0) {
        console.log('No venues found for test invitation');
        return false;
      }

      const testInvitation = {
        sender_id: friends[0].friend_id, // Friend sends to current user
        recipient_id: user.id,
        venue_id: venues[0].id,
        title: 'Dinner & Drinks',
        message: 'Hey! I found this amazing place that I think you\'d love. Want to check it out together? 😊',
        status: 'pending' as const,
        ai_compatibility_score: 87,
        ai_reasoning: 'Based on your shared love for Italian cuisine and cozy atmospheres, this venue is a perfect match!',
        venue_match_factors: {
          cuisine_match: 0.9,
          vibe_match: 0.85,
          price_match: 0.8
        },
        proposed_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      };

      const { error } = await supabase
        .from('date_invitations')
        .insert(testInvitation);

      if (error) {
        console.error('Failed to create test invitation:', error);
        return false;
      }

      console.log('Test invitation created successfully');
      fetchInvitations(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error creating test invitation:', error);
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
    fetchInvitations,
    createTestInvitation
  };
};
