import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StaffNetworkVoucher {
  id: string;
  title: string;
  description: string | null;
  code: string;
  discount_type: string;
  discount_value: number;
  valid_until: string;
  status: string;
  offering_partner_id: string;
  offering_venue_id: string | null;
}

export function useStaffNetworkVouchers(partnerId: string | undefined) {
  const [vouchers, setVouchers] = useState<StaffNetworkVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) {
      setVouchers([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('partner_exclusive_vouchers')
          .select('id, title, description, code, discount_type, discount_value, valid_until, status, offering_partner_id, offering_venue_id')
          .eq('receiving_partner_id', partnerId)
          .eq('status', 'active')
          .gte('valid_until', new Date().toISOString())
          .order('valid_until', { ascending: true });

        if (error) throw error;
        setVouchers((data as StaffNetworkVoucher[]) || []);
      } catch (err) {
        console.error('Error fetching staff network vouchers:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetch();
  }, [partnerId]);

  return { vouchers, loading };
}
