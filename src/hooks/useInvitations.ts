
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeInvitations } from './useRealtimeInvitations';

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
        console.error('Error fetching invitations:', error);
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
        console.error('Error accepting invitation:', error);
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
      console.error('Error accepting invitation:', error);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('date_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error declining invitation:', error);
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
      console.error('Error declining invitation:', error);
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
        console.error('Error sending invitation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
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
    fetchInvitations
  };
};
