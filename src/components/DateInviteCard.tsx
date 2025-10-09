import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info, User, Heart, CheckCircle, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { DateInvitation } from '@/types/index';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';
import { useBreakpoint } from '@/hooks/use-mobile';
import InvitationMessenger from '@/components/InvitationMessenger';
import { useInvitationMessages } from '@/hooks/useInvitationMessages';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper';
import { useAuth } from '@/contexts/AuthContext';
interface DateInviteCardProps {
  invitation: DateInvitation;
  direction: 'received' | 'sent';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
}
const DateInviteCard = ({
  invitation,
  direction,
  onAccept,
  onDecline,
  onCancel
}: DateInviteCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { isMobile } = useBreakpoint();
  const { user } = useAuth();
  const { unreadCount } = useInvitationMessages(invitation.id);

  // Status configuration
  const getStatusConfig = (status: string) => {
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

  // Get the primary venue image - prioritize Google Places photos over fallbacks
  const getVenueImage = () => {
    // First check for Google Places photos array (real venue photos)
    if (invitation.venue?.photos && invitation.venue.photos.length > 0) {
      return invitation.venue.photos[0].url;
    }

    // Check for direct image URL (backwards compatibility)
    if (invitation.venue?.image_url || invitation.venue?.image) {
      return invitation.venue.image_url || invitation.venue.image;
    }

    // Fallback to a restaurant placeholder
    return 'https://images.unsplash.com/photo-1497644083578-611b798c60f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  };

  // Transform invitation data for display based on direction
  const displayData = direction === 'received' ? {
    friendName: invitation.sender?.name || 'Unknown',
    friendAvatar: invitation.sender?.avatar_url,
    relationLabel: 'From',
    dateType: invitation.title || 'Date Invitation',
    timeProposed: invitation.proposed_date || 'Time TBD',
    location: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    address: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : invitation.venue?.address || 'Address TBD',
    venueImage: getVenueImage(),
    message: invitation.message || '',
    venueName: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    venueAddress: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : invitation.venue?.address || 'Address TBD',
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
    address: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : invitation.venue?.address || 'Address TBD',
    venueImage: getVenueImage(),
    message: invitation.message || '',
    venueName: extractVenueFromMessage(invitation.message || '', invitation.venue?.name || 'Venue TBD'),
    venueAddress: invitation.venue?.address === 'Venue details will be available soon' ? 'Address TBD' : invitation.venue?.address || 'Address TBD',
    time: invitation.proposed_date || 'Time TBD',
    duration: '2-3 hours',
    estimatedCost: '$$',
    specialNotes: ''
  };
  return <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className={`group relative transition-all duration-300 cursor-pointer rounded-xl overflow-hidden border border-border/20 shadow-sm hover:shadow-md ${statusConfig.bgGradient} hover:scale-[1.02] active:scale-[0.98]`} role="button" tabIndex={0} aria-label={`View date invitation from ${displayData.friendName}`} onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
      }}>
          {/* Status indicator */}
          <div className="absolute top-4 right-4 z-10">
            <Badge variant={statusConfig.variant} className="flex items-center gap-1.5 px-2.5 py-1">
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="text-sm sm:text-xs font-medium">{statusConfig.label}</span>
            </Badge>
          </div>

          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Header with Avatar and Friend Info */}
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} border-2 border-background shadow-lg ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40`}>
                    <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-bold text-sm">
                      {displayData.friendName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {direction === 'received' && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                      <Heart className="w-2.5 h-2.5 text-primary-foreground fill-current" />
                    </div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-1`}>
                    {direction === 'received' ? 'From: ' : 'To: '}
                    <span className="font-medium">{displayData.friendName}</span>
                  </div>
                </div>

                {/* Venue Image */}
                <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg overflow-hidden border-2 border-border shadow-md flex-shrink-0 bg-muted transition-all duration-300 group-hover:shadow-lg group-hover:scale-105`}>
                  <img src={displayData.venueImage.includes('undefined') ? 'https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' : displayData.venueImage} alt={displayData.venueName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              
              {/* Venue and Time Info */}
              <div className="space-y-1.5 pl-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
                  <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} leading-tight break-words ${statusConfig.textColor}`}>
                    {displayData.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {displayData.timeProposed !== 'Time TBD' ? new Date(displayData.timeProposed).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Time TBD'}
                  </span>
                </div>
              </div>

              {/* Quick Actions for pending invitations */}
              {direction === 'received' && invitation.status === 'pending' && onAccept && onDecline && (
                <div className={`flex gap-2 pt-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                  <Button 
                    size={isMobile ? "default" : "sm"}
                    onClick={e => {
                      e.stopPropagation();
                      onAccept(invitation.id);
                    }} 
                    className={`[background:var(--gradient-success)] hover:[background:var(--gradient-success-hover)] text-white border-0 ${isMobile ? 'w-full min-h-[44px] text-base' : 'flex-1 h-9 text-sm'}`}
                  >
                    <Check className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-3.5 h-3.5 mr-1.5'}`} />
                    Accept
                  </Button>
                  <Button 
                    size={isMobile ? "default" : "sm"}
                    variant="outline" 
                    onClick={e => {
                      e.stopPropagation();
                      onDecline(invitation.id);
                    }} 
                    className={`border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 ${isMobile ? 'w-full min-h-[44px] text-base' : 'flex-1 h-9 text-sm'}`}
                  >
                    <X className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-3.5 h-3.5 mr-1.5'}`} />
                    Decline
                  </Button>
                </div>
              )}
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

          {/* Message Button */}
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setMessengerOpen(true)}
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

          {direction === 'received' && invitation.status === 'pending' && onAccept && onDecline && <div className="flex space-x-2 mt-6">
              <Button onClick={() => {
            onAccept(invitation.id);
            setIsOpen(false);
          }} className="flex-1 [background:var(--gradient-success)] hover:[background:var(--gradient-success-hover)] text-white border-0">
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
          
          {invitation.status === 'accepted' && (
            <div className="space-y-3 mt-6">
              <div className="text-center py-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ Date Confirmed! See you there!
                </p>
              </div>
              {onCancel && (
                <Button 
                  onClick={() => setCancelDialogOpen(true)}
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Date
                </Button>
              )}
            </div>
          )}

          {invitation.status === 'cancelled' && (
            <div className="text-center py-3 bg-red-50 rounded-lg mt-6">
              <p className="text-sm text-red-600">
                🚫 This date has been cancelled
              </p>
            </div>
          )}
          
          {direction === 'sent' && invitation.status === 'pending' && <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Invitation sent • Status: <span className="capitalize font-medium">{invitation.status}</span>
              </p>
            </div>}
        </div>
      </DialogContent>
    </Dialog>

    {/* Cancel Confirmation Dialog */}
    <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this date?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your date at {displayData.venueName}? 
            {direction === 'received' ? ` ${displayData.friendName}` : ' Your partner'} will be notified about the cancellation.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep date</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (onCancel) {
                onCancel(invitation.id);
                setIsOpen(false);
                setCancelDialogOpen(false);
              }
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Yes, cancel date
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    {/* Messenger Sheet */}
    <Sheet open={messengerOpen} onOpenChange={setMessengerOpen}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={displayData.friendAvatar} />
              <AvatarFallback>
                {displayData.friendName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {displayData.friendName}
          </SheetTitle>
        </SheetHeader>
          <div className="h-[calc(100%-4rem)] mt-4">
            {user && (
              <ErrorBoundaryWrapper key={invitation.id}>
                <InvitationMessenger
                  invitationId={invitation.id}
                  currentUserId={user.id}
                  otherUser={{
                    id: direction === 'received' ? invitation.sender_id : invitation.recipient_id,
                    name: displayData.friendName,
                    avatar_url: displayData.friendAvatar
                  }}
                />
              </ErrorBoundaryWrapper>
            )}
          </div>
      </SheetContent>
    </Sheet>
  </>;
};
export default DateInviteCard;