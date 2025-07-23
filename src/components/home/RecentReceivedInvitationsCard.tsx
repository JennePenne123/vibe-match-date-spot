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

const RecentReceivedInvitationsCard: React.FC = () => {
  const navigate = useNavigate();
  const { invitations, loading, acceptInvitation, declineInvitation } = useInvitations();

  // Filter and get the 3 most recent received invitations
  const recentReceivedInvitations = React.useMemo(() => {
    if (!invitations || invitations.length === 0) return [];
    
    const received = invitations
      .filter(inv => inv.direction === 'received')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(inv => ({
        ...inv,
        sender: inv.sender ? {
          id: inv.sender_id,
          name: inv.sender.name,
          email: inv.sender.email,
          avatar_url: inv.sender.avatar_url
        } : undefined,
        venue: inv.venue ? {
          id: inv.venue_id || '',
          name: inv.venue.name,
          address: inv.venue.address,
          image_url: inv.venue.image_url
        } : undefined
      } as DateInvitation));
    
    return received;
  }, [invitations]);

  const pendingCount = React.useMemo(() => {
    return recentReceivedInvitations.filter(inv => inv.status === 'pending').length;
  }, [recentReceivedInvitations]);

  const handleViewAll = () => {
    navigate('/invitations');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Recent Invitations
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

  if (recentReceivedInvitations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Recent Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No date invitations yet
            </p>
            <p className="text-xs text-muted-foreground">
              When someone invites you on a date, you'll see it here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Recent Invitations
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingCount} need response
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {recentReceivedInvitations.map((invitation) => (
            <DateInviteCard
              key={invitation.id}
              invitation={invitation}
              direction="received"
              onAccept={acceptInvitation}
              onDecline={declineInvitation}
            />
          ))}
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleViewAll} 
          className="w-full mt-4"
        >
          View All Invitations
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentReceivedInvitationsCard;