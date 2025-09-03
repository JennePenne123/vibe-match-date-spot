import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';

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

export const useCollaborativeSession = (sessionId: string | null) => {
  const { user } = useAuth();
  const [session, setSession] = useState<DatePlanningSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get session details
  const fetchSession = async (id: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useSessionRealtime(
    session,
    (updatedSession) => {
      setSession(updatedSession as DatePlanningSession);
    },
    (score) => {
      if (session) {
        setSession(prev => prev ? { ...prev, ai_compatibility_score: score } : null);
      }
    }
  );

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, user]);

  // Helper functions
  const isUserInitiator = session ? session.initiator_id === user?.id : false;
  const isUserPartner = session ? session.partner_id === user?.id : false;
  const hasUserSetPreferences = session ? 
    (isUserInitiator ? session.initiator_preferences_complete : session.partner_preferences_complete) : false;
  const hasPartnerSetPreferences = session ? 
    (isUserInitiator ? session.partner_preferences_complete : session.initiator_preferences_complete) : false;
  const canShowResults = session?.both_preferences_complete || false;

  // Debug logging for state synchronization
  console.log('🔧 COLLABORATIVE SESSION DEBUG:', {
    sessionId: session?.id,
    userId: user?.id,
    isUserInitiator,
    isUserPartner,
    initiatorPrefsComplete: session?.initiator_preferences_complete,
    partnerPrefsComplete: session?.partner_preferences_complete,
    bothPrefsComplete: session?.both_preferences_complete,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    databaseFlags: {
      initiator_preferences_complete: session?.initiator_preferences_complete,
      partner_preferences_complete: session?.partner_preferences_complete,
      both_preferences_complete: session?.both_preferences_complete
    }
  });

  return {
    session,
    loading,
    error,
    isUserInitiator,
    isUserPartner,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    refetchSession: () => sessionId ? fetchSession(sessionId) : Promise.resolve()
  };
};