import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingState {
  hasProfile: boolean;
  hasVenues: boolean;
  hasVouchers: boolean;
  loading: boolean;
}

export const usePartnerOnboardingState = (userId?: string): OnboardingState => {
  const [state, setState] = useState<OnboardingState>({
    hasProfile: false,
    hasVenues: false,
    hasVouchers: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      try {
        const [profileRes, venuesRes, vouchersRes] = await Promise.all([
          supabase.from('partner_profiles').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('venue_partnerships').select('id', { count: 'exact', head: true }).eq('partner_id', userId).eq('status', 'approved'),
          supabase.from('vouchers').select('id', { count: 'exact', head: true }).eq('partner_id', userId),
        ]);

        setState({
          hasProfile: (profileRes.count ?? 0) > 0,
          hasVenues: (venuesRes.count ?? 0) > 0,
          hasVouchers: (vouchersRes.count ?? 0) > 0,
          loading: false,
        });
      } catch {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    check();
  }, [userId]);

  return state;
};
