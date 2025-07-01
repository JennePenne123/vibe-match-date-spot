
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
  const { invitations, loading: invitationsLoading } = useInvitations();
  const { friends, loading: friendsLoading } = useFriends();
  const [showEmptyState, setShowEmptyState] = useState(false);

  const toggleEmptyState = () => setShowEmptyState(!showEmptyState);

  const hasNoFriends = friends.length === 0 && !friendsLoading;
  const hasNoInvitations = invitations.length === 0 && !invitationsLoading;
  const shouldShowEmptyState = (hasNoFriends || showEmptyState) && !friendsLoading;

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
              invitations={invitations}
              loading={invitationsLoading}
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
