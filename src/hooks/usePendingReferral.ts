import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { processReferralSignup } from '@/services/referralService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'hioutz-pending-referral';
// Referral codes are 8-char uppercase hex (see generate_user_referral_code)
const CODE_REGEX = /^[A-Za-z0-9]{6,12}$/;

const readCode = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Captures an invite/referral code from the URL (`?ref=CODE`) and, once the
 * visitor is authenticated, links them to the inviter (accepted friendship +
 * referral record) so the friend shows up in the invite/partner flow.
 */
export const usePendingReferral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const processingRef = useRef(false);

  // 1) Capture ?ref= from the URL as early as possible and clean the URL.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('ref');
      if (code && CODE_REGEX.test(code)) {
        localStorage.setItem(STORAGE_KEY, code.toUpperCase());
      }
      if (params.has('ref')) {
        params.delete('ref');
        const search = params.toString();
        const newUrl = window.location.pathname + (search ? `?${search}` : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 2) Once authenticated, process the pending code exactly once.
  useEffect(() => {
    if (!user || processingRef.current) return;
    const code = readCode();
    if (!code) return;

    processingRef.current = true;
    (async () => {
      try {
        const result = await processReferralSignup(code, user.id);
        if (result.success && result.friendLinked) {
          toast({
            title: t('referral.friendLinkedTitle'),
            description: t('referral.friendLinkedDesc'),
          });
        }
      } catch (err) {
        console.error('Pending referral processing failed:', err);
      } finally {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        processingRef.current = false;
      }
    })();
  }, [user, toast, t]);
};