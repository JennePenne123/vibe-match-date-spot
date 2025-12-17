import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface DateInviteCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueName: string;
  friendName: string;
  direction: 'received' | 'sent';
  onConfirmCancel: () => void;
}

const DateInviteCancelDialog = ({
  open,
  onOpenChange,
  venueName,
  friendName,
  direction,
  onConfirmCancel
}: DateInviteCancelDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this date?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your date at {venueName}? 
            {direction === 'received' ? ` ${friendName}` : ' Your partner'} will be notified about the cancellation.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep date</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmCancel}
            className="bg-red-600 hover:bg-red-700"
          >
            Yes, cancel date
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DateInviteCancelDialog;
