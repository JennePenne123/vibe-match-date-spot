
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

    // Create unique channel name to prevent conflicts with collaborative session
    const channelName = `session-realtime-${currentSession.id}`;
    console.log('Setting up session realtime subscription for session:', currentSession.id, 'with channel:', channelName);
    
    let isSubscribed = true; // Flag to prevent updates after unmount
    
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
