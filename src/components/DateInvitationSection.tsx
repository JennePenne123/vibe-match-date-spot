
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvitations } from '@/hooks/useInvitations';
import { DateInviteCard } from '@/components/date-invite';
import { useToast } from '@/hooks/use-toast';
import { DateInvitation } from '@/types/index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, UserPlus, Mail, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReferral } from '@/hooks/useReferral';

const InviteFriendsSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { referralLink, copyReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);

  const inviteLink = referralLink || window.location.origin;
  const inviteText = t('myFriends.inviteMessage', { link: inviteLink });

  const handleInviteEmail = () => {
    const subject = encodeURIComponent(t('myFriends.inviteEmailSubject', 'Komm zu Dzeng!'));
    const body = encodeURIComponent(inviteText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleInviteWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank');
  };

  const handleInviteTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteText)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      const success = referralLink ? await copyReferralLink() : false;
      if (!success) await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ title: t('myFriends.linkCopied') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('myFriends.inviteMore')}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleInviteEmail} className="gap-1.5 text-xs">
          <Mail className="w-3.5 h-3.5" />
          E-Mail
        </Button>
        <Button variant="outline" size="sm" onClick={handleInviteWhatsApp} className="gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20">
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={handleInviteTelegram} className="gap-1.5 text-xs text-blue-500 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20">
          <Send className="w-3.5 h-3.5" />
          Telegram
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t('myFriends.copied') : t('myFriends.copyLink')}
        </Button>
      </div>
    </div>
  );
};

const DateInvitationSection: React.FC = () => {
  const { t } = useTranslation();
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
        title: t('invitationsSection.dateAcceptedTitle'),
        description: t('invitationsSection.dateAcceptedDesc', { name: invitation.sender?.name || 'your friend' }),
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
        title: t('invitationsSection.dateDeclinedTitle'),
        description: t('invitationsSection.dateDeclinedDesc', { name: invitation.sender?.name || 'your friend' }),
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
        title: t('invitationsSection.dateCancelledTitle'),
        description: t('invitationsSection.dateCancelledDesc', { name: partnerName || 'Your partner' }),
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
          <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('invitationsSection.emptyTitle')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('invitationsSection.emptyDesc')}
          </p>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('invitationsSection.refresh')}
          </Button>
        </div>
        <InviteFriendsSection />
      </div>
    );
  }

  const renderInvitationList = (inviteList: any[], direction: 'received' | 'sent') => {
    if (inviteList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('invitationsSection.noInCategory', { direction: t(direction === 'received' ? 'invitationsSection.directionReceived' : 'invitationsSection.directionSent') })}</p>
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
        <h2 className="text-lg font-semibold text-foreground">{t('invitationsSection.title')}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {t('invitationsSection.total', { count: invitations.length })}
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
            {t('invitationsSection.received')}
            {receivedInvitations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {receivedInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            {t('invitationsSection.sent')}
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
                {t('invitationsSection.pending')} ({receivedPending.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs md:text-sm">
                {t('invitationsSection.accepted')} ({receivedAccepted.length})
              </TabsTrigger>
              <TabsTrigger value="declined" className="text-xs md:text-sm">
                {t('invitationsSection.declined')} ({receivedDeclined.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs md:text-sm">
                {t('invitationsSection.cancelled')} ({receivedCancelled.length})
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
                {t('invitationsSection.pending')} ({sentPending.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs md:text-sm">
                {t('invitationsSection.accepted')} ({sentAccepted.length})
              </TabsTrigger>
              <TabsTrigger value="declined" className="text-xs md:text-sm">
                {t('invitationsSection.declined')} ({sentDeclined.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs md:text-sm">
                {t('invitationsSection.cancelled')} ({sentCancelled.length})
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
      <InviteFriendsSection />
    </div>
  );
};

export default DateInvitationSection;
