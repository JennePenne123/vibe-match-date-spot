import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DateInvitation } from '@/types/index';
import { StatusConfig, DisplayData } from './types';

export const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'accepted':
      return {
        icon: CheckCircle,
        variant: 'default' as const,
        bgGradient: '[background:var(--gradient-accepted)]',
        textColor: 'text-foreground',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Accepted'
      };
    case 'declined':
      return {
        icon: XCircle,
        variant: 'destructive' as const,
        bgGradient: 'bg-red-50 dark:bg-red-950',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Declined'
      };
    case 'cancelled':
      return {
        icon: XCircle,
        variant: 'destructive' as const,
        bgGradient: 'bg-red-50 dark:bg-red-950',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Cancelled'
      };
    default:
      return {
        icon: AlertCircle,
        variant: 'secondary' as const,
        bgGradient: '[background:var(--gradient-pending)]',
        textColor: 'text-foreground',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Pending'
      };
  }
};

export const extractVenueFromMessage = (message: string, fallback: string): string => {
  if (fallback === 'Selected Venue' || fallback === 'Venue TBD') {
    const venueMatch = message.match(/take you to ([^\.]+?) based on/i);
    if (venueMatch) {
      return venueMatch[1].trim();
    }
  }
  return fallback;
};

export const getVenueImage = (invitation: DateInvitation): string => {
  if (invitation.venue?.photos && invitation.venue.photos.length > 0) {
    return invitation.venue.photos[0].url;
  }
  if (invitation.venue?.image_url || invitation.venue?.image) {
    return invitation.venue.image_url || invitation.venue.image || '';
  }
  return 'https://images.unsplash.com/photo-1497644083578-611b798c60f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
};

export const getRelationLabel = (status: string, dateStatus: string | null, direction: 'received' | 'sent'): string => {
  if (status === 'accepted' || dateStatus === 'scheduled') {
    return 'With';
  }
  return direction === 'received' ? 'From' : 'To';
};

export const transformToDisplayData = (
  invitation: DateInvitation,
  direction: 'received' | 'sent'
): DisplayData => {
  const message = invitation.message || '';
  const venueName = invitation.venue?.name || 'Venue TBD';
  const venueAddress = invitation.venue?.address === 'Venue details will be available soon' 
    ? 'Address TBD' 
    : invitation.venue?.address || 'Address TBD';
  
  const extractedVenueName = extractVenueFromMessage(message, venueName);
  const venueImage = getVenueImage(invitation);
  const relationLabel = getRelationLabel(invitation.status, invitation.date_status, direction);

  if (direction === 'received') {
    return {
      friendName: invitation.sender?.name || 'Unknown',
      friendAvatar: invitation.sender?.avatar_url,
      relationLabel,
      dateType: invitation.title || 'Date Invitation',
      timeProposed: invitation.proposed_date || 'Time TBD',
      location: extractedVenueName,
      address: venueAddress,
      venueImage,
      message,
      venueName: extractedVenueName,
      venueAddress,
      time: invitation.proposed_date || 'Time TBD',
      duration: '2-3 hours',
      estimatedCost: '$$',
      specialNotes: ''
    };
  }

  return {
    friendName: invitation.recipient?.name || 'Recipient',
    friendAvatar: invitation.recipient?.avatar_url,
    relationLabel,
    dateType: invitation.title || 'Date Invitation',
    timeProposed: invitation.proposed_date || 'Time TBD',
    location: extractedVenueName,
    address: venueAddress,
    venueImage,
    message,
    venueName: extractedVenueName,
    venueAddress,
    time: invitation.proposed_date || 'Time TBD',
    duration: '2-3 hours',
    estimatedCost: '$$',
    specialNotes: ''
  };
};
