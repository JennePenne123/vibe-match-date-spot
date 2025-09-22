import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';

interface UseCollaborativeSessionStateProps {
  sessionId?: string | null;
  userLocation?: { latitude: number; longitude: number; address?: string } | null;
}

export const useCollaborativeSessionState = ({ sessionId, userLocation }: UseCollaborativeSessionStateProps) => {
  const collaborativeSessionData = useCollaborativeSession(sessionId, userLocation);
  
  return {
    collaborativeSession: collaborativeSessionData.session,
    sessionLoading: collaborativeSessionData.loading,
    sessionError: collaborativeSessionData.error,
    isUserInitiator: collaborativeSessionData.isUserInitiator,
    isUserPartner: collaborativeSessionData.isUserPartner,
    hasUserSetPreferences: collaborativeSessionData.hasUserSetPreferences,
    hasPartnerSetPreferences: collaborativeSessionData.hasPartnerSetPreferences,
    canShowResults: collaborativeSessionData.canShowResults,
    triggerAIAnalysisManually: collaborativeSessionData.triggerAIAnalysisManually,
    forceRefreshSession: collaborativeSessionData.forceRefreshSession,
    aiAnalysisTriggered: collaborativeSessionData.aiAnalysisTriggered,
    // Expose collaborative session AI results with proper debugging
    collaborativeCompatibilityScore: collaborativeSessionData.compatibilityScore,
    collaborativeVenueRecommendations: collaborativeSessionData.venueRecommendations || [],
    collaborativeVenueSearchError: collaborativeSessionData.venueSearchError,
    collaborativeAiAnalyzing: collaborativeSessionData.aiAnalyzing
  };
};