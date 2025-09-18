import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Users, AlertCircle, CheckCircle, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { resetSessionToCleanState } from '@/services/sessionValidationService';
import { clearUserPreferenceFields } from '@/services/sessionCleanupService';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useToast } from '@/hooks/use-toast';

interface SessionStatus {
  session_id: string;
  session_status: string;
  created_at: string;
  expires_at: string;
  initiator_id: string;
  partner_id: string;
  initiator_name: string;
  partner_name: string;
  initiator_complete: boolean;
  partner_complete: boolean;
  both_complete: boolean;
  has_initiator_prefs: boolean;
  has_partner_prefs: boolean;
  current_user_is_initiator: boolean;
  current_user_completed: boolean;
  partner_completed: boolean;
  is_session_valid: boolean;
  is_user_part_of_session: boolean;
  session_age_minutes: number;
}

const SessionStatusDebug: React.FC<{ sessionId?: string; expectedPartnerId?: string }> = ({ sessionId, expectedPartnerId }) => {
  const { user } = useAuth();
  const { syncUserPreferencesToSession } = useSessionManagement();
  const { toast } = useToast();
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionStatus = useCallback(async (forceRefresh = false) => {
    if (!sessionId || !user) {
      console.log('🔍 SESSION DEBUG: Missing sessionId or user', { sessionId: !!sessionId, user: !!user });
      return;
    }

    console.log('🔍 SESSION DEBUG: Fetching session status for:', sessionId, 'Force refresh:', forceRefresh);
    setLoading(true);
    setError(null);
    
    try {
      // First, check if this session exists and get full details
      const { data: sessionData, error: sessionError } = await supabase
        .from('date_planning_sessions')
        .select(`
          id,
          session_status,
          created_at,
          expires_at,
          initiator_id,
          partner_id,
          initiator_preferences_complete,
          partner_preferences_complete,
          both_preferences_complete,
          initiator_preferences,
          partner_preferences,
          ai_compatibility_score
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('🔍 SESSION DEBUG: Session not found:', sessionError);
        throw new Error(`Session not found: ${sessionError.message}`);
      }

      console.log('🔍 SESSION DEBUG: Raw session data:', sessionData);

      // Validate session and user participation
      const isUserPartOfSession = (
        sessionData.initiator_id === user.id || 
        sessionData.partner_id === user.id
      );

      if (!isUserPartOfSession) {
        console.warn('🔍 SESSION DEBUG: User is not part of this session');
        setError('You are not a participant in this session');
        return;
      }

      // Check if session is active
      const isSessionActive = sessionData.session_status === 'active';
      const isSessionExpired = new Date(sessionData.expires_at) < new Date();
      
      // Calculate session age
      const sessionAge = Math.floor((Date.now() - new Date(sessionData.created_at).getTime()) / (1000 * 60));

      const partnerId = sessionData.initiator_id === user.id 
        ? sessionData.partner_id 
        : sessionData.initiator_id;

      // Check if this matches the expected partner
      const isCorrectPartner = !expectedPartnerId || partnerId === expectedPartnerId;
      
      if (expectedPartnerId && !isCorrectPartner) {
        console.warn('🔍 SESSION DEBUG: Partner mismatch - expected:', expectedPartnerId, 'got:', partnerId);
      }

      // Also check for currently active sessions for this user pair
      const { data: activeSessionCheck } = await supabase
        .from('date_planning_sessions')
        .select('id, created_at')
        .eq('session_status', 'active')
        .or(`and(initiator_id.eq.${user.id},partner_id.eq.${partnerId}),and(initiator_id.eq.${partnerId},partner_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1);

      const hasNewerActiveSession = activeSessionCheck && 
        activeSessionCheck.length > 0 && 
        activeSessionCheck[0].id !== sessionId;

      if (hasNewerActiveSession) {
        console.warn('🔍 SESSION DEBUG: Found newer active session:', activeSessionCheck[0].id);
      }

      // Fetch profile names separately with error handling
      const [initiatorResult, partnerResult] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', sessionData.initiator_id).single(),
        supabase.from('profiles').select('name').eq('id', sessionData.partner_id).single()
      ]);

      const isInitiator = sessionData.initiator_id === user.id;
      
      const status: SessionStatus = {
        session_id: sessionData.id,
        session_status: sessionData.session_status,
        created_at: sessionData.created_at,
        expires_at: sessionData.expires_at,
        initiator_id: sessionData.initiator_id,
        partner_id: sessionData.partner_id,
        initiator_name: initiatorResult.data?.name || 'Unknown',
        partner_name: partnerResult.data?.name || 'Unknown',
        initiator_complete: sessionData.initiator_preferences_complete,
        partner_complete: sessionData.partner_preferences_complete,
        both_complete: sessionData.both_preferences_complete,
        has_initiator_prefs: !!sessionData.initiator_preferences,
        has_partner_prefs: !!sessionData.partner_preferences,
        current_user_is_initiator: isInitiator,
        current_user_completed: isInitiator ? sessionData.initiator_preferences_complete : sessionData.partner_preferences_complete,
        partner_completed: isInitiator ? sessionData.partner_preferences_complete : sessionData.initiator_preferences_complete,
        is_session_valid: isSessionActive && !isSessionExpired && !hasNewerActiveSession && isCorrectPartner,
        is_user_part_of_session: isUserPartOfSession,
        session_age_minutes: sessionAge
      };

      console.log('🔍 SESSION DEBUG: Processed status:', status);
      setStatus(status);

      // Set warnings for invalid sessions
      if (!status.is_session_valid) {
        const reasons = [];
        if (!isSessionActive) reasons.push('session is not active');
        if (isSessionExpired) reasons.push('session has expired');
        if (hasNewerActiveSession) reasons.push('newer session exists');
        if (expectedPartnerId && !isCorrectPartner) reasons.push('partner mismatch detected');
        
        setError(`Warning: This session may not be current (${reasons.join(', ')})`);
      }
    } catch (err) {
      console.error('🔍 SESSION DEBUG: Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session status');
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  const handleResetSession = async () => {
    if (!sessionId) return;

    setResetting(true);
    try {
      const success = await resetSessionToCleanState(sessionId);
      if (success) {
        toast({
          title: "Session Reset",
          description: "Session preferences have been cleared successfully",
        });
        // Refresh the status after reset
        await fetchSessionStatus();
      } else {
        toast({
          title: "Reset Failed",
          description: "Failed to reset session preferences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Reset session error:', error);
      toast({
        title: "Reset Error",
        description: "An error occurred while resetting the session",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetMyPreferences = async () => {
    if (!user || !sessionId) return;
    
    setResetting(true);
    try {
      await clearUserPreferenceFields(user.id);
      toast({
        title: "My Preferences Cleared",
        description: "Your preferences have been cleared from all sessions",
        variant: "default"
      });
      fetchSessionStatus(); // Refresh the status
    } catch (error) {
      console.error('Error clearing my preferences:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear your preferences",
        variant: "destructive"
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSyncPreferences = async () => {
    if (!user || !sessionId || !status) return;
    
    setResetting(true);
    try {
      const partnerId = status.initiator_id === user.id ? status.partner_id : status.initiator_id;
      await syncUserPreferencesToSession(sessionId, user.id, partnerId);
      toast({
        title: "Preferences Synced",
        description: "User preferences have been synced to the session",
      });
      fetchSessionStatus(); // Refresh the status
    } catch (error) {
      console.error('Error syncing preferences:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync user preferences",
        variant: "destructive"
      });
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, [fetchSessionStatus]);

  // Set up real-time updates for session changes
  useEffect(() => {
    if (!sessionId || !user) return;

    console.log('🔄 SESSION DEBUG: Setting up real-time updates for session:', sessionId);
    
    const channel = supabase
      .channel(`session-debug-${sessionId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_planning_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('🔄 SESSION DEBUG: Real-time session update:', payload);
          fetchSessionStatus(true); // Force refresh
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 SESSION DEBUG: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, fetchSessionStatus]);

  if (!sessionId || !user) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Session Status Debug
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSession}
              disabled={resetting || !sessionId}
              className="text-orange-600 hover:text-orange-700"
            >
              <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
              Reset Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetMyPreferences}
              disabled={resetting || !user}
              className="text-blue-600 hover:text-blue-700"
            >
              <User className="h-4 w-4" />
              Reset My Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncPreferences}
              disabled={resetting || !sessionId}
              className="text-green-600 hover:text-green-700"
            >
              <RefreshCw className="h-4 w-4" />
              Sync User Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSessionStatus(true)}
              disabled={loading}
              title="Force refresh session data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-100 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {status && (
          <div className="space-y-3">
            {/* Session Validity Warning */}
            {!status.is_session_valid && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-100 p-3 rounded-lg border border-orange-200">
                <AlertTriangle className="h-4 w-4" />
                <div className="text-sm">
                  <strong>Session Status Warning:</strong> This session may not be current.
                  {status.session_status !== 'active' && ' Session is not active.'}
                  {status.session_age_minutes > 60 && ` Session is ${Math.floor(status.session_age_minutes / 60)} hours old.`}
                </div>
              </div>
            )}

            {/* Session Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Session ID:</strong> {status.session_id.slice(0, 8)}...
              </div>
              <div>
                <strong>Your Role:</strong> {status.current_user_is_initiator ? 'Initiator' : 'Partner'}
              </div>
              <div>
                <strong>Status:</strong> 
                <Badge variant={status.session_status === 'active' ? 'default' : 'secondary'} className="ml-1">
                  {status.session_status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span><strong>Age:</strong> {status.session_age_minutes}m</span>
              </div>
            </div>

            {/* User Status */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Preference Status:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {status.initiator_name} (Initiator):
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant={status.initiator_complete ? 'default' : 'secondary'}>
                      {status.initiator_complete ? 'Complete' : 'Incomplete'}
                    </Badge>
                    {status.has_initiator_prefs ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    }
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {status.partner_name} (Partner):
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant={status.partner_complete ? 'default' : 'secondary'}>
                      {status.partner_complete ? 'Complete' : 'Incomplete'}
                    </Badge>
                    {status.has_partner_prefs ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Current User Status */}
            <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <strong className="text-sm">Your Status:</strong>
              </div>
              
              {!status.current_user_completed ? (
                <div className="text-sm text-blue-700">
                  ⚠️ <strong>Action Required:</strong> You need to complete your preferences first
                </div>
              ) : !status.partner_completed ? (
                <div className="text-sm text-green-700">
                  ✅ <strong>Waiting:</strong> Your preferences are set, waiting for partner
                </div>
              ) : (
                <div className="text-sm text-green-700">
                  🎉 <strong>Ready:</strong> Both users completed, ready for AI analysis
                </div>
              )}
              
              {/* Session validity status */}
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-xs text-gray-600">
                  Session Valid: {status.is_session_valid ? '✅ Yes' : '❌ No'} |
                  Part of Session: {status.is_user_part_of_session ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionStatusDebug;