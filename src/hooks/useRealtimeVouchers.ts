import { useEffect, useState } from 'react';
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

export const useRealtimeVouchers = (partnerId: string | undefined): UseRealtimeVouchersReturn => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastRedemption, setLastRedemption] = useState<RedemptionEvent | null>(null);

  // Initial fetch
  useEffect(() => {
    if (!partnerId) return;

    const fetchVouchers = async () => {
      setLoading(true);
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
        toast.error('Failed to load vouchers');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [partnerId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel('partner-vouchers-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vouchers',
          filter: `partner_id=eq.${partnerId}`
        },
        (payload) => {
          console.log('Voucher updated:', payload);
          const updatedVoucher = payload.new as Voucher;
          
          setVouchers((prev) => {
            const index = prev.findIndex((v) => v.id === updatedVoucher.id);
            if (index !== -1) {
              const newVouchers = [...prev];
              newVouchers[index] = updatedVoucher;
              return newVouchers;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vouchers',
          filter: `partner_id=eq.${partnerId}`
        },
        (payload) => {
          console.log('New voucher created:', payload);
          const newVoucher = payload.new as Voucher;
          setVouchers((prev) => [newVoucher, ...prev]);
          toast.success(`Voucher "${newVoucher.title}" created`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'vouchers',
          filter: `partner_id=eq.${partnerId}`
        },
        (payload) => {
          console.log('Voucher deleted:', payload);
          const deletedId = payload.old.id as string;
          setVouchers((prev) => prev.filter((v) => v.id !== deletedId));
          toast.info('Voucher deleted');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voucher_redemptions'
        },
        async (payload) => {
          console.log('New redemption detected:', payload);
          const redemption = payload.new as RedemptionEvent;
          
          // Check if this redemption belongs to one of our vouchers
          const affectedVoucher = vouchers.find((v) => v.id === redemption.voucher_id);
          
          if (affectedVoucher) {
            setLastRedemption(redemption);
            
            // Show toast notification
            toast.success(
              `🎉 New redemption for "${affectedVoucher.title}"!`,
              {
                description: `$${redemption.discount_applied.toFixed(2)} discount applied`,
                duration: 5000,
              }
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast.success('Live updates enabled', { duration: 2000 });
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('Real-time connection failed');
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [partnerId, vouchers]);

  return {
    vouchers,
    loading,
    connected,
    lastRedemption,
  };
};
