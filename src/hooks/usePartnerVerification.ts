import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PartnerVerification {
  verification_status: string;
  verification_method: string | null;
  tax_id_verified: boolean;
  tax_id_type: string | null;
  verification_deadline: string | null;
  address_verified: boolean;
  verification_notes: string | null;
  verified_at: string | null;
  tax_id: string | null;
  business_name: string;
  address: string | null;
  city: string | null;
  country: string | null;
}

export function usePartnerVerification() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<PartnerVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVerification = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('partner_profiles')
      .select('verification_status, verification_method, tax_id_verified, tax_id_type, verification_deadline, address_verified, verification_notes, verified_at, tax_id, business_name, address, city, country')
      .eq('user_id', user.id)
      .maybeSingle();

    setVerification(data as PartnerVerification | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchVerification();
  }, [user]);

  const submitVerification = async (taxId: string, taxIdType: 'ust_id' | 'steuernummer') => {
    if (!verification) return null;

    const { data, error } = await supabase.functions.invoke('verify-partner', {
      body: {
        tax_id: taxId,
        tax_id_type: taxIdType,
        country_code: verification.country || 'DE',
        business_name: verification.business_name,
        address: verification.address || '',
        city: verification.city || '',
      },
    });

    if (error) throw error;
    await fetchVerification();
    return data;
  };

  const daysRemaining = verification?.verification_deadline
    ? Math.max(0, Math.ceil((new Date(verification.verification_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpired = daysRemaining !== null && daysRemaining <= 0 && verification?.verification_status === 'unverified';

  return {
    verification,
    loading,
    submitVerification,
    refetch: fetchVerification,
    daysRemaining,
    isExpired,
  };
}
