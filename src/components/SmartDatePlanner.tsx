import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();

  console.log('SmartDatePlanner - Starting with user:', user?.id);
  console.log('SmartDatePlanner - Preselected friend:', preselectedFriend);

  // Initialize hooks with error handling
  let friends = [];
  let friendsError = null;
  
  try {
    const friendsResult = useFriends();
    friends = friendsResult.friends || [];
    console.log('SmartDatePlanner - Friends loaded:', friends.length);
  } catch (error) {
    console.error('SmartDatePlanner - Error loading friends:', error);
    friendsError = error;
  }

  let datePlanningState = null;
  let datePlanningError = null;
  
  try {
    datePlanningState = useDatePlanning();
    console.log('SmartDatePlanner - Date planning state loaded');
  } catch (error) {
    console.error('SmartDatePlanner - Error loading date planning state:', error);
    datePlanningError = error;
  }

  let planningStepsState = null;
  let planningStepsError = null;
  
  try {
    planningStepsState = usePlanningSteps({ preselectedFriend });
    console.log('SmartDatePlanner - Planning steps loaded');
  } catch (error) {
    console.error('SmartDatePlanner - Error loading planning steps:', error);
    planningStepsError = error;
  }

  // Show error if any critical hooks failed
  if (friendsError || datePlanningError || planningStepsError) {
    console.error('SmartDatePlanner - Critical errors detected:', {
      friendsError,
      datePlanningError,
      planningStepsError
    });
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Error</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading the Smart Date Planner. Please try refreshing the page.
          </p>
          <div className="text-sm text-red-600 mb-4">
            {friendsError && <div>Friends Error: {friendsError.message}</div>}
            {datePlanningError && <div>Date Planning Error: {datePlanningError.message}</div>}
            {planningStepsError && <div>Planning Steps Error: {planningStepsError.message}</div>}
          </div>
          <Button onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Extract states from hooks (with defaults if null)
  const {
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    createPlanningSession,
    getActiveSession,
    completePlanningSession
  } = datePlanningState || {
    currentSession: null,
    loading: false,
    compatibilityScore: null,
    venueRecommendations: [],
    createPlanningSession: async () => {},
    getActiveSession: async () => null,
    completePlanningSession: async () => false
  };

  const {
    currentStep,
    setCurrentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack
  } = planningStepsState || {
    currentStep: 'select-partner',
    setCurrentStep: () => {},
    selectedPartnerId: '',
    setSelectedPartnerId: () => {},
    getStepProgress: () => 0,
    goBack: () => {}
  };

  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [invitationMessage, setInvitationMessage] = useState<string>('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const selectedPartner = friends.find(f => f.id === selectedPartnerId);
  const selectedVenue = venueRecommendations.find(v => v.venue_id === selectedVenueId);

  // Check for existing session when partner is selected
  useEffect(() => {
    if (selectedPartnerId && currentStep === 'select-partner') {
      console.log('SmartDatePlanner - Checking for existing session');
      getActiveSession(selectedPartnerId).then(session => {
        if (session) {
          console.log('SmartDatePlanner - Found existing session, advancing step');
          setCurrentStep('set-preferences');
        }
      }).catch(error => {
        console.error('SmartDatePlanner - Error getting active session:', error);
      });
    }
  }, [selectedPartnerId, getActiveSession, currentStep, setCurrentStep]);

  // Monitor compatibility score and venue recommendations with timeout
  useEffect(() => {
    if (compatibilityScore !== null && currentStep === 'set-preferences') {
      console.log('SmartDatePlanner - AI analysis complete, advancing to review step');
      setAiAnalyzing(false);
      setCurrentStep('review-matches');
    }
  }, [compatibilityScore, currentStep, setCurrentStep]);

  // Add timeout for AI analysis
  useEffect(() => {
    if (aiAnalyzing) {
      const timeoutId = setTimeout(() => {
        if (currentStep === 'set-preferences' && aiAnalyzing) {
          console.log('SmartDatePlanner - AI analysis timeout, advancing anyway');
          setAiAnalyzing(false);
          setCurrentStep('review-matches');
        }
      }, 35000); // 35 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [aiAnalyzing, currentStep, setCurrentStep]);

  async function handlePartnerSelection(partnerId?: string) {
    const partnerIdToUse = partnerId || selectedPartnerId;
    if (!partnerIdToUse) return;

    console.log('SmartDatePlanner - Handling partner selection:', partnerIdToUse);
    
    try {
      const session = await getActiveSession(partnerIdToUse);
      if (!session) {
        console.log('SmartDatePlanner - Creating new planning session');
        await createPlanningSession(partnerIdToUse);
      }
      setCurrentStep('set-preferences');
    } catch (error) {
      console.error('SmartDatePlanner - Error in partner selection:', error);
    }
  }

  function handlePreferencesComplete() {
    console.log('SmartDatePlanner - Preferences submitted, starting AI analysis...');
    setAiAnalyzing(true);
  }

  function handleVenueSelection(venueId: string) {
    console.log('SmartDatePlanner - Venue selected:', venueId);
    setSelectedVenueId(venueId);
    setCurrentStep('create-invitation');
    
    // Generate AI-powered invitation message
    if (selectedPartner && selectedVenue) {
      const aiMessage = `Hi ${selectedPartner.name}! 🌟 Our AI compatibility score is ${compatibilityScore}% - we're a great match! I'd love to take you to ${selectedVenue.venue_name} based on our shared preferences. ${selectedVenue.ai_reasoning} What do you think?`;
      setInvitationMessage(aiMessage);
    }
  }

  async function handleSendInvitation() {
    if (!currentSession || !selectedVenueId) return;

    console.log('SmartDatePlanner - Sending invitation');
    
    try {
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
    } catch (error) {
      console.error('SmartDatePlanner - Error sending invitation:', error);
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-6 space-y-6">
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
        {currentStep === 'select-partner' && (
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
