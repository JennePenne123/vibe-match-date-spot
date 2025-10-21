
import React, { useState } from 'react';
import { useInvitations } from '@/hooks/useInvitations';
import DateInviteCard from '@/components/DateInviteCard';
import { useToast } from '@/hooks/use-toast';
import { DateInvitation } from '@/types/index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DateInvitationSection: React.FC = () => {
  const { invitations, loading, acceptInvitation, declineInvitation, cancelInvitation, fetchInvitations } = useInvitations();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter invitations by direction and status
  const receivedInvitations = invitations.filter(inv => inv.direction === 'received');
  const sentInvitations = invitations.filter(inv => inv.direction === 'sent');
  
  // Further filter by status within each direction
  const receivedPending = receivedInvitations.filter(inv => inv.status === 'pending');
  const receivedAccepted = receivedInvitations.filter(inv => inv.status === 'accepted');
  const receivedDeclined = receivedInvitations.filter(inv => inv.status === 'declined');
  const receivedCancelled = receivedInvitations.filter(inv => inv.status === 'cancelled');
  
  const sentPending = sentInvitations.filter(inv => inv.status === 'pending');
  const sentAccepted = sentInvitations.filter(inv => inv.status === 'accepted');
  const sentDeclined = sentInvitations.filter(inv => inv.status === 'declined');
  const sentCancelled = sentInvitations.filter(inv => inv.status === 'cancelled');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInvitations();
    setIsRefreshing(false);
  };

  const handleAccept = async (id: string) => {
    console.log('🎯 ACCEPT INVITATION - ID:', id, 'Type:', typeof id);
    const invitation = invitations.find(inv => inv.id === id);
    if (invitation) {
      await acceptInvitation(invitation.id);
      toast({
        title: "Date Accepted! 🎉",
        description: `You've accepted the date invitation from ${invitation.sender?.name || 'your friend'}. Time to get excited! ✨`,
        duration: 5000,
      });
    } else {
      console.error('🚨 ACCEPT INVITATION - Invitation not found for ID:', id);
    }
  };

  const handleDecline = async (id: string) => {
    console.log('🎯 DECLINE INVITATION - ID:', id, 'Type:', typeof id);
    const invitation = invitations.find(inv => inv.id === id);
    if (invitation) {
      await declineInvitation(invitation.id);
      toast({
        title: "Date Declined",
        description: `You've respectfully declined the invitation from ${invitation.sender?.name || 'your friend'}. No worries! 💙`,
        duration: 4000,
      });
    } else {
      console.error('🚨 DECLINE INVITATION - Invitation not found for ID:', id);
    }
  };

  const handleCancel = async (id: string) => {
    console.log('🎯 CANCEL INVITATION - ID:', id, 'Type:', typeof id);
    const invitation = invitations.find(inv => inv.id === id);
    if (invitation) {
      await cancelInvitation(invitation.id);
      const partnerName = invitation.direction === 'received' 
        ? invitation.sender?.name 
        : invitation.recipient?.name;
      toast({
        title: "Date Cancelled",
        description: `Your date has been cancelled. ${partnerName || 'Your partner'} has been notified.`,
        duration: 4000,
        variant: "destructive"
      });
    } else {
      console.error('🚨 CANCEL INVITATION - Invitation not found for ID:', id);
    }
  };

  // Transform database invitation format to DateInvitation format
  const transformInvitation = (dbInvitation: any): DateInvitation => {
    console.log('🔄 TRANSFORM INVITATION - Raw data:', {
      id: dbInvitation.id,
      idType: typeof dbInvitation.id,
      hasVenue: !!dbInvitation.venue,
      venueName: dbInvitation.venue?.name,
      hasSender: !!dbInvitation.sender
    });

    return {
      id: dbInvitation.id,
      sender_id: dbInvitation.sender_id,
      recipient_id: dbInvitation.recipient_id,
      venue_id: dbInvitation.venue_id,
      title: dbInvitation.title || 'Date',
      message: dbInvitation.message || dbInvitation.ai_generated_message || 'Let\'s have a great time together!',
      proposed_date: dbInvitation.proposed_date,
      status: dbInvitation.status,
      created_at: dbInvitation.created_at,
      sender: dbInvitation.sender,
      venue: dbInvitation.venue,
      // UI compatibility properties
      friendName: dbInvitation.sender?.name || 'Friend',
      friendAvatar: dbInvitation.sender?.avatar_url || '',
      dateType: dbInvitation.title || 'Date',
      location: dbInvitation.venue?.name || 'TBD',
      time: dbInvitation.proposed_date 
        ? new Date(dbInvitation.proposed_date).toLocaleString()
        : 'Time TBD',
      venueName: dbInvitation.venue?.name || 'Venue TBD',
      venueAddress: dbInvitation.venue?.address || 'Address TBD',
      estimatedCost: '$$',
      duration: '2-3 hours',
      specialRequests: dbInvitation.ai_reasoning || '',
      image: dbInvitation.venue?.image_url || 'https://images.unsplash.com/photo-1721322800607-8c38375eef04'
    };
  };

  // Show improved loading state with skeletons
  if (loading) {
    return (
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Show empty state when no invitations at all
  if (invitations.length === 0) {
    return (
      <div className="space-y-4 mb-6">
        <div className="text-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Date Invitations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have any date invitations yet. Use the Smart Date Planner below to create and send invitations to your friends!
          </p>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const renderInvitationList = (inviteList: any[], direction: 'received' | 'sent') => {
    if (inviteList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {direction} invitations in this category</p>
        </div>
      );
    }

    return inviteList.map((invitation) => (
      <DateInviteCard
        key={invitation.id}
        invitation={transformInvitation(invitation)}
        direction={direction}
        onAccept={direction === 'received' ? handleAccept : undefined}
        onDecline={direction === 'received' ? handleDecline : undefined}
        onCancel={invitation.status === 'accepted' ? handleCancel : undefined}
      />
    ));
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Date Invitations</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {invitations.length} total
          </Badge>
          <Button 
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            Received
            {receivedInvitations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {receivedInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            Sent
            {sentInvitations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {sentInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-6 mt-6">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
              <TabsTrigger value="pending" className="text-xs md:text-sm">
                Pending ({receivedPending.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs md:text-sm">
                Accepted ({receivedAccepted.length})
              </TabsTrigger>
              <TabsTrigger value="declined" className="text-xs md:text-sm">
                Declined ({receivedDeclined.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs md:text-sm">
                Cancelled ({receivedCancelled.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4 mt-4">
              {renderInvitationList(receivedPending, 'received')}
            </TabsContent>
            <TabsContent value="accepted" className="space-y-4 mt-4">
              {renderInvitationList(receivedAccepted, 'received')}
            </TabsContent>
            <TabsContent value="declined" className="space-y-4 mt-4">
              {renderInvitationList(receivedDeclined, 'received')}
            </TabsContent>
            <TabsContent value="cancelled" className="space-y-4 mt-4">
              {renderInvitationList(receivedCancelled, 'received')}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="sent" className="space-y-6 mt-6">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
              <TabsTrigger value="pending" className="text-xs md:text-sm">
                Pending ({sentPending.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs md:text-sm">
                Accepted ({sentAccepted.length})
              </TabsTrigger>
              <TabsTrigger value="declined" className="text-xs md:text-sm">
                Declined ({sentDeclined.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs md:text-sm">
                Cancelled ({sentCancelled.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4 mt-4">
              {renderInvitationList(sentPending, 'sent')}
            </TabsContent>
            <TabsContent value="accepted" className="space-y-4 mt-4">
              {renderInvitationList(sentAccepted, 'sent')}
            </TabsContent>
            <TabsContent value="declined" className="space-y-4 mt-4">
              {renderInvitationList(sentDeclined, 'sent')}
            </TabsContent>
            <TabsContent value="cancelled" className="space-y-4 mt-4">
              {renderInvitationList(sentCancelled, 'sent')}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DateInvitationSection;
