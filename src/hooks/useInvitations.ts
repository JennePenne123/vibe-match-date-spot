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
  direction: 'received' | 'sent'; // New field to track direction
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
  recipient?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  venue?: {
    name: string;
    address: string;
    image_url?: string;
    photos?: Array<{
      url: string;
      thumbnail?: string;
      width: number;
      height: number;
      attribution?: string;
      isGooglePhoto: boolean;
    }>;
    rating?: number;
    price_range?: string;
    cuisine_type?: string;
  };
}

// Helper function to extract venue name from message
const extractVenueFromMessage = (message: string, fallback: string) => {
  if (fallback === 'Selected Venue' || fallback === 'Venue TBD') {
    // Try to extract venue name from message like "I'd love to take you to Il Siciliano based on..."
    const venueMatch = message.match(/take you to ([^\.]+?) based on/i);
    if (venueMatch) {
      return venueMatch[1].trim();
    }
  }
  return fallback;
};

export const useInvitations = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [invitations, setInvitations] = useState<DateInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!user) {
      console.log('🚨 FETCH INVITATIONS - No user, skipping fetch');
      return;
    }

    console.log('🔄 FETCH INVITATIONS - Starting fetch for user:', user.id);
    setLoading(true);
    try {
      // Fetch received invitations (where user is recipient)
      const { data: receivedData, error: receivedError } = await supabase
        .from('date_invitations')
        .select(`
          *,
          sender:profiles!sender_id(name, email, avatar_url)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch sent invitations (where user is sender)
      const { data: sentData, error: sentError } = await supabase
        .from('date_invitations')
        .select(`
          *,
          recipient:profiles!recipient_id(name, email, avatar_url)
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      console.log('✅ FETCH INVITATIONS - Success:', {
        receivedCount: receivedData?.length || 0,
        sentCount: sentData?.length || 0,
        totalCount: (receivedData?.length || 0) + (sentData?.length || 0)
      });

      // Enrich and combine invitations with real venue data
      const enrichedReceived = await Promise.all((receivedData || []).map(async invitation => {
        let venue = null;
        
        if (invitation.venue_id) {
          // First try to get from database
          const { data: dbVenue } = await supabase
            .from('venues')
            .select('*')
            .eq('id', invitation.venue_id)
            .single();
            
          if (dbVenue) {
            venue = {
              name: dbVenue.name,
              address: dbVenue.address,
              image_url: dbVenue.image_url,
              photos: dbVenue.photos || [],
              rating: dbVenue.rating,
              price_range: dbVenue.price_range,
              cuisine_type: dbVenue.cuisine_type
            };
          } else {
            // If venue not in database, try to extract from message
            const extractedName = extractVenueFromMessage(invitation.message || '', 'Venue TBD');
            venue = {
              name: extractedName,
              address: 'Address TBD',
              image_url: undefined,
              photos: []
            };
          }
        }
        
        return {
          ...invitation,
          direction: 'received' as const,
          venue
        };
      }));

      const enrichedSent = await Promise.all((sentData || []).map(async invitation => {
        let venue = null;
        
        if (invitation.venue_id) {
          // First try to get from database
          const { data: dbVenue } = await supabase
            .from('venues')
            .select('*')
            .eq('id', invitation.venue_id)
            .single();
            
          if (dbVenue) {
            venue = {
              name: dbVenue.name,
              address: dbVenue.address,
              image_url: dbVenue.image_url,
              photos: dbVenue.photos || [],
              rating: dbVenue.rating,
              price_range: dbVenue.price_range,
              cuisine_type: dbVenue.cuisine_type
            };
          } else {
            // If venue not in database, try to extract from message
            const extractedName = extractVenueFromMessage(invitation.message || '', 'Venue TBD');
            venue = {
              name: extractedName,
              address: 'Address TBD',
              image_url: undefined,
              photos: []
            };
          }
        }
        
        return {
          ...invitation,
          direction: 'sent' as const,
          venue
        };
      }));

      // Combine and sort by created_at
      const allInvitations = [...enrichedReceived, ...enrichedSent]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setInvitations(allInvitations);
    } catch (error) {
      console.error('🚨 FETCH INVITATIONS - Catch error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      handleError(new Error(`Failed to load invitations: ${errorMessage}`), {
        toastTitle: 'Failed to load invitations',
        toastDescription: 'Please try refreshing the page',
      });
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // Real-time subscription handlers
  const handleInvitationReceived = useCallback(() => {
    console.log('🔔 REALTIME - New invitation received, refreshing list');
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInvitationUpdated = useCallback(() => {
    console.log('🔔 REALTIME - Invitation updated, refreshing list');
    fetchInvitations();
  }, [fetchInvitations]);

  // Set up real-time subscriptions
  useRealtimeInvitations({
    onInvitationReceived: handleInvitationReceived,
    onInvitationUpdated: handleInvitationUpdated,
  });

  const acceptInvitation = async (invitationId: string) => {
    console.log('✅ ACCEPT INVITATION - Starting for ID:', invitationId);
    try {
      // Get invitation details for enhanced feedback
      const invitation = invitations.find(inv => inv.id === invitationId);
      console.log('✅ ACCEPT INVITATION - Found invitation:', !!invitation);
      
      const { error } = await supabase
        .from('date_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (error) {
        console.error('🚨 ACCEPT INVITATION - Database error:', error);
        handleError(error, {
          toastTitle: 'Failed to accept invitation',
          toastDescription: 'Please try again',
        });
        return;
      }

      console.log('✅ ACCEPT INVITATION - Database update successful');

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
      console.error('🚨 ACCEPT INVITATION - Catch error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      handleError(new Error(`Failed to accept invitation: ${errorMessage}`), {
        toastTitle: 'Failed to accept invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    console.log('❌ DECLINE INVITATION - Starting for ID:', invitationId);
    try {
      // Get invitation details for enhanced feedback
      const invitation = invitations.find(inv => inv.id === invitationId);
      console.log('❌ DECLINE INVITATION - Found invitation:', !!invitation);
      
      const { error } = await supabase
        .from('date_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        console.error('🚨 DECLINE INVITATION - Database error:', error);
        handleError(error, {
          toastTitle: 'Failed to decline invitation',
          toastDescription: 'Please try again',
        });
        return;
      }

      console.log('❌ DECLINE INVITATION - Database update successful');

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
      console.error('🚨 DECLINE INVITATION - Catch error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      handleError(new Error(`Failed to decline invitation: ${errorMessage}`), {
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
    console.log('📬 Notification for sender:', senderId, notification);
  };

  // Helper function to create notifications for recipient  
  const createNotificationForRecipient = async (recipientId: string, notification: any) => {
    // This could be enhanced with a proper notifications table
    // For now, we'll use real-time updates to show toasts
    console.log('📬 Notification for recipient:', recipientId, notification);
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
