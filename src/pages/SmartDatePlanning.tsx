
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SmartDatePlanner from '@/components/SmartDatePlanner';
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import HomeHeader from '@/components/HomeHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-mobile';


const SmartDatePlanning: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  
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
  const sessionId = location.state?.sessionId;
  const fromProposal = location.state?.fromProposal;
  const planningMode = location.state?.planningMode;
  
  // Get session data to check if it needs reset
  const { session: collaborativeSession } = useCollaborativeSession(sessionId);
  const { createPlanningSession, getActiveSession } = useSessionManagement();
  
  
  useEffect(() => {
    if (!user || !collaborativeSession || !sessionId) return;
    
    const userRole = collaborativeSession.initiator_id === user.id ? 'initiator' : 'partner';
    const isExpired = new Date() > new Date(collaborativeSession.expires_at);
    const isCompleted = collaborativeSession.session_status === 'completed';
    const isInactive = collaborativeSession.session_status !== 'active';
    
    const userHasNoPreferences = userRole === 'initiator' 
      ? !collaborativeSession.initiator_preferences_complete || !collaborativeSession.initiator_preferences
      : !collaborativeSession.partner_preferences_complete || !collaborativeSession.partner_preferences;

    const sessionIsValid = !isExpired && !isCompleted && !isInactive;
    
    if (sessionIsValid && userHasNoPreferences && !sessionStorage.getItem(`inherit-${sessionId}-${user.id}`)) {
      sessionStorage.setItem(`inherit-${sessionId}-${user.id}`, 'attempted');
      window.location.reload();
      return;
    }
    
    // Only create fresh session if session is truly invalid (expired, completed, or corrupted)
    const needsFreshSession = isExpired || isCompleted || isInactive;
    
    if (needsFreshSession && !sessionStorage.getItem(`guardrail-${sessionId}`)) {
      console.log('🔄 SESSION GUARDRAIL: Session is invalid, looking for existing active session first');
      
      // Mark this session as processed to prevent loops
      sessionStorage.setItem(`guardrail-${sessionId}`, 'processed');
      
      const partnerId = collaborativeSession.initiator_id === user.id 
        ? collaborativeSession.partner_id 
        : collaborativeSession.initiator_id;
      
      // First try to find existing active session with this partner
      getActiveSession(partnerId)
        .then((existingSession) => {
          if (existingSession && existingSession.id !== sessionId) {
            console.log('✅ SESSION GUARDRAIL: Found existing active session, joining:', existingSession.id);
            navigate('/plan-date', {
              state: {
                sessionId: existingSession.id,
                fromProposal: true,
                planningMode: 'collaborative'
              },
              replace: true
            });
          } else {
            // No existing session, create new one
            return createPlanningSession(partnerId, undefined, 'collaborative', true);
          }
        })
        .then((newSession) => {
          if (newSession?.id) {
            console.log('✅ SESSION GUARDRAIL: Created fresh session:', newSession.id);
            navigate('/plan-date', {
              state: {
                sessionId: newSession.id,
                fromProposal: true,
                planningMode: 'collaborative'
              },
              replace: true
            });
          }
        })
        .catch((error) => {
          console.error('❌ SESSION GUARDRAIL: Failed to handle session:', error);
          sessionStorage.removeItem(`guardrail-${sessionId}`);
        });
    } else if (sessionIsValid) {
      console.log('✅ SESSION GUARDRAIL: Session is valid, allowing user to join');
    }
  }, [user, collaborativeSession, sessionId, createPlanningSession, navigate, getActiveSession]);
  
  // CRITICAL: Collaborative planning requires coming from an accepted proposal
  // If accessed directly without session data, redirect to home
  if (!fromProposal || !sessionId) {
    console.log('SmartDatePlanning - No collaborative session found, redirecting to home');
    navigate('/home', { replace: true });
    return null;
  }

  // Show loading spinner while auth is loading
  if (loading) {
    console.log('SmartDatePlanning - Auth loading, showing spinner');
    return <LoadingSpinner />;
  }

  // Redirect to login if no user
  if (!user) {
    console.log('SmartDatePlanning - No user, redirecting to auth');
    navigate('/?auth=required', { replace: true });
    return null;
  }

  const { displayName, firstName } = userInfo;

  console.log('SmartDatePlanning - Rendering with user:', { displayName, firstName });

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
          
          <ErrorBoundary level="component" silent={true}>
            <SmartDatePlanner sessionId={sessionId} fromProposal={fromProposal} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SmartDatePlanning;
