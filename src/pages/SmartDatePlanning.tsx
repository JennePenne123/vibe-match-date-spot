
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
import { useBreakpoint } from '@/hooks/use-mobile';

import SessionStatusDebug from '@/components/debug/SessionStatusDebug';

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
      const firstName = displayName.split(' ')[0];
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
  const { createPlanningSession } = useSessionManagement();
  
  console.log('SmartDatePlanning - Navigation state:', { 
    sessionId, 
    fromProposal, 
    planningMode,
    sessionExists: !!collaborativeSession,
    sessionStatus: collaborativeSession?.session_status,
    userRole: collaborativeSession ? (collaborativeSession.initiator_id === user?.id ? 'initiator' : 'partner') : 'unknown'
  });
  
  // Guardrail: Redirect to fresh session if current session has stale data
  useEffect(() => {
    if (!user || !collaborativeSession || !sessionId) return;
    
    console.log('🔄 SESSION GUARDRAIL: Checking session validity:', {
      sessionId,
      sessionStatus: collaborativeSession.session_status,
      hasInitiatorPrefs: !!collaborativeSession.initiator_preferences,
      hasPartnerPrefs: !!collaborativeSession.partner_preferences,
      initiatorComplete: collaborativeSession.initiator_preferences_complete,
      partnerComplete: collaborativeSession.partner_preferences_complete,
      bothComplete: collaborativeSession.both_preferences_complete
    });
    
    const sessionHasPreferences = (
      collaborativeSession.initiator_preferences ||
      collaborativeSession.partner_preferences ||
      collaborativeSession.initiator_preferences_complete ||
      collaborativeSession.partner_preferences_complete
    );
    
    const sessionInactive = collaborativeSession.session_status !== 'active';
    
    // Only create fresh session if the current one is truly stale or inactive
    // AND we haven't already created a fresh session recently
    if ((sessionHasPreferences || sessionInactive) && !sessionStorage.getItem(`guardrail-${sessionId}`)) {
      console.log('🔄 SESSION GUARDRAIL: Detected stale session data, creating fresh session');
      
      // Mark this session as processed to prevent loops
      sessionStorage.setItem(`guardrail-${sessionId}`, 'processed');
      
      // Create a fresh session
      const partnerId = collaborativeSession.initiator_id === user.id 
        ? collaborativeSession.partner_id 
        : collaborativeSession.initiator_id;
      
      createPlanningSession(partnerId, undefined, 'collaborative', true)
        .then((newSession) => {
          if (newSession?.id) {
            console.log('✅ SESSION GUARDRAIL: Created fresh session:', newSession.id);
            // Navigate to the new session
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
          console.error('❌ SESSION GUARDRAIL: Failed to create fresh session:', error);
          // Remove the guard to allow retry
          sessionStorage.removeItem(`guardrail-${sessionId}`);
        });
    }
  }, [user, collaborativeSession, sessionId, createPlanningSession, navigate]);
  
  // CRITICAL: Collaborative planning requires coming from an accepted proposal
  // If accessed directly without session data, redirect to home
  if (!fromProposal || !sessionId) {
    console.log('SmartDatePlanning - No collaborative session found, redirecting to home');
    window.location.href = '/home';
    return null;
  }

  // Show loading spinner while auth is loading
  if (loading) {
    console.log('SmartDatePlanning - Auth loading, showing spinner');
    return <LoadingSpinner />;
  }

  // Redirect to login if no user
  if (!user) {
    console.log('SmartDatePlanning - No user, redirecting to login');
    return (
      <div className="min-h-screen bg-background p-6">
        <div className={isMobile ? "max-w-md mx-auto text-center" : "max-w-lg mx-auto text-center"}>
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to use the Smart Date Planner.</p>
          <button 
            onClick={() => window.location.href = '/register-login'}
            className="bg-primary text-primary-foreground px-6 py-2 rounded hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const { displayName, firstName } = userInfo;

  console.log('SmartDatePlanning - Rendering with user:', { displayName, firstName });

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-background">
        <div className={isMobile ? "max-w-md mx-auto" : "max-w-none"}>
          {isMobile && (
            <HomeHeader 
              user={user}
              displayName={displayName}
              firstName={firstName}
            />
          )}
          
          <ErrorBoundary level="component">
            <SessionStatusDebug sessionId={sessionId} />
            <SmartDatePlanner sessionId={sessionId} fromProposal={fromProposal} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SmartDatePlanning;
