import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// Country config for UI labels and placeholders
export const COUNTRY_TAX_CONFIG: Record<string, {
  flag: string;
  name: string;
  vatLabel: string;
  vatPlaceholder: string;
  localLabel: string;
  localPlaceholder: string;
  isEu: boolean;
}> = {
  DE: { flag: '🇩🇪', name: 'Deutschland', vatLabel: 'USt-IdNr.', vatPlaceholder: 'DE123456789', localLabel: 'Steuernummer', localPlaceholder: '12/345/67890', isEu: true },
  AT: { flag: '🇦🇹', name: 'Österreich', vatLabel: 'UID-Nummer', vatPlaceholder: 'ATU12345678', localLabel: 'Steuernummer', localPlaceholder: '12-345/6789', isEu: true },
  CH: { flag: '🇨🇭', name: 'Schweiz', vatLabel: 'UID/MWST-Nr.', vatPlaceholder: 'CHE123456789', localLabel: 'Unternehmensnummer', localPlaceholder: 'CHE-123.456.789', isEu: false },
  FR: { flag: '🇫🇷', name: 'France', vatLabel: 'N° TVA', vatPlaceholder: 'FR12345678901', localLabel: 'SIRET', localPlaceholder: '123 456 789 00012', isEu: true },
  IT: { flag: '🇮🇹', name: 'Italia', vatLabel: 'Partita IVA', vatPlaceholder: 'IT12345678901', localLabel: 'Codice Fiscale', localPlaceholder: 'RSSMRA85T10A562S', isEu: true },
  ES: { flag: '🇪🇸', name: 'España', vatLabel: 'NIF/CIF', vatPlaceholder: 'ESA12345678', localLabel: 'NIF', localPlaceholder: 'A12345678', isEu: true },
  NL: { flag: '🇳🇱', name: 'Nederland', vatLabel: 'BTW-nummer', vatPlaceholder: 'NL123456789B01', localLabel: 'KVK-nummer', localPlaceholder: '12345678', isEu: true },
  BE: { flag: '🇧🇪', name: 'België', vatLabel: 'BTW-nummer', vatPlaceholder: 'BE0123456789', localLabel: 'Ondernemingsnr.', localPlaceholder: '0123.456.789', isEu: true },
  PL: { flag: '🇵🇱', name: 'Polska', vatLabel: 'NIP', vatPlaceholder: 'PL1234567890', localLabel: 'REGON', localPlaceholder: '123456789', isEu: true },
  CZ: { flag: '🇨🇿', name: 'Česko', vatLabel: 'DIČ', vatPlaceholder: 'CZ12345678', localLabel: 'IČO', localPlaceholder: '12345678', isEu: true },
  PT: { flag: '🇵🇹', name: 'Portugal', vatLabel: 'NIF', vatPlaceholder: 'PT123456789', localLabel: 'NIF', localPlaceholder: '123456789', isEu: true },
  DK: { flag: '🇩🇰', name: 'Danmark', vatLabel: 'CVR/SE-nr', vatPlaceholder: 'DK12345678', localLabel: 'CVR-nummer', localPlaceholder: '12345678', isEu: true },
  SE: { flag: '🇸🇪', name: 'Sverige', vatLabel: 'Momsnummer', vatPlaceholder: 'SE123456789012', localLabel: 'Org.nummer', localPlaceholder: '123456-7890', isEu: true },
  GB: { flag: '🇬🇧', name: 'United Kingdom', vatLabel: 'VAT Number', vatPlaceholder: '123456789', localLabel: 'Company Number', localPlaceholder: '12345678', isEu: false },
  US: { flag: '🇺🇸', name: 'United States', vatLabel: 'EIN', vatPlaceholder: '12-3456789', localLabel: 'EIN (Tax ID)', localPlaceholder: '12-3456789', isEu: false },
  NO: { flag: '🇳🇴', name: 'Norge', vatLabel: 'MVA-nummer', vatPlaceholder: '123456789MVA', localLabel: 'Org.nummer', localPlaceholder: '123 456 789', isEu: false },
  HU: { flag: '🇭🇺', name: 'Magyarország', vatLabel: 'Adószám', vatPlaceholder: 'HU12345678', localLabel: 'Adószám', localPlaceholder: '12345678-1-23', isEu: true },
  RO: { flag: '🇷🇴', name: 'România', vatLabel: 'CIF', vatPlaceholder: 'RO12345678', localLabel: 'CUI', localPlaceholder: '12345678', isEu: true },
  GR: { flag: '🇬🇷', name: 'Ελλάδα', vatLabel: 'ΑΦΜ', vatPlaceholder: 'EL123456789', localLabel: 'ΑΦΜ', localPlaceholder: '123456789', isEu: true },
  IE: { flag: '🇮🇪', name: 'Ireland', vatLabel: 'VAT Number', vatPlaceholder: 'IE1234567A', localLabel: 'Tax Reference', localPlaceholder: '1234567A', isEu: true },
  HR: { flag: '🇭🇷', name: 'Hrvatska', vatLabel: 'OIB', vatPlaceholder: 'HR12345678901', localLabel: 'OIB', localPlaceholder: '12345678901', isEu: true },
};

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

  const submitVerification = async (taxId: string, taxIdType: 'vat_id' | 'local_tax_number', countryCode?: string) => {
    if (!verification) return null;

    const cc = countryCode || verification.country || 'DE';

    const { data, error } = await supabase.functions.invoke('verify-partner', {
      body: {
        tax_id: taxId,
        tax_id_type: taxIdType,
        country_code: cc,
        business_name: verification.business_name,
        address: verification.address || '',
        city: verification.city || '',
      },
    });

    if (error) throw error;
    await fetchVerification();

    // Show in-app toast based on result
    if (data?.status === 'verified') {
      toast.success('Verifizierung erfolgreich!', {
        description: 'Dein Account wurde automatisch verifiziert. Alle Funktionen sind jetzt freigeschaltet.',
        duration: 8000,
      });
    } else if (data?.status === 'failed') {
      toast.error('Verifizierung fehlgeschlagen', {
        description: data.notes || 'Bitte überprüfe deine Angaben und versuche es erneut.',
        duration: 8000,
      });
    } else if (data?.status === 'pending_review') {
      toast.info('Wird geprüft', {
        description: 'Deine Angaben werden von einem Admin überprüft. Du wirst benachrichtigt.',
        duration: 6000,
      });
    }

    return data;
  };

  const daysRemaining = verification?.verification_deadline
    ? Math.max(0, Math.ceil((new Date(verification.verification_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpired = daysRemaining !== null && daysRemaining <= 0 && verification?.verification_status === 'unverified';

  return { verification, loading, submitVerification, refetch: fetchVerification, daysRemaining, isExpired };
}
