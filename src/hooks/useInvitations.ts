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
  direction: 'received' | 'sent';
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
const extractVenueFromMessage = (message: string, fallback: string): string => {
  if (fallback === 'Selected Venue' || fallback === 'Venue TBD') {
    const venueMatch = message.match(/take you to ([^\.]+?) based on/i);
    if (venueMatch) {
      return venueMatch[1].trim();
    }
  }
  return fallback;
};

// Helper function to extract venue data from AI fields
const extractVenueFromAIData = (invitation: any): { name: string; address: string; image_url?: string; photos: any[] } => {
  const extractedNameFromMessage = extractVenueFromMessage(invitation.message || '', '');
  const extractedName = extractedNameFromMessage || invitation.title || 'AI Recommended Venue';
  
  let venuePhotos: any[] = [];
  let venueImage: string | undefined;
  let actualName = extractedName;
  let actualAddress = 'AI Recommended Location';
  
  if (invitation.venue_match_factors) {
    const venueData = invitation.venue_match_factors;
    actualName = venueData.venue_name || venueData.name || extractedName;
    actualAddress = venueData.venue_address || venueData.address || venueData.location || 'AI Recommended Location';
    venueImage = venueData.venue_image || venueData.image_url || venueData.image;
    
    if (venueData.venue_photos && Array.isArray(venueData.venue_photos)) {
      venuePhotos = venueData.venue_photos;
    } else if (venueData.photos && Array.isArray(venueData.photos)) {
      venuePhotos = venueData.photos;
    }
  }
  
  return {
    name: actualName,
    address: actualAddress,
    image_url: venueImage,
    photos: venuePhotos
  };
};

// Helper function to enrich invitation with venue data
const enrichInvitationWithVenue = async (invitation: any): Promise<any> => {
  if (!invitation.venue_id) {
    return null;
  }

  // First try to get from database
  const { data: dbVenue } = await supabase
    .from('venues')
    .select('*')
    .eq('id', invitation.venue_id)
    .maybeSingle();
    
  if (dbVenue) {
    return {
      name: dbVenue.name,
      address: dbVenue.address,
      image_url: dbVenue.image_url,
      photos: dbVenue.photos || [],
      rating: dbVenue.rating,
      price_range: dbVenue.price_range,
      cuisine_type: dbVenue.cuisine_type
    };
  }
  
  // For temporary venue IDs, extract from AI data
  if (invitation.venue_id?.startsWith('venue_')) {
    return extractVenueFromAIData(invitation);
  }
  
  // Fallback: extract from message
  const extractedName = extractVenueFromMessage(invitation.message || '', 'Venue TBD');
  return {
    name: extractedName,
    address: 'Address TBD',
    image_url: undefined,
    photos: []
  };
};

