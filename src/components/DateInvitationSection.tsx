import React from 'react';
import { useInvitations } from '@/hooks/useInvitations';
import DateInviteCard from '@/components/DateInviteCard';
import { useToast } from '@/hooks/use-toast';

interface DateInvite {
  id: number;
  friendName: string;
  friendAvatar: string;
  dateType: string;
  location: string;
  time: string;
  message: string;
  status: string;
  venueName: string;
  venueAddress: string;
  estimatedCost: string;
  duration: string;
  specialNotes: string;
  venueImage: string;
}

const DateInvitationSection: React.FC = () => {
  const { invitations, loading, acceptInvitation, declineInvitation, createTestInvitation } = useInvitations();
  const { toast } = useToast();

  // Filter for pending invitations only
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const handleAccept = async (id: number) => {
    const invitation = pendingInvitations.find(inv => parseInt(inv.id) === id);
    if (invitation) {
      await acceptInvitation(invitation.id);
      toast({
        title: "Date Accepted! 🎉",
        description: `You've accepted the date invitation from ${invitation.sender?.name || 'your friend'}. Time to get excited! ✨`,
        duration: 5000,
      });
    }
  };

  const handleDecline = async (id: number) => {
    const invitation = pendingInvitations.find(inv => parseInt(inv.id) === id);
    if (invitation) {
      await declineInvitation(invitation.id);
      toast({
        title: "Date Declined",
        description: `You've respectfully declined the invitation from ${invitation.sender?.name || 'your friend'}. No worries! 💙`,
        duration: 4000,
      });
    }
  };

  // Debug function to create test invitation
  const handleCreateTestInvitation = async () => {
    const success = await createTestInvitation();
    if (success) {
      toast({
        title: "Test Invitation Created! 🧪",
        description: "A sample date invitation has been added for testing",
        duration: 3000,
      });
    } else {
      toast({
        title: "Cannot Create Test Invitation",
        description: "Make sure you have friends and venues in the database",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Transform database invitation format to DateInviteCard format
  const transformInvitation = (dbInvitation: any): DateInvite => {
    return {
      id: parseInt(dbInvitation.id),
      friendName: dbInvitation.sender?.name || 'Friend',
      friendAvatar: dbInvitation.sender?.avatar_url || '',
      dateType: dbInvitation.title || 'Date',
      location: dbInvitation.venue?.name || 'TBD',
      time: dbInvitation.proposed_date 
        ? new Date(dbInvitation.proposed_date).toLocaleString()
        : 'Time TBD',
      message: dbInvitation.message || dbInvitation.ai_generated_message || 'Let\'s have a great time together!',
      status: dbInvitation.status,
      venueName: dbInvitation.venue?.name || 'Venue TBD',
      venueAddress: dbInvitation.venue?.address || 'Address TBD',
      estimatedCost: '$$',
      duration: '2-3 hours',
      specialNotes: dbInvitation.ai_reasoning || '',
      venueImage: dbInvitation.venue?.image_url || 'https://images.unsplash.com/photo-1721322800607-8c38375eef04'
    };
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-48 mb-3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Show test invitation creator in development
  if (pendingInvitations.length === 0) {
    return (
      <div className="space-y-4 mb-6">
        <div className="text-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Date Invitations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have any pending date invitations right now.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleCreateTestInvitation}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Create Test Invitation 🧪
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Pending Date Invitations</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {pendingInvitations.length} pending
        </span>
      </div>
      {pendingInvitations.map((invitation) => (
        <DateInviteCard
          key={invitation.id}
          invitation={transformInvitation(invitation)}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}
    </div>
  );
};

export default DateInvitationSection;