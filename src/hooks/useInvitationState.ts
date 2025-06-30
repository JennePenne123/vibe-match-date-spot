
import { useState, useCallback } from 'react';

interface InvitationState {
  accepted: string[];
  declined: string[];
}

export const useInvitationState = () => {
  const [invitationState, setInvitationState] = useState<InvitationState>({
    accepted: [],
    declined: []
  });

  const handleAcceptInvitation = useCallback((id: string) => {
    setInvitationState(prev => ({
      accepted: [...prev.accepted, id],
      declined: prev.declined.filter(invId => invId !== id)
    }));
    console.log('Accepted invitation:', id);
  }, []);

  const handleDeclineInvitation = useCallback((id: string) => {
    setInvitationState(prev => ({
      declined: [...prev.declined, id],
      accepted: prev.accepted.filter(invId => invId !== id)
    }));
    console.log('Declined invitation:', id);
  }, []);

  return {
    invitationState,
    handleAcceptInvitation,
    handleDeclineInvitation
  };
};
