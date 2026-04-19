import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface NotificationSystemProps {
  children: React.ReactNode;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const channelSuffix = Date.now();

    // Listen for invitation responses (for senders)
    const senderChannel = supabase
      .channel(`${user.id}:invitation-responses-${channelSuffix}`)
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
            const { data: recipient } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', newInvitation.recipient_id)
              .single();

            const recipientName = recipient?.name || t('common.friend', 'Your friend');

            if (newInvitation.status === 'accepted') {
              toast({
                title: t('notifications.inviteAccepted'),
                description: t('notifications.inviteAcceptedDesc', { name: recipientName }),
                duration: 8000,
                action: (
                  <ToastAction altText={t('notifications.actionView')} onClick={() => navigate('/invitations')}>
                    {t('notifications.actionView')}
                  </ToastAction>
                ),
              });
            } else if (newInvitation.status === 'declined') {
              toast({
                title: t('notifications.inviteResponse'),
                description: t('notifications.inviteDeclinedDesc', { name: recipientName }),
                duration: 6000,
                action: (
                  <ToastAction altText={t('notifications.actionPlanNew')} onClick={() => navigate('/smart-date-planning')}>
                    {t('notifications.actionPlanNew')}
                  </ToastAction>
                ),
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for new invitations (for recipients)
    const recipientChannel = supabase
      .channel(`${user.id}:new-invitations-${channelSuffix}`)
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
          
          const { data: sender } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', newInvitation.sender_id)
            .single();

          const senderName = sender?.name || t('common.friend', 'A friend');

          toast({
            title: t('notifications.newInvite'),
            description: t('notifications.newInviteDesc', { name: senderName }),
            duration: 8000,
            action: (
              <ToastAction altText={t('notifications.actionView')} onClick={() => navigate('/invitations')}>
                {t('notifications.actionView')}
              </ToastAction>
            ),
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up notification channels');
      supabase.removeChannel(senderChannel);
      supabase.removeChannel(recipientChannel);
    };
  }, [user?.id, toast, navigate, t]);

  return <>{children}</>;
};

export default NotificationSystem;
