import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info, User, Heart, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          icon: CheckCircle,
          variant: 'default' as const,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          label: 'Accepted'
        };
      case 'declined':
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          bgColor: 'bg-red-50 dark:bg-red-950',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'Declined'
        };
      default:
        return {
          icon: AlertCircle,
          variant: 'secondary' as const,
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800',
          label: 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig(invitation.status);
  const StatusIcon = statusConfig.icon;

  // Extract venue name from message if venue data is placeholder
  const extractVenueFromMessage = (message: string, fallback: string) => {
    if (fallback === 'Selected Venue' || fallback === 'Venue TBD') {
      // Try to extract venue name from message like "I'd love to take you to Il Siciliano based on..."
      const venueMatch = message.match(/take you to ([^\.]+?) based on/i);
      if (venueMatch) {
        return venueMatch[1].trim();
      }
    }
    return fallback;
  };

  // Transform invitation data for display based on direction
  const displayData = direction === 'received' ? {
    friendName: invitation.sender?.name || 'Unknown',
    friendAvatar: invitation.sender?.avatar_url,
    relationLabel: 'From',
    dateType: invitation.title || 'Date Invitation',
    timeProposed: invitation.proposed_date || 'Time TBD',
    location: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    address: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : (invitation.venue?.address || 'Address TBD'),
    venueImage: invitation.venue?.image_url || 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    message: invitation.message || '',
    venueName: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    venueAddress: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : (invitation.venue?.address || 'Address TBD'),
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
    location: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    address: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : (invitation.venue?.address || 'Address TBD'),
    venueImage: invitation.venue?.image_url || 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    message: invitation.message || '',
    venueName: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    venueAddress: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : (invitation.venue?.address || 'Address TBD'),
    time: invitation.proposed_date || 'Time TBD',
    duration: '2-3 hours',
    estimatedCost: '$$',
    specialNotes: ''
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card 
          className={`group relative transition-all duration-300 cursor-pointer rounded-xl overflow-hidden border-2 hover:shadow-lg ${statusConfig.borderColor} ${statusConfig.bgColor} hover:scale-[1.02] active:scale-[0.98]`}
          role="button"
          tabIndex={0}
          aria-label={`View date invitation from ${displayData.friendName}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          {/* Status indicator */}
          <div className="absolute top-4 right-4 z-10">
            <Badge variant={statusConfig.variant} className="flex items-center gap-1.5 px-2.5 py-1">
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{statusConfig.label}</span>
            </Badge>
          </div>

          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Enhanced Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-16 h-16 border-3 border-background shadow-lg ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
                  <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-bold text-xl">
                    {displayData.friendName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {direction === 'received' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                    <Heart className="w-3 h-3 text-primary-foreground fill-current" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-lg leading-tight">
                      {displayData.friendName}
                    </h3>
                  </div>
                </div>
                
                {/* Venue and Time Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-foreground flex-1 truncate">
                      {displayData.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {displayData.timeProposed !== 'Time TBD' 
                        ? new Date(displayData.timeProposed).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Time TBD'
                      }
                    </span>
                  </div>
                </div>

                {/* Quick Actions for pending invitations */}
                {direction === 'received' && invitation.status === 'pending' && onAccept && onDecline && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccept(invitation.id);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecline(invitation.id);
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex-1"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Venue Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border shadow-md flex-shrink-0 bg-muted transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                <img 
                  src={displayData.venueImage.includes('undefined') 
                    ? 'https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' 
                    : displayData.venueImage
                  } 
                  alt={displayData.venueName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
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