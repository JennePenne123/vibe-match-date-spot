
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { IS_MOCK_MODE } from '@/utils/mockMode';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePlanningSteps } from '@/hooks/usePlanningSteps';

// Import step components
import PlanningHeader from '@/components/date-planning/PlanningHeader';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import PreferencesStep from '@/components/date-planning/PreferencesStep';
import MatchReview from '@/components/date-planning/MatchReview';
import InvitationCreation from '@/components/date-planning/InvitationCreation';

interface SmartDatePlannerProps {
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlanner: React.FC<SmartDatePlannerProps> = ({ preselectedFriend }) => {
  const navigate = useNavigate();
  const realAuth = useAuth();
  const mockAuth = useMockAuth();
  const { user } = IS_MOCK_MODE ? mockAuth : realAuth;
  const { friends } = useFriends();
  const {
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    createPlanningSession,
    getActiveSession,
    completePlanningSession
  } = useDatePlanning();

  const {
    currentStep,
    setCurrentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack
  } = usePlanningSteps({ preselectedFriend });

  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [invitationMessage, setInvitationMessage] = useState<string>('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const selectedPartner = friends.find(f => f.id === selectedPartnerId);
  const selectedVenue = venueRecommendations.find(v => v.venue_id === selectedVenueId);

  // Check for existing session when partner is selected
  useEffect(() => {
    if (selectedPartnerId && currentStep === 'select-partner') {
      getActiveSession(selectedPartnerId).then(session => {
        if (session) {
          setCurrentStep('set-preferences');
        }
      });
    }
  }, [selectedPartnerId, getActiveSession, currentStep, setCurrentStep]);

  // Monitor compatibility score and venue recommendations
  useEffect(() => {
    if (compatibilityScore !== null && venueRecommendations.length > 0 && currentStep === 'set-preferences') {
      console.log('AI analysis complete, advancing to review step');
      setAiAnalyzing(false);
      setCurrentStep('review-matches');
    }
  }, [compatibilityScore, venueRecommendations, currentStep, setCurrentStep]);

  const handlePartnerSelection = async (partnerId?: string) => {
    const partnerIdToUse = partnerId || selectedPartnerId;
    if (!partnerIdToUse) return;

    const session = await getActiveSession(partnerIdToUse);
    if (!session) {
      await createPlanningSession(partnerIdToUse);
    }
    setCurrentStep('set-preferences');
  };

  const handlePreferencesComplete = () => {
    console.log('Preferences submitted, starting AI analysis...');
    setAiAnalyzing(true);
  };

  const handleVenueSelection = (venueId: string) => {
    setSelectedVenueId(venueId);
    setCurrentStep('create-invitation');
    
    // Generate AI-powered invitation message
    if (selectedPartner && selectedVenue) {
      const aiMessage = `Hi ${selectedPartner.name}! 🌟 Our AI compatibility score is ${compatibilityScore}% - we're a great match! I'd love to take you to ${selectedVenue.venue_name} based on our shared preferences. ${selectedVenue.ai_reasoning} What do you think?`;
      setInvitationMessage(aiMessage);
    }
  };

  const handleSendInvitation = async () => {
    if (!currentSession || !selectedVenueId) return;

    const success = await completePlanningSession(
      currentSession.id,
      selectedVenueId,
      invitationMessage
    );

    if (success) {
      navigate('/home', { 
        state: { message: 'Smart date invitation sent successfully!' }
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to use the Smart Date Planner.</p>
          <Button onClick={() => navigate('/register-login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <PlanningHeader progress={getStepProgress()} />

        {/* Navigation */}
        <div className="flex justify-start">
          <Button 
            onClick={() => goBack(preselectedFriend, navigate)} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Step 1: Select Partner */}
        {currentStep === 'select-partner' && !preselectedFriend && (
          <PartnerSelection
            friends={friends}
            selectedPartnerId={selectedPartnerId}
            loading={loading}
            onPartnerChange={setSelectedPartnerId}
            onContinue={() => handlePartnerSelection()}
          />
        )}

        {/* Step 2: Set Preferences */}
        {currentStep === 'set-preferences' && currentSession && selectedPartner && (
          <PreferencesStep
            sessionId={currentSession.id}
            partnerId={selectedPartnerId}
            partnerName={selectedPartner.name}
            compatibilityScore={compatibilityScore}
            aiAnalyzing={aiAnalyzing}
            onPreferencesComplete={handlePreferencesComplete}
          />
        )}

        {/* Step 3: Review Matches */}
        {currentStep === 'review-matches' && selectedPartner && (
          <MatchReview
            compatibilityScore={compatibilityScore || 0}
            partnerName={selectedPartner.name}
            venueRecommendations={venueRecommendations}
            onVenueSelect={handleVenueSelection}
          />
        )}

        {/* Step 4: Create Invitation */}
        {currentStep === 'create-invitation' && selectedPartner && selectedVenue && (
          <InvitationCreation
            partnerName={selectedPartner.name}
            selectedVenue={selectedVenue}
            invitationMessage={invitationMessage}
            loading={loading}
            onMessageChange={setInvitationMessage}
            onSendInvitation={handleSendInvitation}
          />
        )}
      </div>
    </div>
  );
};

export default SmartDatePlanner;
