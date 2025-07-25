import React, { useState } from 'react';
import VenueCard from '@/components/VenueCard';
import { DateInvitation } from '@/types/index';

interface DateInviteCardProps {
  invitation: DateInvitation;
  direction: 'received' | 'sent';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

const DateInviteCard = ({
  invitation,
  direction,
  onAccept,
  onDecline
}: DateInviteCardProps) => {

  // Transform invitation data to venue format
  const transformToVenue = () => {
    return {
      id: invitation.venue_id || invitation.id,
      name: invitation.venue?.name || 'Venue TBD',
      description: invitation.message || 'A wonderful place for your date',
      address: invitation.venue?.address || 'Address TBD',
      image_url: invitation.venue?.image_url || 'https://images.unsplash.com/photo-1497644083578-611b798c60f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      rating: 4.5, // Default rating
      cuisine_type: 'Restaurant',
      price_range: '$$'
    };
  };

  // Extract partner names
  const getPartnerNames = () => {
    if (direction === 'received') {
      return [invitation.sender?.name || 'Friend'];
    }
    return ['Friend']; // For sent invitations
  };

  // Get date type from invitation
  const getDateType = () => {
    return invitation.title || 'Date invitation';
  };

  // Format date time
  const getDateTime = () => {
    if (invitation.proposed_date) {
      return new Date(invitation.proposed_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Time TBD';
  };

  // Handle accept action
  const handleAccept = () => {
    if (onAccept) {
      onAccept(invitation.id);
    }
  };

  // Handle decline action
  const handleDecline = () => {
    if (onDecline) {
      onDecline(invitation.id);
    }
  };

  // Only show invitation actions for received pending invitations
  const showInvitationActions = direction === 'received' && invitation.status === 'pending';

  return (
    <VenueCard 
      venue={transformToVenue()}
      showInvitationActions={showInvitationActions}
      partnerNames={getPartnerNames()}
      partnerAvatars={invitation.sender?.avatar_url ? [invitation.sender.avatar_url] : []}
      dateType={getDateType()}
      dateTime={getDateTime()}
      category={invitation.venue?.cuisine_type || 'Dining'}
      onAccept={showInvitationActions ? handleAccept : undefined}
      onDecline={showInvitationActions ? handleDecline : undefined}
      showMatchScore={false}
      showActions={false}
    />
  );
};

export default DateInviteCard;