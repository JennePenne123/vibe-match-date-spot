import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AIVenueRecommendation } from '@/services/aiVenueService/recommendations';

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

export const useCollaborativeSession = (sessionId: string | null, userLocation?: { latitude: number; longitude: number; address?: string } | null) => {
  const { user } = useAuth();
  const [session, setSession] = useState<DatePlanningSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysisTriggered, setAiAnalysisTriggered] = useState(false);
  const [sessionVenueRecommendations, setSessionVenueRecommendations] = useState<AIVenueRecommendation[]>([]);
  
  const { 
    analyzeCompatibilityAndVenues, 
    resetAIState, 
    compatibilityScore: aiCompatibilityScore,
    venueRecommendations: aiVenueRecommendations,
    venueSearchError: aiVenueSearchError,
    isAnalyzing 
  } = useAIAnalysis();

  // Get session details with validation
  const fetchSession = useCallback(async (id: string, forceRefresh = false) => {
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

      // Enhanced validation: Check for preference data consistency
      const hasInitiatorPrefsData = !!data.initiator_preferences;
      const hasPartnerPrefsData = !!data.partner_preferences;
      
      let needsUpdate = false;
      const updates: any = {};

      // Fix initiator flag if inconsistent
      if (data.initiator_preferences_complete && !hasInitiatorPrefsData) {
        updates.initiator_preferences_complete = false;
        needsUpdate = true;
      }

      // Fix partner flag if inconsistent  
      if (data.partner_preferences_complete && !hasPartnerPrefsData) {
        updates.partner_preferences_complete = false;
        needsUpdate = true;
      }

      // Recalculate both_preferences_complete
      if (!updates.hasOwnProperty('both_preferences_complete')) {
        const correctBothComplete = 
          (data.initiator_preferences_complete && hasInitiatorPrefsData) &&
          (data.partner_preferences_complete && hasPartnerPrefsData);

        if (data.both_preferences_complete !== correctBothComplete) {
          updates.both_preferences_complete = correctBothComplete;
          needsUpdate = true;
        }
      }

      // Apply fixes if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('date_planning_sessions')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (!updateError) {
          Object.assign(data, updates);
        }
      }

      setSession(data);
      
      // Trigger AI analysis if conditions are met
      await triggerAIAnalysisIfReady(data);
    } catch (err) {
      console.error('SESSION: Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [user, userLocation, aiAnalysisTriggered]);

  // Automatic AI Analysis Trigger Function
  const triggerAIAnalysisIfReady = useCallback(async (sessionData: DatePlanningSession) => {
    if (!user || !sessionData) return;
    
    const shouldTriggerAI = 
      sessionData.both_preferences_complete && 
      !sessionData.ai_compatibility_score && 
      !aiAnalysisTriggered;
    
    if (shouldTriggerAI) {
      setAiAnalysisTriggered(true);
      
      try {
        const partnerId = sessionData.initiator_id === user.id 
          ? sessionData.partner_id 
          : sessionData.initiator_id;
        
        const { data: userPrefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (userPrefs) {
          const locationForAnalysis = userLocation || {
            latitude: 37.7749,
            longitude: -122.4194,
            address: 'San Francisco, CA (fallback)'
          };
          
          await analyzeCompatibilityAndVenues(
            sessionData.id,
            partnerId,
            userPrefs,
            locationForAnalysis
          );
        }
      } catch (error) {
        console.error('SESSION: AI Analysis failed:', error);
        setAiAnalysisTriggered(false);
      }
    }
  }, [user, userLocation, aiAnalysisTriggered, analyzeCompatibilityAndVenues]);

  // Reset AI trigger state when session changes
  useEffect(() => {
    if (sessionId) {
      setAiAnalysisTriggered(false);
      resetAIState();
    }
  }, [sessionId, resetAIState]);

  // Set up real-time subscription for session updates
  useEffect(() => {
    if (!sessionId || !session) return;
    
    const channelName = `${user?.id}:collab-session-${sessionId}`;
    let isActive = true;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'date_planning_sessions',
          filter: `id=eq.${sessionId}`
        }, 
        (payload) => {
          if (!isActive) return;
          
          if (payload.new) {
            const updatedSession = payload.new as DatePlanningSession;
            setSession(updatedSession);
            
            if (updatedSession.both_preferences_complete && !updatedSession.ai_compatibility_score && !aiAnalysisTriggered) {
              triggerAIAnalysisIfReady(updatedSession);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, user?.id]);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, user]);

  // Helper functions
  const isUserInitiator = session ? session.initiator_id === user?.id : false;
  const isUserPartner = session ? session.partner_id === user?.id : false;
  
  const hasUserSetPreferences = (() => {
    if (!session || !user?.id) return false;
    const isInitiator = session.initiator_id === user.id;
    if (!isInitiator && session.partner_id !== user.id) return false;
    return isInitiator ? session.initiator_preferences_complete : session.partner_preferences_complete;
  })();
  
  const hasPartnerSetPreferences = (() => {
    if (!session || !user?.id) return false;
    const isInitiator = session.initiator_id === user.id;
    return isInitiator ? session.partner_preferences_complete : session.initiator_preferences_complete;
  })();
  
  const canShowResults = session?.both_preferences_complete || false;

  // Force refresh function
  const forceRefreshSession = useCallback(async () => {
    if (!sessionId) return;
    await fetchSession(sessionId, true);
  }, [sessionId, fetchSession]);

  // Manual AI Analysis Trigger
  const triggerAIAnalysisManually = useCallback(async (manualLocation?: { latitude: number; longitude: number; address?: string } | null) => {
    if (!session || !user) return;
    
    setAiAnalysisTriggered(false);
    
    try {
      const partnerId = session.initiator_id === user.id 
        ? session.partner_id 
        : session.initiator_id;
      
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (userPrefs) {
        const locationForAnalysis = manualLocation || userLocation || {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'San Francisco, CA (fallback)'
        };
        
        await analyzeCompatibilityAndVenues(
          session.id,
          partnerId,
          userPrefs,
          locationForAnalysis
        );
      }
    } catch (error) {
      console.error('SESSION: Manual AI Analysis failed:', error);
      setAiAnalysisTriggered(false);
    }
  }, [session, user, userLocation, analyzeCompatibilityAndVenues]);

  // Process venue data when session preferences_data changes
  useEffect(() => {
    const processVenueData = async () => {
      if (session?.preferences_data && Array.isArray(session.preferences_data)) {
        try {
          const venueHelpers = await import('@/utils/venueDataHelpers');
          const transformToVenueRecommendation = venueHelpers.transformToVenueRecommendation;
          
          if (!transformToVenueRecommendation) return;
          
          const transformedVenues: AIVenueRecommendation[] = [];
          
          for (const venue of session.preferences_data) {
            const transformed = transformToVenueRecommendation(venue);
            if (transformed) {
              transformedVenues.push(transformed);
            }
          }
          
          setSessionVenueRecommendations(transformedVenues);
        } catch (error) {
          console.error('SESSION: Error transforming venue data:', error);
          setSessionVenueRecommendations([]);
        }
      } else {
        setSessionVenueRecommendations([]);
      }
    };
    
    processVenueData();
  }, [session?.preferences_data]);

  return {
    session,
    loading,
    error,
    isUserInitiator,
    isUserPartner,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    refetchSession: () => sessionId ? fetchSession(sessionId) : Promise.resolve(),
    forceRefreshSession,
    triggerAIAnalysisManually,
    aiAnalysisTriggered,
    compatibilityScore: session?.ai_compatibility_score || aiCompatibilityScore,
    venueRecommendations: sessionVenueRecommendations.length > 0 ? sessionVenueRecommendations : aiVenueRecommendations,
    venueSearchError: aiVenueSearchError,
    aiAnalyzing: isAnalyzing
  };
};
