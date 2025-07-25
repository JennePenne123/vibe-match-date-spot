import React, { useState } from 'react';
import VenueCard from '@/components/VenueCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);

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

  // Get venue image
  const getVenueImage = () => {
    if (invitation.venue?.image_url) {
      return invitation.venue.image_url;
    }
    return 'https://images.unsplash.com/photo-1497644083578-611b798c60f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  };

  // Transform invitation data for display
  const displayData = {
    friendName: invitation.sender?.name || 'Unknown',
    friendAvatar: invitation.sender?.avatar_url,
    dateType: invitation.title || 'Date Invitation',
    timeProposed: invitation.proposed_date || 'Time TBD',
    location: invitation.venue?.name || 'Venue TBD',
    address: invitation.venue?.address || 'Address TBD',
    venueImage: getVenueImage(),
    message: invitation.message || '',
    venueName: invitation.venue?.name || 'Venue TBD',
    venueAddress: invitation.venue?.address || 'Address TBD',
    time: invitation.proposed_date || 'Time TBD',
    duration: '2-3 hours',
    estimatedCost: '$$',
    specialNotes: invitation.message || ''
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
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
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-pink-200">
              <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} />
              <AvatarFallback className="bg-pink-100 text-pink-600">
                {displayData.friendName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900">{displayData.friendName}</div>
              <div className="text-sm text-gray-600 font-normal">invited you to a date</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Venue Photos */}
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden">
              <img src={displayData.venueImage} alt={displayData.venueName} className="w-full h-48 object-cover" />
            </div>
            <div className="absolute top-3 left-3">
              <Badge className="bg-pink-500 text-white">
                {displayData.dateType}
              </Badge>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-700 italic">"{displayData.message}"</p>
          </div>

          {/* Venue Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">{displayData.venueName}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{displayData.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{displayData.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{displayData.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{displayData.estimatedCost}</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <strong>Address:</strong> {displayData.venueAddress}
            </div>

            {displayData.specialNotes && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Special Notes</div>
                    <div className="text-sm text-blue-700">{displayData.specialNotes}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {direction === 'received' && invitation.status === 'pending' && onAccept && onDecline && (
            <div className="flex space-x-2 mt-6">
              <Button 
                onClick={() => {
                  onAccept(invitation.id);
                  setIsOpen(false);
                }} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button 
                onClick={() => {
                  onDecline(invitation.id);
                  setIsOpen(false);
                }} 
                variant="outline" 
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}
          
          {direction === 'sent' && (
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Invitation sent • Status: <span className="capitalize font-medium">{invitation.status}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateInviteCard;