
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

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a unique channel name to prevent conflicts
    const channelName = `date-invitations-${user.id}-${Date.now()}`;
    
// Create a channel for real-time updates
    const channel = supabase
      .channel(channelName)
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'date_proposals',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New date proposal received:', payload);
          onInvitationReceived();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_proposals',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Date proposal updated:', payload);
          onInvitationUpdated();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-subscriptions

  return null;
};
