import { usePendingReferral } from '@/hooks/usePendingReferral';
import { usePendingGroupInvite } from '@/hooks/usePendingGroupInvite';

/** Headless handler that links invite-link visitors to their inviter. */
const PendingReferralHandler = (): null => {
  usePendingReferral();
  usePendingGroupInvite();
  return null;
};

export default PendingReferralHandler;