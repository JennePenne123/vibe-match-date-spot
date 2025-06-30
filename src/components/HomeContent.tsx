
import React, { useState, useCallback, useMemo } from 'react';
import { useInvitations } from '@/hooks/useInvitations';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StartNewDateCard from '@/components/StartNewDateCard';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import InvitationStatus from '@/components/InvitationStatus';
import AIVenueCard from '@/components/AIVenueCard';
import SafeComponent from '@/components/SafeComponent';
import { useInvitationState } from '@/hooks/useInvitationState';
import { Sparkles, ArrowRight, Zap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const { invitations, loading: invitationsLoading, acceptInvitation, declineInvitation } = useInvitations();
  const { invitationState, handleAcceptInvitation, handleDeclineInvitation } = useInvitationState();
  const { recommendations, loading: aiLoading } = useAIRecommendations();
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Optimized invitation handlers
  const handleAcceptWrapper = useCallback(async (id: string | number) => {
    const stringId = String(id);
    await acceptInvitation(stringId);
    handleAcceptInvitation(stringId);
  }, [acceptInvitation, handleAcceptInvitation]);

  const handleDeclineWrapper = useCallback(async (id: string | number) => {
    const stringId = String(id);
    await declineInvitation(stringId);
    handleDeclineInvitation(stringId);
  }, [declineInvitation, handleDeclineInvitation]);

  // Toggle empty state for testing
  const toggleEmptyState = useCallback(() => {
    setShowEmptyState(prev => !prev);
  }, []);

  // Calculate available invitations and transform for compatibility
  const availableInvitations = useMemo(() => {
    if (showEmptyState) return [];
    
    return invitations
      .filter(
        inv => !invitationState.accepted.includes(inv.id) && 
               !invitationState.declined.includes(inv.id) &&
               inv.status === 'pending'
      )
      .map(inv => ({
        ...inv,
        // Convert string id to number for DateInvite compatibility
        id: parseInt(inv.id) || Math.floor(Math.random() * 1000),
        // Add compatibility properties for DateInvitationsSection
        friendName: inv.sender?.name || 'Unknown',
        friendAvatar: inv.sender?.avatar_url,
        dateType: 'dinner',
        location: inv.venue?.address || 'Location TBD',
        time: inv.proposed_date ? new Date(inv.proposed_date).toLocaleTimeString() : 'Time TBD',
        description: inv.message || inv.title,
        image: inv.venue?.image_url,
        venueCount: 1,
        isGroupDate: false,
        participants: [],
        venueName: inv.venue?.name || 'Venue TBD',
        venueAddress: inv.venue?.address || 'Address TBD',
        estimatedCost: '$50-100',
        duration: '2 hours',
        hasMultipleOptions: false,
        specialRequests: inv.message || '',
        specialNotes: inv.ai_reasoning || inv.message || '',
        venueImage: inv.venue?.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        message: inv.message || inv.title,
        status: inv.status
      }));
  }, [showEmptyState, invitationState, invitations]);

  return (
    <main className="p-6 space-y-6">
      {/* Development/Testing Controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-center">
          <Button
            onClick={toggleEmptyState}
            variant="outline"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700"
            aria-label={showEmptyState ? 'Show invitations' : 'Test empty state'}
          >
            {showEmptyState ? 'Show Invites' : 'Test Empty State'}
          </Button>
        </div>
      )}

      {/* Real-time Status Indicator */}
      {invitationsLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time updates active</span>
          </div>
        </div>
      )}

      {/* Smart Date Planning CTA */}
      <SafeComponent componentName="SmartDatePlanningCTA">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-500" />
              Smart Date Planning
            </CardTitle>
            <p className="text-sm text-gray-600">
              Let AI help you plan the perfect date with collaborative preferences and smart matching
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <Users className="h-4 w-4" />
                  <span>Collaborative preference setting</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  <span>Real-time compatibility scoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <ArrowRight className="h-4 w-4" />
                  <span>AI-curated venue recommendations</span>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button 
                  onClick={() => navigate('/plan-date')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="lg"
                >
                  Plan Smart Date
                  <Zap className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SafeComponent>

      {/* AI Recommendations Section */}
      <SafeComponent componentName="AIRecommendationsSection">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Powered Recommendations
            </CardTitle>
            <p className="text-sm text-gray-600">
              Discover perfect venues matched to your preferences
            </p>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-purple-600">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI is analyzing your preferences...</span>
                </div>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 2).map((recommendation) => (
                    <AIVenueCard
                      key={recommendation.venue_id}
                      recommendation={recommendation}
                      onSelect={(venueId) => {
                        console.log('Selected venue for date:', venueId);
                        // Could navigate to venue details or start invitation flow
                      }}
                      showAIInsights={true}
                    />
                  ))}
                </div>
                
                <div className="text-center pt-4">
                  <Button 
                    onClick={() => navigate('/ai-recommendations')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    View All AI Recommendations
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Complete your preferences to get AI-powered venue recommendations
                </p>
                <Button 
                  onClick={() => navigate('/preferences')}
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  Set Preferences
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </SafeComponent>

      {/* Main Content */}
      <SafeComponent componentName="StartNewDateCard">
        {!showEmptyState && (
          <StartNewDateCard />
        )}
      </SafeComponent>

      <SafeComponent componentName="DateInvitationsSection">
        <DateInvitationsSection
          invitations={availableInvitations}
          onAccept={handleAcceptWrapper}
          onDecline={handleDeclineWrapper}
          isLoading={invitationsLoading}
        />
      </SafeComponent>

      {/* Status Summary */}
      <SafeComponent componentName="InvitationStatus">
        <InvitationStatus invitationState={invitationState} />
      </SafeComponent>
    </main>
  );
};

export default HomeContent;
