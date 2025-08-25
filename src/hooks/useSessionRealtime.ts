
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

    console.log('Setting up real-time subscription for session:', currentSession.id);
    
    const channel = supabase
      .channel(`planning-session-${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_planning_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          console.log('Planning session updated via realtime:', payload);
          const updatedSession = payload.new as DatePlanningSession;
          onSessionUpdate(updatedSession);
          
          // Update compatibility score if changed
          if (updatedSession.ai_compatibility_score) {
            onCompatibilityUpdate(updatedSession.ai_compatibility_score);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removing real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentSession?.id, onSessionUpdate, onCompatibilityUpdate]);
};
