
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';

interface DatePlanningSession {
  id: string;
  initiator_id: string;
  partner_id: string;
  session_status: 'active' | 'completed' | 'expired';
  preferences_data?: any;
  initiator_preferences?: any;
  partner_preferences?: any;
  ai_compatibility_score?: number;
  selected_venue_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  initiator_preferences_complete: boolean;
  partner_preferences_complete: boolean;
  both_preferences_complete: boolean;
  planning_mode: string;
}

export const useSessionRealtime = (
  currentSession: DatePlanningSession | null,
  onSessionUpdate: (session: DatePlanningSession) => void,
  onCompatibilityUpdate: (score: number) => void
) => {
  useEffect(() => {
    if (!currentSession) return;

    // Create unique channel name to prevent conflicts (and StrictMode double-mount)
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);
    const channelName = `${currentSession.initiator_id}:session-realtime-${currentSession.id}-${uniqueSuffix}`;
    console.log('Setting up session realtime subscription for session:', currentSession.id, 'with channel:', channelName);
    
    let isSubscribed = true; // Flag to prevent updates after unmount
    let previousBothComplete = currentSession.both_preferences_complete === true;
    let notified = previousBothComplete;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_planning_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          try {
            if (!isSubscribed) {
              console.log('Ignoring real-time update - component unmounted');
              return;
            }
            
            console.log('Planning session updated via realtime:', payload);
            const updatedSession = payload.new as DatePlanningSession;
            
            // Defensive update calls
            if (onSessionUpdate && typeof onSessionUpdate === 'function') {
              onSessionUpdate(updatedSession);
            }
            
            // Update compatibility score if changed
            if (updatedSession.ai_compatibility_score && onCompatibilityUpdate && typeof onCompatibilityUpdate === 'function') {
              onCompatibilityUpdate(updatedSession.ai_compatibility_score);
            }

            // In-app notification when both participants finished preferences
            if (!notified && updatedSession.both_preferences_complete === true && !previousBothComplete) {
              notified = true;
              const t = i18n.t.bind(i18n);
              toast.success(t('datePlanning.allPrefsReadyTitle'), {
                description: t('datePlanning.allPrefsReadyDesc'),
                duration: 6000,
              });

              // Best-effort push to the counterpart participant
              void (async () => {
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  const uid = userData?.user?.id;
                  if (!uid) return;
                  const counterpartId =
                    uid === updatedSession.initiator_id
                      ? updatedSession.partner_id
                      : updatedSession.initiator_id;
                  if (!counterpartId || counterpartId === uid) return;
                  await supabase.functions.invoke('send-push-notification', {
                    body: {
                      userId: counterpartId,
                      title: t('datePlanning.allPrefsReadyTitle'),
                      body: t('datePlanning.allPrefsReadyDesc'),
                      url: `/smart-date-planning?sessionId=${updatedSession.id}`,
                      type: 'invitation_accepted',
                    },
                  });
                } catch (err) {
                  console.warn('Push notification for prefs-complete failed (non-fatal):', err);
                }
              })();
            }
            previousBothComplete = updatedSession.both_preferences_complete === true;
          } catch (error) {
            console.error('Error handling real-time session update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removing real-time subscription:', channelName);
      isSubscribed = false;
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error removing real-time channel:', error);
      }
    };
  }, [currentSession?.id]); // Simplified dependencies
};
