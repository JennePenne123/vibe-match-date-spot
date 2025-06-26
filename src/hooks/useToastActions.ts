
import { useToast } from '@/hooks/use-toast';

export const useToastActions = () => {
  const { toast } = useToast();

  const showSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'default',
    });
  };

  const showError = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'destructive',
    });
  };

  const showInvitationAccepted = (friendName: string) => {
    toast({
      title: '✅ Invitation Accepted',
      description: `You accepted the date invitation from ${friendName}`,
    });
  };

  const showInvitationDeclined = (friendName: string) => {
    toast({
      title: '❌ Invitation Declined',
      description: `You declined the date invitation from ${friendName}`,
    });
  };

  return {
    showSuccess,
    showError,
    showInvitationAccepted,
    showInvitationDeclined,
  };
};
