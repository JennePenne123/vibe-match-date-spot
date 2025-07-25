import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info } from 'lucide-react';
import { DateInvitation } from '@/types/index';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';
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

  // Transform invitation data for display based on direction
  const displayData = direction === 'received' ? {
    friendName: invitation.sender?.name || 'Unknown',
    friendAvatar: invitation.sender?.avatar_url,
    relationLabel: 'From',
    dateType: invitation.title || 'Date Invitation',
    timeProposed: invitation.proposed_date || 'Time TBD',
    location: invitation.venue?.name || 'Venue TBD',
    address: invitation.venue?.address || 'Address TBD',
    venueImage: invitation.venue?.image_url || 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    message: invitation.message || '',
    venueName: invitation.venue?.name || 'Venue TBD',
    venueAddress: invitation.venue?.address || 'Address TBD',
    time: invitation.proposed_date || 'Time TBD',
    duration: '2-3 hours',
    estimatedCost: '$$',
    specialNotes: ''
  } : {
    friendName: 'Recipient',
    friendAvatar: undefined,
    relationLabel: 'To',
    dateType: invitation.title || 'Date Invitation',
    timeProposed: invitation.proposed_date || 'Time TBD',
    location: invitation.venue?.name || 'Venue TBD',
    address: invitation.venue?.address || 'Address TBD',
    venueImage: invitation.venue?.image_url || 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    message: invitation.message || '',
    venueName: invitation.venue?.name || 'Venue TBD',
    venueAddress: invitation.venue?.address || 'Address TBD',
    time: invitation.proposed_date || 'Time TBD',
    duration: '2-3 hours',
    estimatedCost: '$$',
    specialNotes: ''
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-pink-200 cursor-pointer rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="w-14 h-14 border-2 border-pink-200 shadow-sm">
                <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} />
                <AvatarFallback className="bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 font-semibold text-lg">
                  {displayData.friendName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                      {displayData.friendName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {displayData.relationLabel} • Status: <span className={`font-medium ${invitation.status === 'accepted' ? 'text-green-600' : invitation.status === 'declined' ? 'text-red-600' : 'text-amber-600'}`}>
                        {invitation.status}
                      </span>
                    </p>
                  </div>
                  
                </div>
                
                <div className="flex items-center gap-5 text-sm text-gray-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{displayData.timeProposed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{displayData.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
            {invitation.venue?.photos && invitation.venue.photos.length > 0 ? <VenuePhotoGallery photos={invitation.venue.photos} venueName={displayData.venueName} maxHeight="h-48" showThumbnails={invitation.venue.photos.length > 1} /> : <div className="relative rounded-lg overflow-hidden">
                <img src={displayData.venueImage} alt={displayData.venueName} className="w-full h-48 object-cover" />
              </div>}
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

            {displayData.specialNotes && <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Special Notes</div>
                    <div className="text-sm text-blue-700">{displayData.specialNotes}</div>
                  </div>
                </div>
              </div>}
          </div>

          {direction === 'received' && invitation.status === 'pending' && onAccept && onDecline && <div className="flex space-x-2 mt-6">
              <Button onClick={() => {
            onAccept(invitation.id);
            setIsOpen(false);
          }} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button onClick={() => {
            onDecline(invitation.id);
            setIsOpen(false);
          }} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>}
          
          {direction === 'sent' && <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Invitation sent • Status: <span className="capitalize font-medium">{invitation.status}</span>
              </p>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};
export default DateInviteCard;