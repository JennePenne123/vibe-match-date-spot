import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InvitationMessenger from '@/components/InvitationMessenger';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';

interface DateInviteMessengerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  friendAvatar?: string;
  invitationId: string;
  currentUserId: string;
  otherUserId: string;
}

const DateInviteMessengerSheet = ({
  open,
  onOpenChange,
  friendName,
  friendAvatar,
  invitationId,
  currentUserId,
  otherUserId
}: DateInviteMessengerSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={friendAvatar} referrerPolicy="no-referrer" />
              <AvatarFallback>
                {friendName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {friendName}
          </SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100%-4rem)] mt-4">
          <ErrorBoundaryWrapper key={invitationId} silent={true}>
            <InvitationMessenger
              invitationId={invitationId}
              currentUserId={currentUserId}
              otherUser={{
                id: otherUserId,
                name: friendName,
                avatar_url: friendAvatar
              }}
            />
          </ErrorBoundaryWrapper>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DateInviteMessengerSheet;
