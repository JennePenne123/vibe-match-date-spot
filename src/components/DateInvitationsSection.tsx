
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import DateInviteCard from '@/components/DateInviteCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

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

interface DateInvitationsSectionProps {
  invitations: DateInvite[];
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  isLoading?: boolean;
}

const DateInvitationsSection = ({ invitations, onAccept, onDecline, isLoading = false }: DateInvitationsSectionProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="space-y-4" aria-label="Date invitations loading">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
        </div>
        <SkeletonLoader variant="date-invite" count={3} />
      </section>
    );
  }

  if (invitations.length === 0) {
    return (
      <section aria-label="Date invitations">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
        </div>
        <EmptyState
          icon={Plus}
          title="No Date Invitations"
          description="You don't have any pending date invitations right now. Start planning your own date or invite friends!"
          primaryAction={{
            label: "Plan a New Date",
            onClick: () => navigate('/preferences')
          }}
          secondaryAction={{
            label: "Invite Friends",
            onClick: () => navigate('/my-friends')
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Date invitations">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
        <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium" role="status">
          {invitations.length} new
        </div>
      </div>

      <div className="space-y-4" role="list">
        {invitations.map((invitation) => (
          <div key={invitation.id} role="listitem">
            <DateInviteCard
              invitation={invitation}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default DateInvitationsSection;
