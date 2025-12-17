import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info, MessageCircle, XCircle } from 'lucide-react';
import { DateRatingPrompt } from '@/components/DateRatingPrompt';
import { getInitials } from '@/lib/utils';
import { DisplayData } from './types';

interface DateInviteCardDetailsProps {
  displayData: DisplayData;
  direction: 'received' | 'sent';
  status: string;
  dateStatus: string | null;
  unreadCount: number;
  onAccept?: () => void;
  onDecline?: () => void;
  onOpenMessenger: () => void;
  onOpenCancelDialog: () => void;
  invitationId: string;
  hasCancel: boolean;
}

const DateInviteCardDetails = ({
  displayData,
  direction,
  status,
  dateStatus,
  unreadCount,
  onAccept,
  onDecline,
  onOpenMessenger,
  onOpenCancelDialog,
  invitationId,
  hasCancel
}: DateInviteCardDetailsProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-pink-200">
            <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-pink-100 text-pink-600">
              {getInitials(displayData.friendName)}
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

        {/* Message Button */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={onOpenMessenger}
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message {displayData.friendName}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Pending Actions */}
        {direction === 'received' && status === 'pending' && onAccept && onDecline && (
          <div className="flex space-x-2 mt-6">
            <Button 
              onClick={onAccept} 
              className="flex-1 [background:var(--gradient-success)] hover:[background:var(--gradient-success-hover)] text-white border-0"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button 
              onClick={onDecline} 
              variant="outline" 
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        )}
        
        {/* Accepted Status */}
        {status === 'accepted' && (
          <div className="space-y-3 mt-6">
            {dateStatus === 'completed' && (
              <DateRatingPrompt invitationId={invitationId} />
            )}
            
            {dateStatus !== 'completed' && (
              <div className="text-center py-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ Date Confirmed! See you there!
                </p>
              </div>
            )}
            
            {hasCancel && (
              <Button 
                onClick={onOpenCancelDialog}
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Date
              </Button>
            )}
          </div>
        )}

        {/* Cancelled Status */}
        {status === 'cancelled' && (
          <div className="text-center py-3 bg-red-50 rounded-lg mt-6">
            <p className="text-sm text-red-600">
              🚫 This date has been cancelled
            </p>
          </div>
        )}
        
        {/* Sent Pending Status */}
        {direction === 'sent' && status === 'pending' && (
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Invitation sent • Status: <span className="capitalize font-medium">{status}</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default DateInviteCardDetails;
