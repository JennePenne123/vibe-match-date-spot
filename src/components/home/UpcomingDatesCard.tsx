import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ArrowRight, Calendar } from 'lucide-react';
import { useInvitations } from '@/hooks/useInvitations';
import DateInviteCard from '@/components/DateInviteCard';
import { DateInvitation } from '@/types/index';

const UpcomingDatesCard: React.FC = () => {
  const navigate = useNavigate();
  const { invitations, loading, acceptInvitation, declineInvitation, cancelInvitation } = useInvitations();

  // Filter and get upcoming dates (accepted/scheduled) regardless of direction
  const upcomingDates = React.useMemo(() => {
    console.log('📅 UPCOMING DATES DEBUG - Raw invitations:', invitations);
    console.log('📅 UPCOMING DATES DEBUG - Total invitations count:', invitations?.length);
    
    if (!invitations || invitations.length === 0) {
      console.log('📅 UPCOMING DATES DEBUG - No invitations found');
      return [];
    }
    
    const upcoming = invitations
      .filter(inv => {
        // Check both status and date_status for accepted/scheduled dates
        const isAccepted = inv.status === 'accepted';
        const isScheduled = (inv as any).date_status === 'scheduled';
        const isNotDeclined = inv.status !== 'declined';
        const isNotCancelled = inv.status !== 'cancelled';
        
        return (isAccepted || isScheduled) && isNotDeclined && isNotCancelled;
      })
      .sort((a, b) => {
        // Sort by proposed_date (earliest first)
        const dateA = a.proposed_date ? new Date(a.proposed_date).getTime() : Infinity;
        const dateB = b.proposed_date ? new Date(b.proposed_date).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 3)
      .map(inv => {
        // Show the other person's info based on direction
        if (inv.direction === 'received') {
          return {
            ...inv,
            sender: inv.sender ? {
              id: inv.sender_id,
              name: inv.sender.name,
              email: inv.sender.email,
              avatar_url: inv.sender.avatar_url,
              created_at: inv.created_at
            } : undefined,
            recipient: undefined,
            venue: inv.venue ? {
              id: inv.venue_id || '',
              name: inv.venue.name,
              address: inv.venue.address,
              image_url: inv.venue.image_url
            } : undefined
          } as DateInvitation;
        } else {
          // For sent invitations, show recipient info
          return {
            ...inv,
            sender: undefined,
            recipient: inv.recipient ? {
              id: inv.recipient_id,
              name: inv.recipient.name,
              email: inv.recipient.email,
              avatar_url: inv.recipient.avatar_url,
              created_at: inv.created_at
            } : undefined,
            venue: inv.venue ? {
              id: inv.venue_id || '',
              name: inv.venue.name,
              address: inv.venue.address,
              image_url: inv.venue.image_url
            } : undefined
          } as DateInvitation;
        }
      });
    
    console.log('📅 UPCOMING DATES DEBUG - Filtered upcoming dates:', upcoming);
    console.log('📅 UPCOMING DATES DEBUG - Upcoming dates count:', upcoming.length);
    
    return upcoming;
  }, [invitations]);

  const handleViewAll = () => {
    navigate('/invitations');
  };

  if (loading) {
    return (
      <Card variant="elegant" className="animate-fade-in">
        <CardHeader className="pb-3 bg-gradient-romantic">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-full bg-white/20 shadow-glow-sm">
              <Heart className="h-5 w-5" />
            </div>
            Upcoming Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (upcomingDates.length === 0) {
    return (
      <Card variant="glass" className="animate-fade-in">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-romantic/10 w-fit">
              <Calendar className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No upcoming dates yet</p>
            <p className="text-xs mt-2 text-muted-foreground/70">Accept invitations to see them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elegant" className="shadow-premium-lg animate-fade-in">
      <CardHeader className="pb-3 bg-gradient-romantic">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <div className="p-2 rounded-full bg-white/20 shadow-glow-sm">
            <Heart className="h-5 w-5" />
          </div>
          Upcoming Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {upcomingDates.map((invitation) => {
          // Determine direction based on which user data is present
          const direction = invitation.sender ? 'received' : 'sent';
          
          return (
            <DateInviteCard
              key={invitation.id}
              invitation={invitation}
              direction={direction}
              onAccept={acceptInvitation}
              onDecline={declineInvitation}
              onCancel={invitation.status === 'accepted' ? cancelInvitation : undefined}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingDatesCard;