import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SessionStatus {
  session_id: string;
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
}

const SessionStatusDebug: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionStatus = async () => {
    if (!sessionId || !user) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .select(`
          id,
          initiator_id,
          partner_id,
          initiator_preferences_complete,
          partner_preferences_complete,
          both_preferences_complete,
          initiator_preferences,
          partner_preferences,
          initiator_profile:profiles!date_planning_sessions_initiator_id_fkey(name),
          partner_profile:profiles!date_planning_sessions_partner_id_fkey(name)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const isInitiator = data.initiator_id === user.id;
      
      setStatus({
        session_id: data.id,
        initiator_name: (data.initiator_profile as any)?.name || 'Unknown',
        partner_name: (data.partner_profile as any)?.name || 'Unknown',
        initiator_complete: data.initiator_preferences_complete,
        partner_complete: data.partner_preferences_complete,
        both_complete: data.both_preferences_complete,
        has_initiator_prefs: !!data.initiator_preferences,
        has_partner_prefs: !!data.partner_preferences,
        current_user_is_initiator: isInitiator,
        current_user_completed: isInitiator ? data.initiator_preferences_complete : data.partner_preferences_complete,
        partner_completed: isInitiator ? data.partner_preferences_complete : data.initiator_preferences_complete
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, [sessionId, user]);

  if (!sessionId || !user) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Session Status Debug
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessionStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
            {/* Session Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Session ID:</strong> {status.session_id.slice(0, 8)}...
              </div>
              <div>
                <strong>Your Role:</strong> {status.current_user_is_initiator ? 'Initiator' : 'Partner'}
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionStatusDebug;