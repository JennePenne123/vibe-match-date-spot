
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Users } from 'lucide-react';
import { DateInviteCard } from '@/components/date-invite';
import SkeletonLoader from '@/components/SkeletonLoader';
import { DateInvitation } from '@/types/index';

interface DateInvitationsSectionProps {
  invitations: DateInvitation[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel?: (id: string) => void;
  isLoading?: boolean;
}

const DateInvitationsSection = ({ invitations, onAccept, onDecline, onCancel, isLoading = false }: DateInvitationsSectionProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
        </div>
        <SkeletonLoader variant="date-invite" count={3} />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="text-gray-300 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Date Invitations</h3>
          <p className="text-gray-600 mb-4">
            You don't have any pending date invitations right now. Start planning your own date or invite friends!
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/preferences')}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan a New Date
            </Button>
            <Button
              onClick={() => navigate('/my-friends')}
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
        <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          {invitations.length} new
        </div>
      </div>

      {invitations.map((invitation) => (
        <DateInviteCard
          key={invitation.id}
          invitation={invitation}
          direction="received"
          onAccept={onAccept}
          onDecline={onDecline}
          onCancel={invitation.status === 'accepted' ? onCancel : undefined}
        />
      ))}
    </div>
  );
};

export default DateInvitationsSection;
