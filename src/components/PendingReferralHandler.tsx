import { usePendingReferral } from '@/hooks/usePendingReferral';

/** Headless handler that links invite-link visitors to their inviter. */
const PendingReferralHandler = (): null => {
  usePendingReferral();
  return null;
};

export default PendingReferralHandler;