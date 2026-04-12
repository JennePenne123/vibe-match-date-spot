import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StaffAccess {
  isStaff: boolean;
  staffRecord: {
    id: string;
    partner_id: string;
    venue_id: string | null;
    staff_role: string;
    status: string;
    qr_code_token: string;
    name: string;
  } | null;
  partnerName: string | null;
  loading: boolean;
}

export function useStaffAccess(): StaffAccess {
  const { user, loading: authLoading } = useAuth();
  const [staffRecord, setStaffRecord] = useState<StaffAccess['staffRecord']>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setStaffRecord(null);
      setPartnerName(null);
      setLoading(false);
      return;
    }

    let active = true;

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('venue_staff')
          .select('id, partner_id, venue_id, staff_role, status, qr_code_token, name')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (!active) return;

        if (error || !data) {
          setStaffRecord(null);
          setPartnerName(null);
          setLoading(false);
          return;
        }

        setStaffRecord(data as StaffAccess['staffRecord']);

        // Fetch partner business name
        const { data: partner } = await supabase
          .from('partner_profiles')
          .select('business_name')
          .eq('user_id', data.partner_id)
          .maybeSingle();

        if (active) {
          setPartnerName(partner?.business_name || null);
          setLoading(false);
        }
      } catch {
        if (active) {
          setStaffRecord(null);
          setLoading(false);
        }
      }
    };

    void check();
    return () => { active = false; };
  }, [authLoading, user?.id]);

  return {
    isStaff: !!staffRecord,
    staffRecord,
    partnerName,
    loading,
  };
}
