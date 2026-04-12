import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Voucher {
  id: string;
  title: string;
  code: string;
  discount_type: string;
  discount_value: number;
  status: string;
  current_redemptions: number;
  max_redemptions: number | null;
  valid_from: string;
  valid_until: string;
  venue_id: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  terms_conditions: string | null;
  min_booking_value: number | null;
  applicable_days: string[] | null;
  applicable_times: string[] | null;
}

interface RedemptionEvent {
  id: string;
  voucher_id: string;
  user_id: string;
  discount_applied: number;
  booking_value: number | null;
  redeemed_at: string;
}

interface UseRealtimeVouchersReturn {
  vouchers: Voucher[];
  loading: boolean;
  connected: boolean;
  lastRedemption: RedemptionEvent | null;
}

const POLL_INTERVAL = 15000; // 15 seconds

export const useRealtimeVouchers = (partnerId: string | undefined): UseRealtimeVouchersReturn => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastRedemption, setLastRedemption] = useState<RedemptionEvent | null>(null);
  const lastRedemptionCheckRef = useRef<string>(new Date().toISOString());
  const vouchersRef = useRef<Voucher[]>([]);

  useEffect(() => {
    vouchersRef.current = vouchers;
  }, [vouchers]);

  const fetchVouchers = useCallback(async (showLoading = false) => {
    if (!partnerId) return;
    if (showLoading) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      if (showLoading) toast.error('Failed to load vouchers');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [partnerId]);

  const checkNewRedemptions = useCallback(async () => {
    if (!partnerId) return;

    try {
      const { data, error } = await supabase
        .from('voucher_redemptions')
        .select('*')
        .gt('redeemed_at', lastRedemptionCheckRef.current)
        .order('redeemed_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const redemption of data) {
          const affectedVoucher = vouchersRef.current.find(v => v.id === redemption.voucher_id);
          if (affectedVoucher) {
            setLastRedemption(redemption as RedemptionEvent);
            toast.success(`🎉 New redemption for "${affectedVoucher.title}"!`, {
              description: `$${redemption.discount_applied.toFixed(2)} discount applied`,
              duration: 5000,
            });
          }
        }
        lastRedemptionCheckRef.current = data[0].redeemed_at;
        // Refresh vouchers to get updated redemption counts
        await fetchVouchers();
      }
    } catch (error) {
      console.error('Error checking redemptions:', error);
    }
  }, [partnerId, fetchVouchers]);

  // Initial fetch
  useEffect(() => {
    if (!partnerId) {
      setVouchers([]);
      setLastRedemption(null);
      setLoading(false);
      setConnected(false);
      return;
    }

    fetchVouchers(true);
    lastRedemptionCheckRef.current = new Date().toISOString();
  }, [partnerId, fetchVouchers]);

  // Polling instead of Realtime (vouchers removed from publication for security)
  useEffect(() => {
    if (!partnerId) return;

    setConnected(true);

    const interval = setInterval(async () => {
      await fetchVouchers();
      await checkNewRedemptions();
    }, POLL_INTERVAL);

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [partnerId, fetchVouchers, checkNewRedemptions]);

  return {
    vouchers,
    loading,
    connected,
    lastRedemption,
  };
};
