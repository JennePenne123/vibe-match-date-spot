import { usePartnerVerification } from './usePartnerVerification';

/**
 * Hook that checks if a partner is soft-locked due to expired verification deadline.
 * Returns isLocked=true when the partner has not verified AND the 7-day deadline has passed.
 */
export function usePartnerVerificationGuard() {
  const { verification, loading, isExpired } = usePartnerVerification();

  const isLocked = !loading && verification !== null && isExpired && verification.verification_status !== 'verified' && verification.verification_status !== 'pending_review';

  return { isLocked, loading, verification, isExpired };
}