export const useInvitations = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [invitations, setInvitations] = useState<DateInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch received and sent invitations in parallel
      const [receivedResult, sentResult] = await Promise.all([
        supabase
          .from('date_invitations')
          .select(`*, sender:profiles!sender_id(name, email, avatar_url)`)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('date_invitations')
          .select(`*, recipient:profiles!recipient_id(name, email, avatar_url)`)
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (receivedResult.error) throw receivedResult.error;
      if (sentResult.error) throw sentResult.error;

      // Enrich invitations with venue data
      const [enrichedReceived, enrichedSent] = await Promise.all([
        Promise.all((receivedResult.data || []).map(async invitation => ({
          ...invitation,
          direction: 'received' as const,
          venue: await enrichInvitationWithVenue(invitation)
        }))),
        Promise.all((sentResult.data || []).map(async invitation => ({
          ...invitation,
          direction: 'sent' as const,
          venue: await enrichInvitationWithVenue(invitation)
        })))
      ]);

      // Combine and sort by created_at
      const allInvitations = [...enrichedReceived, ...enrichedSent]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setInvitations(allInvitations);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      handleError(new Error('Failed to load invitations'), {
        toastTitle: 'Failed to load invitations',
        toastDescription: 'Please try refreshing the page',
      });
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // Real-time subscription handlers
  const handleInvitationReceived = useCallback(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInvitationUpdated = useCallback(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useRealtimeInvitations({
    onInvitationReceived: handleInvitationReceived,
    onInvitationUpdated: handleInvitationUpdated,
  });

  const acceptInvitation = async (invitationId: string) => {
    try {
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
          inv.id === invitationId ? { ...inv, status: 'accepted' as const } : inv
        )
      );

      if (invitation?.sender_id) {
        await createNotificationForSender(invitation.sender_id, {
          type: 'invitation_accepted',
          message: `${user?.email?.split('@')[0] || 'Your friend'} accepted your date invitation!`,
          invitationId,
          venueName: invitation.venue?.name
        });
      }
    } catch (error) {
      handleError(new Error('Failed to accept invitation'), {
        toastTitle: 'Failed to accept invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
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

      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'declined' as const } : inv
        )
      );

      if (invitation?.sender_id) {
        await createNotificationForSender(invitation.sender_id, {
          type: 'invitation_declined',
          message: `Your date invitation was declined.`,
          invitationId,
          venueName: invitation.venue?.name
        });
      }
    } catch (error) {
      handleError(new Error('Failed to decline invitation'), {
        toastTitle: 'Failed to decline invitation',
        toastDescription: 'Please try again',
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      const { error } = await supabase
        .from('date_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        handleError(error, {
          toastTitle: 'Failed to cancel date',
          toastDescription: 'Please try again',
        });
        return;
      }

      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
        )
      );

      const otherPersonId = invitation?.sender_id === user?.id 
        ? invitation?.recipient_id 
        : invitation?.sender_id;
      
      if (otherPersonId) {
        await createNotificationForSender(otherPersonId, {
          type: 'invitation_cancelled',
          message: `The date at ${invitation?.venue?.name || 'the venue'} has been cancelled.`,
          invitationId,
          venueName: invitation?.venue?.name
        });
      }
    } catch (error) {
      handleError(new Error('Failed to cancel date'), {
        toastTitle: 'Failed to cancel date',
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
      venue_data?: any;
    }
  ) => {
    if (!user) return false;

    try {
      let finalVenueId = venueId;
      
      // If we have venue data from AI recommendations, save it to database first
      if (aiData?.venue_data && venueId.startsWith('venue_')) {
        const venueToSave = {
          name: aiData.venue_data.name || aiData.venue_data.venue_name || 'Unknown Venue',
          address: aiData.venue_data.address || aiData.venue_data.venue_address || aiData.venue_data.location || aiData.venue_data.vicinity || 'Address not available',
          google_place_id: aiData.venue_data.place_id || aiData.venue_data.venue_id,
          rating: aiData.venue_data.rating || null,
          price_range: aiData.venue_data.price_range || aiData.venue_data.priceRange || '$$',
          cuisine_type: aiData.venue_data.cuisine_type || aiData.venue_data.cuisineType || 'Restaurant',
          phone: aiData.venue_data.phone || null,
          opening_hours: aiData.venue_data.opening_hours || aiData.venue_data.operatingHours || null,
          image_url: aiData.venue_data.image_url || aiData.venue_data.venue_image || aiData.venue_data.image,
          photos: aiData.venue_data.photos || aiData.venue_data.venue_photos || [],
          tags: aiData.venue_data.tags || aiData.venue_data.amenities || [],
          is_active: true
        };

        const { data: savedVenue, error: venueError } = await supabase
          .from('venues')
          .insert(venueToSave)
          .select('id')
          .single();

        if (!venueError && savedVenue) {
          finalVenueId = savedVenue.id;
        }
      }

      const { data, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          venue_id: finalVenueId,
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

  // Placeholder notification helpers
  const createNotificationForSender = async (senderId: string, notification: any) => {
    console.log('Notification for sender:', senderId, notification.type);
  };

  const createNotificationForRecipient = async (recipientId: string, notification: any) => {
    console.log('Notification for recipient:', recipientId, notification.type);
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    sendInvitation,
    submitDateFeedback,
    fetchInvitations
  };
};
