
import React, { useState } from 'react';
import { useInvitations } from '@/hooks/useInvitations';
import { useFriends } from '@/hooks/useFriends';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import NoFriendsEmptyState from './NoFriendsEmptyState';
import SmartDatePlanningCTA from './SmartDatePlanningCTA';
import DevelopmentControls from './DevelopmentControls';
import TestDataSetup from './TestDataSetup';
import RealtimeStatusIndicator from './RealtimeStatusIndicator';
import SafeComponent from '@/components/SafeComponent';

const HomeContent: React.FC = () => {
  const { invitations, loading: invitationsLoading, acceptInvitation, declineInvitation } = useInvitations();
  const { friends, loading: friendsLoading } = useFriends();
  const [showEmptyState, setShowEmptyState] = useState(false);

  const toggleEmptyState = () => setShowEmptyState(!showEmptyState);

  const hasNoFriends = friends.length === 0 && !friendsLoading;
  const hasNoInvitations = invitations.length === 0 && !invitationsLoading;
  const shouldShowEmptyState = (hasNoFriends || showEmptyState) && !friendsLoading;

  // Transform invitations to match DateInvite interface
  const transformedInvitations = invitations.map(inv => ({
    id: parseInt(inv.id) || Math.floor(Math.random() * 1000),
    friendName: inv.sender?.name || 'Unknown',
    friendAvatar: inv.sender?.avatar_url || '',
    dateType: 'dinner',
    location: inv.venue?.address || 'Location TBD',
    time: inv.proposed_date ? new Date(inv.proposed_date).toLocaleTimeString() : 'Time TBD',
    message: inv.message || inv.title,
    status: inv.status,
    venueName: inv.venue?.name || 'Venue TBD',
    venueAddress: inv.venue?.address || 'Address TBD',
    estimatedCost: '$50-100',
    duration: '2 hours',
    specialNotes: inv.ai_reasoning || inv.message || '',
    venueImage: inv.venue?.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  }));

  // Handle invitation actions with proper ID conversion
  const handleAccept = async (id: number) => {
    const invitation = invitations.find(inv => parseInt(inv.id) === id);
    if (invitation) {
      await acceptInvitation(invitation.id);
    }
  };

  const handleDecline = async (id: number) => {
    const invitation = invitations.find(inv => parseInt(inv.id) === id);
    if (invitation) {
      await declineInvitation(invitation.id);
    }
  };

  if (invitationsLoading || friendsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SafeComponent componentName="TestDataSetup">
        <TestDataSetup />
      </SafeComponent>

      <SafeComponent componentName="DevelopmentControls">
        <DevelopmentControls 
          showEmptyState={showEmptyState}
          onToggleEmptyState={toggleEmptyState}
        />
      </SafeComponent>

      {shouldShowEmptyState ? (
        <SafeComponent componentName="NoFriendsEmptyState">
          <NoFriendsEmptyState />
        </SafeComponent>
      ) : (
        <div className="space-y-6">
          <SafeComponent componentName="SmartDatePlanningCTA">
            <SmartDatePlanningCTA />
          </SafeComponent>

          <SafeComponent componentName="DateInvitationsSection">
            <DateInvitationsSection 
              invitations={transformedInvitations}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isLoading={invitationsLoading}
            />
          </SafeComponent>

          <SafeComponent componentName="RealtimeStatusIndicator">
            <RealtimeStatusIndicator isLoading={invitationsLoading} />
          </SafeComponent>
        </div>
      )}
    </div>
  );
};

export default HomeContent;
