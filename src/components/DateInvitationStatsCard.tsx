import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { useInvitations } from '@/hooks/useInvitations';

const DateInvitationStatsCard: React.FC = () => {
  const navigate = useNavigate();
  const { invitations, loading } = useInvitations();

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!invitations || invitations.length === 0) {
      return {
        receivedPending: 0,
        receivedAccepted: 0,
        sentPending: 0,
        sentAccepted: 0,
        totalNew: 0,
        hasInvitations: false
      };
    }

    const received = invitations.filter(inv => inv.direction === 'received');
    const sent = invitations.filter(inv => inv.direction === 'sent');

    return {
      receivedPending: received.filter(inv => inv.status === 'pending').length,
      receivedAccepted: received.filter(inv => inv.status === 'accepted').length,
      sentPending: sent.filter(inv => inv.status === 'pending').length,
      sentAccepted: sent.filter(inv => inv.status === 'accepted').length,
      totalNew: received.filter(inv => inv.status === 'pending').length,
      hasInvitations: invitations.length > 0
    };
  }, [invitations]);

  const handleViewAll = () => {
    navigate('/invitations');
  };

  const handlePlanDate = () => {
    navigate('/home'); // Redirect to home for collaborative planning
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats.hasInvitations) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No invitations yet. Ready to plan your first date?
          </p>
          <Button onClick={handlePlanDate} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Plan a New Date
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Invitations
          </div>
          {stats.totalNew > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.totalNew} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Received</p>
            <div className="flex gap-2">
              {stats.receivedPending > 0 && (
                <Badge variant="secondary">{stats.receivedPending} pending</Badge>
              )}
              {stats.receivedAccepted > 0 && (
                <Badge variant="default">{stats.receivedAccepted} accepted</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Sent</p>
            <div className="flex gap-2">
              {stats.sentPending > 0 && (
                <Badge variant="outline">{stats.sentPending} pending</Badge>
              )}
              {stats.sentAccepted > 0 && (
                <Badge variant="default">{stats.sentAccepted} accepted</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewAll} className="flex-1">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button onClick={handlePlanDate} className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Plan New
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateInvitationStatsCard;