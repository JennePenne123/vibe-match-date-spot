import React, { useState, useCallback, useMemo } from 'react';
import { useInvitations } from '@/hooks/useInvitations';
import { Button } from '@/components/ui/button';
import StartNewDateCard from '@/components/StartNewDateCard';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import InvitationStatus from '@/components/InvitationStatus';
import SafeComponent from '@/components/SafeComponent';
import { useInvitationState } from '@/hooks/useInvitationState';

const HomeContent: React.FC = () => {
  const { invitations, loading: invitationsLoading, acceptInvitation, declineInvitation } = useInvitations();
  const { invitationState, handleAcceptInvitation, handleDeclineInvitation } = useInvitationState();
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
        specialNotes: inv.message || '',
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
