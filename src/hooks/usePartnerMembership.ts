import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PartnerTier = 'free' | 'pro';

interface TierLimits {
  maxVenues: number;
  maxActiveVouchers: number;
  hasAdvancedAnalytics: boolean;
  hasCityRankings: boolean;
  hasPartnerNetwork: boolean;
  hasVisibilityBoost: boolean;
  hasReports: boolean;
}

const TIER_LIMITS: Record<PartnerTier, TierLimits> = {
  free: {
    maxVenues: 1,
    maxActiveVouchers: 2,
    hasAdvancedAnalytics: false,
    hasCityRankings: false,
    hasPartnerNetwork: false,
    hasVisibilityBoost: false,
    hasReports: false,
  },
  pro: {
    maxVenues: 999,
    maxActiveVouchers: 999,
    hasAdvancedAnalytics: true,
    hasCityRankings: true,
    hasPartnerNetwork: true,
    hasVisibilityBoost: true,
    hasReports: true,
  },
};

interface PartnerMembershipState {
  tier: PartnerTier;
  isFoundingPartner: boolean;
  membershipValidUntil: string | null;
  limits: TierLimits;
  isPro: boolean;
  loading: boolean;
}

export const usePartnerMembership = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PartnerMembershipState>({
    tier: 'free',
    isFoundingPartner: false,
    membershipValidUntil: null,
    limits: TIER_LIMITS.free,
    isPro: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('partner_profiles')
        .select('membership_tier, membership_valid_until, is_founding_partner')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const tier = (data as any).membership_tier as PartnerTier || 'free';
        const validUntil = (data as any).membership_valid_until as string | null;
        const isFounding = (data as any).is_founding_partner as boolean || false;

        // Check if pro is still valid
        const isProActive = tier === 'pro' && (!validUntil || new Date(validUntil) > new Date());
        const effectiveTier: PartnerTier = isProActive ? 'pro' : 'free';

        setState({
          tier: effectiveTier,
          isFoundingPartner: isFounding,
          membershipValidUntil: validUntil,
          limits: TIER_LIMITS[effectiveTier],
          isPro: isProActive,
          loading: false,
        });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    };

    fetch();
  }, [user?.id]);

  const canUseFeature = useMemo(() => ({
    cityRankings: state.limits.hasCityRankings,
    partnerNetwork: state.limits.hasPartnerNetwork,
    advancedAnalytics: state.limits.hasAdvancedAnalytics,
    reports: state.limits.hasReports,
    visibilityBoost: state.limits.hasVisibilityBoost,
  }), [state.limits]);

  return { ...state, canUseFeature };
};
