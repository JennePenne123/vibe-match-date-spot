
import React, { useState, useCallback, useMemo } from 'react';
import { useInvitations } from '@/hooks/useInvitations';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useFriends } from '@/hooks/useFriends';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import InvitationStatus from '@/components/InvitationStatus';
import SafeComponent from '@/components/SafeComponent';
import { useInvitationState } from '@/hooks/useInvitationState';
import SmartDatePlanningCTA from '@/components/home/SmartDatePlanningCTA';
import NoFriendsEmptyState from '@/components/home/NoFriendsEmptyState';
import AIRecommendationsSection from '@/components/home/AIRecommendationsSection';
import RealtimeStatusIndicator from '@/components/home/RealtimeStatusIndicator';
import DevelopmentControls from '@/components/home/DevelopmentControls';
import { useAuth } from '@/contexts/AuthContext';

const HomeContent: React.FC = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
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
        id: parseInt(inv.id) || Math.floor(Math.random() * 1000),
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

  // Check if user has friends
  const hasFriends = friends.length > 0;

  return (
    <main className="p-6 space-y-6">
      {/* Development/Testing Controls */}
      <DevelopmentControls 
        showEmptyState={showEmptyState}
        onToggleEmptyState={toggleEmptyState}
      />

      {/* Real-time Status Indicator */}
      <RealtimeStatusIndicator isLoading={invitationsLoading} />

      {/* Main Smart Date Planning CTA or Empty State */}
      {hasFriends ? <SmartDatePlanningCTA /> : <NoFriendsEmptyState />}

      {/* AI Recommendations Section - Only show if user has friends */}
      {hasFriends && (
        <AIRecommendationsSection 
          recommendations={recommendations}
          loading={aiLoading}
        />
      )}

      {/* Date Invitations Section - Only show if user has friends */}
      {hasFriends && (
        <SafeComponent componentName="DateInvitationsSection">
          <DateInvitationsSection
            invitations={availableInvitations}
            onAccept={handleAcceptWrapper}
            onDecline={handleDeclineWrapper}
            isLoading={invitationsLoading}
          />
        </SafeComponent>
      )}

      {/* Status Summary - Only show if user has friends */}
      {hasFriends && (
        <SafeComponent componentName="InvitationStatus">
          <InvitationStatus invitationState={invitationState} />
        </SafeComponent>
      )}
    </main>
  );
};

export default HomeContent;
