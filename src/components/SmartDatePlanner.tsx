
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Users, MapPin, Clock, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import CollaborativePreferences from '@/components/CollaborativePreferences';
import AIMatchSummary from '@/components/AIMatchSummary';
import AIVenueCard from '@/components/AIVenueCard';
import SafeComponent from '@/components/SafeComponent';

type PlanningStep = 'select-partner' | 'set-preferences' | 'review-matches' | 'create-invitation';

const SmartDatePlanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const [currentStep, setCurrentStep] = useState<PlanningStep>('select-partner');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [invitationMessage, setInvitationMessage] = useState<string>('');

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
  }, [selectedPartnerId, getActiveSession, currentStep]);

  const handlePartnerSelection = async () => {
    if (!selectedPartnerId) return;

    const session = await getActiveSession(selectedPartnerId);
    if (!session) {
      await createPlanningSession(selectedPartnerId);
    }
    setCurrentStep('set-preferences');
  };

  const handlePreferencesComplete = () => {
    if (compatibilityScore !== null && venueRecommendations.length > 0) {
      setCurrentStep('review-matches');
    }
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

  const getStepProgress = () => {
    switch (currentStep) {
      case 'select-partner': return 25;
      case 'set-preferences': return 50;
      case 'review-matches': return 75;
      case 'create-invitation': return 100;
      default: return 0;
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'set-preferences': setCurrentStep('select-partner'); break;
      case 'review-matches': setCurrentStep('set-preferences'); break;
      case 'create-invitation': setCurrentStep('review-matches'); break;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">Smart Date Planner</h1>
          </div>
          <p className="text-gray-600">
            AI-powered date planning with collaborative preferences and smart matching
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={getStepProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Select Partner</span>
              <span>Set Preferences</span>
              <span>Review Matches</span>
              <span>Send Invitation</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {currentStep !== 'select-partner' && (
          <div className="flex justify-start">
            <Button onClick={goBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}

        {/* Step 1: Select Partner */}
        {currentStep === 'select-partner' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Choose Your Date Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a friend to plan a date with" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map((friend) => (
                    <SelectItem key={friend.id} value={friend.id}>
                      {friend.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handlePartnerSelection}
                disabled={!selectedPartnerId || loading}
                className="w-full"
              >
                {loading ? 'Creating Planning Session...' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Set Preferences */}
        {currentStep === 'set-preferences' && currentSession && selectedPartner && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Planning Date with {selectedPartner.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Session expires in 24h
                  </Badge>
                  {compatibilityScore !== null && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {compatibilityScore}% Compatible
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            <SafeComponent componentName="CollaborativePreferences">
              <CollaborativePreferences
                sessionId={currentSession.id}
                partnerId={selectedPartnerId}
                onPreferencesUpdated={handlePreferencesComplete}
              />
            </SafeComponent>

            {compatibilityScore !== null && venueRecommendations.length > 0 && (
              <div className="text-center">
                <Button onClick={handlePreferencesComplete} size="lg">
                  View AI Matches
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review Matches */}
        {currentStep === 'review-matches' && selectedPartner && (
          <div className="space-y-6">
            <SafeComponent componentName="AIMatchSummary">
              <AIMatchSummary
                compatibilityScore={compatibilityScore || 0}
                partnerName={selectedPartner.name}
                venueCount={venueRecommendations.length}
              />
            </SafeComponent>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venueRecommendations.map((recommendation) => (
                <SafeComponent key={recommendation.venue_id} componentName="AIVenueCard">
                  <AIVenueCard
                    recommendation={recommendation}
                    onSelect={handleVenueSelection}
                    showAIInsights={true}
                  />
                </SafeComponent>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Create Invitation */}
        {currentStep === 'create-invitation' && selectedPartner && selectedVenue && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Send Smart Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Selected Venue</h3>
                <p className="text-purple-700">{selectedVenue.venue_name}</p>
                <p className="text-sm text-purple-600 mt-1">{selectedVenue.ai_reasoning}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Invitation Message
                </label>
                <Textarea
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="Write a personalized message..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSendInvitation}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Sending...' : 'Send Smart Invitation'}
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmartDatePlanner;
