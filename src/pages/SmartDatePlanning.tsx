
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SmartDatePlanner from '@/components/SmartDatePlanner';
import { FirstUseNudge } from '@/components/FirstUseNudge';
import { useFirstUseNudge } from '@/hooks/useFirstUseNudge';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import HomeHeader from '@/components/HomeHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';


const SmartDatePlanning: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isMobile } = useBreakpoint();

  const buildPlanDateUrl = React.useCallback((nextSessionId: string, nextPlanningMode = 'collaborative') => {
    const params = new URLSearchParams({
      sessionId: nextSessionId,
      fromProposal: 'true',
      planningMode: nextPlanningMode,
    });

    return `/plan-date?${params.toString()}`;
  }, []);
  
  // Get user display info - MUST be called before any conditional returns
  const userInfo = React.useMemo(() => {
    if (!user) return { displayName: 'User', firstName: 'User' };
    
    try {
      const displayName = getUserName(user);
      const firstName = safeFirstWord(displayName, 'User');
      return { displayName, firstName };
    } catch (error) {
      console.error('Error getting user name:', error);
      return { displayName: 'User', firstName: 'User' };
    }
  }, [user]);
  
  // Get navigation state for collaborative sessions
  const sessionId = location.state?.sessionId ?? searchParams.get('sessionId');
  const fromProposal = location.state?.fromProposal ?? searchParams.get('fromProposal') === 'true';
  const planningMode = location.state?.planningMode ?? searchParams.get('planningMode') ?? 'collaborative';
  const preselectedFriend = location.state?.preselectedFriend ?? null;
  const isProposalFlow = Boolean(fromProposal && sessionId);
  const hasInvalidProposalState = Boolean(fromProposal && !sessionId);
  
  const { createPlanningSession, getActiveSession } = useSessionManagement();

  useEffect(() => {
    if (!isProposalFlow || !sessionId) return;

    const currentSessionIdInUrl = searchParams.get('sessionId');
    const currentFromProposalInUrl = searchParams.get('fromProposal');

    if (currentSessionIdInUrl === sessionId && currentFromProposalInUrl === 'true') return;

    navigate(buildPlanDateUrl(sessionId, planningMode), {
      replace: true,
      state: location.state,
    });
  }, [isProposalFlow, sessionId, searchParams, navigate, buildPlanDateUrl, planningMode, location.state]);

  // Session recovery guardrail — one-time fetch, no realtime subscription
  useEffect(() => {
    if (!user || !sessionId) return;
    if (sessionStorage.getItem(`guardrail-${sessionId}`)) return;

    const checkSession = async () => {
      const { data: session } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      const userRole = session.initiator_id === user.id ? 'initiator' : 'partner';
      const isExpired = new Date() > new Date(session.expires_at);
      const isCompleted = session.session_status === 'completed';
      const isInactive = session.session_status !== 'active';

      const userHasNoPreferences = userRole === 'initiator'
        ? !session.initiator_preferences_complete || !session.initiator_preferences
        : !session.partner_preferences_complete || !session.partner_preferences;

      const sessionIsValid = !isExpired && !isCompleted && !isInactive;

      if (sessionIsValid && userHasNoPreferences && !sessionStorage.getItem(`inherit-${sessionId}-${user.id}`)) {
        sessionStorage.setItem(`inherit-${sessionId}-${user.id}`, 'attempted');
        window.location.reload();
        return;
      }

      const needsFreshSession = isExpired || isCompleted || isInactive;

      if (needsFreshSession) {
        sessionStorage.setItem(`guardrail-${sessionId}`, 'processed');

        const partnerId = session.initiator_id === user.id
          ? session.partner_id
          : session.initiator_id;

        try {
          const existingSession = await getActiveSession(partnerId);
          if (existingSession && existingSession.id !== sessionId) {
            navigate(buildPlanDateUrl(existingSession.id), {
              state: { sessionId: existingSession.id, fromProposal: true, planningMode: 'collaborative' },
              replace: true,
            });
          } else {
            const newSession = await createPlanningSession(partnerId, undefined, 'collaborative', true);
            if (newSession?.id) {
              navigate(buildPlanDateUrl(newSession.id), {
                state: { sessionId: newSession.id, fromProposal: true, planningMode: 'collaborative' },
                replace: true,
              });
            }
          }
        } catch (error) {
          console.error('SESSION GUARDRAIL: Failed to handle session:', error);
          sessionStorage.removeItem(`guardrail-${sessionId}`);
        }
      }
    };

    checkSession();
  }, [user, sessionId, createPlanningSession, navigate, getActiveSession, buildPlanDateUrl]);
  
  if (hasInvalidProposalState) {
    navigate('/home', { replace: true });
    return null;
  }

  // Show loading spinner while auth is loading
  if (loading) {
    
    return <LoadingSpinner />;
  }

  // Redirect to login if no user
  if (!user) {
    
    navigate('/?auth=required', { replace: true });
    return null;
  }

  const { displayName, firstName } = userInfo;

  

  return (
    <ErrorBoundary level="page" silent={true}>
      <div className="min-h-screen bg-background">
        <div className={isMobile ? "max-w-md mx-auto" : "max-w-none"}>
          {isMobile && (
            <HomeHeader 
              user={user}
              displayName={displayName}
              firstName={firstName}
            />
          )}
          
          <DatePlanningNudge />
          <ErrorBoundary level="component" silent={true}>
            <SmartDatePlanner
              sessionId={sessionId ?? ''}
              fromProposal={isProposalFlow}
              preselectedFriend={preselectedFriend}
            />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

const DatePlanningNudge = () => {
  const { visible, dismiss } = useFirstUseNudge('planning-concierge');
  return (
    <div className="px-4">
      <FirstUseNudge visible={visible} onDismiss={dismiss}>
        <strong>Wusstest du?</strong> Der ✨ Concierge hilft dir mit Ideen basierend auf deinen Vorlieben!
      </FirstUseNudge>
    </div>
  );
};

export default SmartDatePlanning;
