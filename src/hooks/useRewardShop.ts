import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RewardVoucher {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  venue_id: string;
  venue_name: string;
  code: string;
  points_cost: number;
}

interface RewardRedemptionState {
  vouchers: RewardVoucher[];
  monthlyUsed: number;
  monthlyLimit: number;
  isPremium: boolean;
  premiumUntil: string | null;
  loading: boolean;
}

export const useRewardShop = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RewardRedemptionState>({
    vouchers: [],
    monthlyUsed: 0,
    monthlyLimit: 2,
    isPremium: false,
    premiumUntil: null,
    loading: true,
  });
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (user) loadShopData();
    else setState(s => ({ ...s, loading: false }));
  }, [user?.id]);

  const loadShopData = async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      // Fetch active vouchers with venue names
      const { data: vouchersData } = await supabase
        .from('vouchers')
        .select('id, title, description, discount_type, discount_value, venue_id, code, venues(name)')
        .eq('status', 'active')
        .gt('valid_until', new Date().toISOString());

      const vouchers: RewardVoucher[] = (vouchersData || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        discount_type: v.discount_type,
        discount_value: v.discount_value,
        venue_id: v.venue_id,
        venue_name: (v.venues as any)?.name || 'Venue',
        code: v.code,
        points_cost: Math.round(v.discount_value * 100),
      }));

      // Fetch monthly redemption count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await (supabase
        .from('reward_redemptions' as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .gte('created_at', startOfMonth.toISOString())) as any;

      // Fetch premium status
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('premium_until')
        .eq('user_id', user!.id)
        .maybeSingle();

      const premiumUntil = (pointsData as any)?.premium_until || null;
      const isPremium = premiumUntil ? new Date(premiumUntil) > new Date() : false;

      setState({
        vouchers,
        monthlyUsed: count ?? 0,
        monthlyLimit: 2,
        isPremium,
        premiumUntil,
        loading: false,
      });
    } catch (err) {
      console.error('Error loading shop data:', err);
      setState(s => ({ ...s, loading: false }));
    }
  };

  const redeemReward = async (rewardType: 'voucher' | 'premium', voucherId?: string) => {
    setRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-reward', {
        body: { reward_type: rewardType, voucher_id: voucherId },
      });

      if (error) throw error;

      if (data?.status === 'success') {
        // Refresh shop data
        await loadShopData();
        return { success: true, data };
      }

      return { success: false, error: data?.error || 'Unbekannter Fehler' };
    } catch (err: any) {
      console.error('Redeem error:', err);
      // Try to parse edge function error body
      const errorMsg = err?.message || 'Fehler beim Einlösen';
      return { success: false, error: errorMsg };
    } finally {
      setRedeeming(false);
    }
  };

  return {
    ...state,
    redeeming,
    redeemReward,
    refresh: loadShopData,
  };
};
