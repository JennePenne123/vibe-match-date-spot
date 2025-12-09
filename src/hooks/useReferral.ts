import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  getReferralStats,
  getReferralLink,
  type ReferralStats,
} from '@/services/referralService';

export const useReferral = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getReferralStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading referral stats:', err);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Real-time subscription for referral updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`referrals-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        () => {
          console.log('Referral update detected');
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadStats]);

  const referralLink = stats?.referralCode ? getReferralLink(stats.referralCode) : null;

  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    if (!referralLink) return false;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      return true;
    } catch (err) {
      console.error('Failed to copy link:', err);
      return false;
    }
  }, [referralLink]);

  const copyReferralCode = useCallback(async (): Promise<boolean> => {
    if (!stats?.referralCode) return false;
    
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      return true;
    } catch (err) {
      console.error('Failed to copy code:', err);
      return false;
    }
  }, [stats?.referralCode]);

  return {
    stats,
    loading,
    error,
    referralLink,
    copyReferralLink,
    copyReferralCode,
    refresh: loadStats,
  };
};
