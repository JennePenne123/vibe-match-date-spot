import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Check, X, Heart } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-mobile';
import { StatusConfig, DisplayData } from './types';

interface DateInviteCardPreviewProps {
  displayData: DisplayData;
  statusConfig: StatusConfig;
  direction: 'received' | 'sent';
  isPending: boolean;
  onOpen: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

const DateInviteCardPreview = ({
  displayData,
  statusConfig,
  direction,
  isPending,
  onOpen,
  onAccept,
  onDecline
}: DateInviteCardPreviewProps) => {
  const { isMobile } = useBreakpoint();
  const StatusIcon = statusConfig.icon;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <Card 
      className={`group relative transition-all duration-300 cursor-pointer rounded-xl overflow-hidden border border-border/20 shadow-sm hover:shadow-md ${statusConfig.bgGradient} hover:scale-[1.02] active:scale-[0.98]`}
      role="button"
      tabIndex={0}
      aria-label={`View date invitation from ${displayData.friendName}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
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
                <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-bold text-sm">
                  {displayData.friendName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {direction === 'received' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Heart className="w-2.5 h-2.5 text-primary-foreground fill-current" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-1`}>
                {direction === 'received' ? 'From: ' : 'To: '}
                <span className="font-medium">{displayData.friendName}</span>
              </div>
            </div>

            {/* Venue Image */}
            <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg overflow-hidden border-2 border-border shadow-md flex-shrink-0 bg-muted transition-all duration-300 group-hover:shadow-lg group-hover:scale-105`}>
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
                {displayData.timeProposed !== 'Time TBD' 
                  ? new Date(displayData.timeProposed).toLocaleDateString('en-US', {
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
          {direction === 'received' && isPending && onAccept && onDecline && (
            <div className={`flex gap-2 pt-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <Button 
                size={isMobile ? "default" : "sm"}
                onClick={e => {
                  e.stopPropagation();
                  onAccept();
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
                  onDecline();
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
  );
};

export default DateInviteCardPreview;
