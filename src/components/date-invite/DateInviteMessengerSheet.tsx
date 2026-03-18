import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import InvitationMessenger from '@/components/InvitationMessenger';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';
import { useTranslation } from 'react-i18next';

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
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNewDate = () => {
    onOpenChange(false);
    navigate('/home', {
      state: {
        startPlanning: true,
        preselectedPartnerId: otherUserId
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <div className="flex items-center justify-between w-full">
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={friendAvatar} referrerPolicy="no-referrer" />
                <AvatarFallback>
                  {friendName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {friendName}
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewDate}
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              {t('chat.newDate', 'New Date')}
            </Button>
          </div>
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
