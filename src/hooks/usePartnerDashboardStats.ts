import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  activeVouchers: number;
  totalRedemptions: number;
  thisMonthRedemptions: number;
  managedVenues: number;
  avgRating: number | null;
}

export const usePartnerDashboardStats = (userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    activeVouchers: 0,
    totalRedemptions: 0,
    thisMonthRedemptions: 0,
    managedVenues: 0,
    avgRating: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch all stats in parallel
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [vouchersRes, venuesRes, redemptionsRes, monthlyRes, feedbackRes] = await Promise.all([
          // Active vouchers count
          supabase
            .from('vouchers')
            .select('id', { count: 'exact', head: true })
            .eq('partner_id', userId)
            .eq('status', 'active')
            .gt('valid_until', now.toISOString()),
          
          // Managed venues count
          supabase
            .from('venue_partnerships')
            .select('id', { count: 'exact', head: true })
            .eq('partner_id', userId)
            .eq('status', 'approved'),
          
          // Total redemptions
          supabase
            .from('voucher_redemptions')
            .select('id, voucher_id, vouchers!inner(partner_id)', { count: 'exact', head: true })
            .eq('vouchers.partner_id', userId),
          
          // This month redemptions
          supabase
            .from('voucher_redemptions')
            .select('id, voucher_id, vouchers!inner(partner_id)', { count: 'exact', head: true })
            .eq('vouchers.partner_id', userId)
            .gte('redeemed_at', startOfMonth),
          
          // Average venue rating via date_feedback for partner's venues
          supabase
            .from('date_feedback')
            .select('venue_rating')
            .not('venue_rating', 'is', null),
        ]);

        setStats({
          activeVouchers: vouchersRes.count ?? 0,
          totalRedemptions: redemptionsRes.count ?? 0,
          thisMonthRedemptions: monthlyRes.count ?? 0,
          managedVenues: venuesRes.count ?? 0,
          avgRating: feedbackRes.data && feedbackRes.data.length > 0
            ? Math.round((feedbackRes.data.reduce((sum, f) => sum + (f.venue_rating ?? 0), 0) / feedbackRes.data.length) * 10) / 10
            : null,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};
