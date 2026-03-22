import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dateCancel.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dateCancel.description', { venue: venueName })}{' '}
            {direction === 'received'
              ? t('dateCancel.partnerNotified', { name: friendName })
              : t('dateCancel.yourPartnerNotified')}{' '}
            {t('dateCancel.cannotUndo')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('dateCancel.keepDate')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmCancel}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('dateCancel.confirmCancel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DateInviteCancelDialog;
