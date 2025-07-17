import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSystemProps {
  children: React.ReactNode;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Listen for invitation responses (for senders)
    const senderChannel = supabase
      .channel('invitation-responses')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_invitations',
          filter: `sender_id=eq.${user.id}`,
        },
        async (payload) => {
          const { new: newInvitation, old: oldInvitation } = payload;
          
          // Only show notification when status changes
          if (newInvitation.status !== oldInvitation.status) {
            // Get recipient name for better messaging
            const { data: recipient } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', newInvitation.recipient_id)
              .single();

            const recipientName = recipient?.name || 'Your friend';

            if (newInvitation.status === 'accepted') {
              toast({
                title: "Date Accepted! 🎉",
                description: `${recipientName} accepted your date invitation! Time to start planning the details.`,
                duration: 8000,
              });
            } else if (newInvitation.status === 'declined') {
              toast({
                title: "Invitation Response 💙",
                description: `${recipientName} isn't available for this date. Don't worry - maybe try a different time or venue!`,
                duration: 6000,
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for new invitations (for recipients)
    const recipientChannel = supabase
      .channel('new-invitations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'date_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const { new: newInvitation } = payload;
          
          // Get sender name for better messaging
          const { data: sender } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', newInvitation.sender_id)
            .single();

          const senderName = sender?.name || 'A friend';

          toast({
            title: "New Date Invitation! 💌",
            description: `${senderName} sent you a date invitation. Check it out and respond!`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(senderChannel);
      supabase.removeChannel(recipientChannel);
    };
  }, [user, toast]);

  return <>{children}</>;
};

export default NotificationSystem;