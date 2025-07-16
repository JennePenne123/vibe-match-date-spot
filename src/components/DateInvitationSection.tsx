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
  const { invitations, loading, acceptInvitation, declineInvitation } = useInvitations();
  const { toast } = useToast();

  // Filter for pending invitations only
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const handleAccept = async (id: number) => {
    const invitation = pendingInvitations.find(inv => parseInt(inv.id) === id);
    if (invitation) {
      await acceptInvitation(invitation.id);
      toast({
        title: "Date Accepted! 🎉",
        description: `You've accepted the date invitation from ${invitation.sender?.name}`,
      });
    }
  };

  const handleDecline = async (id: number) => {
    const invitation = pendingInvitations.find(inv => parseInt(inv.id) === id);
    if (invitation) {
      await declineInvitation(invitation.id);
      toast({
        title: "Date Declined",
        description: `You've declined the date invitation from ${invitation.sender?.name}`,
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

  if (loading || pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-semibold text-foreground">Pending Date Invitations</h2>
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