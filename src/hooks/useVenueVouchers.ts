import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VoucherBadge {
  id: string;
  title: string;
  discount_type: 'percentage' | 'fixed' | 'free_item';
  discount_value: number;
  code: string;
  venue_id: string;
}

export const useVenueVouchers = (venueIds: string[]) => {
  const [vouchers, setVouchers] = useState<Map<string, VoucherBadge[]>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venueIds || venueIds.length === 0) {
      setVouchers(new Map());
      return;
    }

    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vouchers')
          .select('id, title, discount_type, discount_value, code, venue_id')
          .in('venue_id', venueIds)
          .eq('status', 'active')
          .gt('valid_until', new Date().toISOString());

        if (error) throw error;

        // Group vouchers by venue_id
        const voucherMap = new Map<string, VoucherBadge[]>();
        data?.forEach((voucher) => {
          const existing = voucherMap.get(voucher.venue_id) || [];
          voucherMap.set(voucher.venue_id, [...existing, voucher as VoucherBadge]);
        });

        setVouchers(voucherMap);
      } catch (error) {
        console.error('Error fetching venue vouchers:', error);
        setVouchers(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [venueIds.join(',')]);

  return { vouchers, loading };
};
