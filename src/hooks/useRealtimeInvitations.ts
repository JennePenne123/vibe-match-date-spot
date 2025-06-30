
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeInvitationsProps {
  onInvitationReceived: () => void;
  onInvitationUpdated: () => void;
}

export const useRealtimeInvitations = ({ onInvitationReceived, onInvitationUpdated }: RealtimeInvitationsProps) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create a channel for real-time updates
    const channel = supabase
      .channel('date-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'date_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New invitation received:', payload);
          onInvitationReceived();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Invitation updated:', payload);
          onInvitationUpdated();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, onInvitationReceived, onInvitationUpdated]);

  return null;
};
