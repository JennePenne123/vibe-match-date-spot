import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useInvitationMessages } from '@/hooks/useInvitationMessages';
import { useAuth } from '@/contexts/AuthContext';
import { DateInviteCardProps } from './types';
import { getStatusConfig, transformToDisplayData } from './utils';
import DateInviteCardPreview from './DateInviteCardPreview';
import DateInviteCardDetails from './DateInviteCardDetails';
import DateInviteCancelDialog from './DateInviteCancelDialog';
import DateInviteMessengerSheet from './DateInviteMessengerSheet';

const DateInviteCard = ({
  invitation,
  direction,
  onAccept,
  onDecline,
  onCancel
}: DateInviteCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { user } = useAuth();
  const { unreadCount } = useInvitationMessages(invitation.id);

  const statusConfig = getStatusConfig(invitation.status);
  const displayData = transformToDisplayData(invitation, direction);

  const handleAccept = () => {
    if (onAccept) {
      onAccept(invitation.id);
      setIsOpen(false);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline(invitation.id);
      setIsOpen(false);
    }
  };

  const handleConfirmCancel = () => {
    if (onCancel) {
      onCancel(invitation.id);
      setIsOpen(false);
      setCancelDialogOpen(false);
    }
  };

  const otherUserId = direction === 'received' ? invitation.sender_id : invitation.recipient_id;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div>
            <DateInviteCardPreview
              displayData={displayData}
              statusConfig={statusConfig}
              direction={direction}
              isPending={invitation.status === 'pending'}
              onOpen={() => setIsOpen(true)}
              onAccept={onAccept ? handleAccept : undefined}
              onDecline={onDecline ? handleDecline : undefined}
            />
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-md mx-auto">
          <DateInviteCardDetails
            displayData={displayData}
            direction={direction}
            status={invitation.status}
            dateStatus={invitation.date_status}
            unreadCount={unreadCount}
            onAccept={onAccept ? handleAccept : undefined}
            onDecline={onDecline ? handleDecline : undefined}
            onOpenMessenger={() => setMessengerOpen(true)}
            onOpenCancelDialog={() => setCancelDialogOpen(true)}
            invitationId={invitation.id}
            hasCancel={!!onCancel}
          />
        </DialogContent>
      </Dialog>

      <DateInviteCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        venueName={displayData.venueName}
        friendName={displayData.friendName}
        direction={direction}
        onConfirmCancel={handleConfirmCancel}
      />

      {user && (
        <DateInviteMessengerSheet
          open={messengerOpen}
          onOpenChange={setMessengerOpen}
          friendName={displayData.friendName}
          friendAvatar={displayData.friendAvatar}
          invitationId={invitation.id}
          currentUserId={user.id}
          otherUserId={otherUserId}
        />
      )}
    </>
  );
};

export default DateInviteCard;
