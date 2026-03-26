import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyRequest {
  tax_id: string;
  tax_id_type: 'vat_id' | 'local_tax_number';
  country_code: string;
  business_name?: string;
  address?: string;
  city?: string;
}

// EU member state VAT ID prefixes and basic format validation
const EU_VAT_FORMATS: Record<string, { prefix: string; pattern: RegExp; label: string }> = {
  AT: { prefix: 'ATU', pattern: /^ATU\d{8}$/, label: 'UID-Nummer' },
  BE: { prefix: 'BE', pattern: /^BE[01]\d{9}$/, label: 'BTW-nummer' },
  BG: { prefix: 'BG', pattern: /^BG\d{9,10}$/, label: 'ДДС номер' },
  HR: { prefix: 'HR', pattern: /^HR\d{11}$/, label: 'OIB' },
  CY: { prefix: 'CY', pattern: /^CY\d{8}[A-Z]$/, label: 'ΦΠΑ' },
  CZ: { prefix: 'CZ', pattern: /^CZ\d{8,10}$/, label: 'DIČ' },
  DK: { prefix: 'DK', pattern: /^DK\d{8}$/, label: 'CVR/SE-nr' },
  EE: { prefix: 'EE', pattern: /^EE\d{9}$/, label: 'KMKR-number' },
  FI: { prefix: 'FI', pattern: /^FI\d{8}$/, label: 'ALV-numero' },
  FR: { prefix: 'FR', pattern: /^FR[A-Z0-9]{2}\d{9}$/, label: 'TVA' },
  DE: { prefix: 'DE', pattern: /^DE\d{9}$/, label: 'USt-IdNr.' },
  GR: { prefix: 'EL', pattern: /^EL\d{9}$/, label: 'ΑΦΜ' },
  HU: { prefix: 'HU', pattern: /^HU\d{8}$/, label: 'Adószám' },
  IE: { prefix: 'IE', pattern: /^IE\d{7}[A-Z]{1,2}$/, label: 'VAT number' },
  IT: { prefix: 'IT', pattern: /^IT\d{11}$/, label: 'Partita IVA' },
  LV: { prefix: 'LV', pattern: /^LV\d{11}$/, label: 'PVN' },
  LT: { prefix: 'LT', pattern: /^LT(\d{9}|\d{12})$/, label: 'PVM' },
  LU: { prefix: 'LU', pattern: /^LU\d{8}$/, label: 'TVA' },
  MT: { prefix: 'MT', pattern: /^MT\d{8}$/, label: 'VAT number' },
  NL: { prefix: 'NL', pattern: /^NL\d{9}B\d{2}$/, label: 'BTW-nummer' },
  PL: { prefix: 'PL', pattern: /^PL\d{10}$/, label: 'NIP' },
  PT: { prefix: 'PT', pattern: /^PT\d{9}$/, label: 'NIF' },
  RO: { prefix: 'RO', pattern: /^RO\d{2,10}$/, label: 'CIF' },
  SK: { prefix: 'SK', pattern: /^SK\d{10}$/, label: 'IČ DPH' },
  SI: { prefix: 'SI', pattern: /^SI\d{8}$/, label: 'DDV' },
  ES: { prefix: 'ES', pattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, label: 'NIF/CIF' },
  SE: { prefix: 'SE', pattern: /^SE\d{12}$/, label: 'Momsnummer' },
};

// Non-EU countries with local tax ID formats
const NON_EU_TAX_FORMATS: Record<string, { pattern: RegExp; label: string }> = {
  CH: { pattern: /^CHE[\-\.]?\d{3}[\-\.]?\d{3}[\-\.]?\d{3}$/, label: 'UID/MWST-Nr.' },
  GB: { pattern: /^\d{9,12}$/, label: 'VAT Registration Number' },
  US: { pattern: /^\d{2}[\-]?\d{7}$/, label: 'EIN (Tax ID)' },
  NO: { pattern: /^\d{9}MVA$/, label: 'MVA-nummer' },
};

const isEuCountry = (cc: string) => cc in EU_VAT_FORMATS;

// Validate EU VAT ID via VIES SOAP API
async function validateViesVatId(vatId: string, countryCode: string): Promise<{ valid: boolean; name?: string; address?: string; error?: string }> {
  const cleanVatId = vatId.replace(/[\s\-\.]/g, '');
  
  let cc = countryCode.toUpperCase();
  let vatNumber = cleanVatId;
  
  // Use EL prefix for Greece
  const viesCountryCode = cc === 'GR' ? 'EL' : cc;
  
  if (/^[A-Z]{2}/.test(cleanVatId)) {
    const extractedCC = cleanVatId.substring(0, 2);
    // Map EL back to GR for country matching
    cc = extractedCC === 'EL' ? 'GR' : extractedCC;
    vatNumber = cleanVatId.substring(2);
  }

  const soapCC = cc === 'GR' ? 'EL' : cc;

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${soapCC}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' },
      body: soapBody,
    });

    const text = await response.text();
    const validMatch = text.match(/<ns2:valid>(true|false)<\/ns2:valid>/);
    const nameMatch = text.match(/<ns2:name>([^<]*)<\/ns2:name>/);
    const addressMatch = text.match(/<ns2:address>([^<]*)<\/ns2:address>/);
    
    if (!validMatch) {
      const faultMatch = text.match(/<faultstring>([^<]*)<\/faultstring>/);
      return { valid: false, error: faultMatch ? faultMatch[1] : 'VIES API response could not be parsed' };
    }

    return {
      valid: validMatch[1] === 'true',
      name: nameMatch ? nameMatch[1].trim() : undefined,
      address: addressMatch ? addressMatch[1].trim() : undefined,
    };
  } catch (error) {
    console.error('VIES API error:', error);
    return { valid: false, error: `VIES API unavailable: ${error.message}` };
  }
}

// Validate local tax number format by country
function validateLocalTaxNumber(taxNumber: string, countryCode: string): { valid: boolean; error?: string } {
  const clean = taxNumber.replace(/[\s]/g, '');
  
  // Check non-EU formats
  const nonEuFormat = NON_EU_TAX_FORMATS[countryCode];
  if (nonEuFormat) {
    if (!nonEuFormat.pattern.test(clean)) {
      return { valid: false, error: `Invalid ${nonEuFormat.label} format` };
    }
    return { valid: true };
  }

  // For EU countries, local tax numbers vary widely - do basic digit check
  if (clean.replace(/[\-\/\.]/g, '').length < 5) {
    return { valid: false, error: 'Tax number too short' };
  }
  
  return { valid: true };
}

// Address verification using Google Places
async function verifyAddress(businessName: string, address: string, city: string): Promise<{ verified: boolean; confidence: number; matchedName?: string }> {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set, skipping address verification');
    return { verified: false, confidence: 0 };
  }

  try {
    const query = encodeURIComponent(`${businessName} ${address} ${city}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results?.length) {
      return { verified: false, confidence: 0 };
    }

    const topResult = data.results[0];
    const nameMatch = topResult.name?.toLowerCase().includes(businessName.toLowerCase().substring(0, 5));
    const addressMatch = topResult.formatted_address?.toLowerCase().includes(city.toLowerCase());
    
    let confidence = 0;
    if (nameMatch) confidence += 50;
    if (addressMatch) confidence += 50;

    return { verified: confidence >= 50, confidence, matchedName: topResult.name };
  } catch (error) {
    console.error('Google Places verification error:', error);
    return { verified: false, confidence: 0 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: VerifyRequest = await req.json();
    const { tax_id, tax_id_type, country_code = 'DE', business_name = '', address = '', city = '' } = body;

    if (!tax_id || !tax_id_type) {
      return new Response(JSON.stringify({ error: 'tax_id and tax_id_type are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cc = country_code.toUpperCase();
    let taxVerification: { valid: boolean; error?: string; name?: string; address?: string };

    if (tax_id_type === 'vat_id') {
      if (isEuCountry(cc)) {
        taxVerification = await validateViesVatId(tax_id, cc);
      } else if (cc === 'CH') {
        // Swiss UID - format check only (no VIES)
        const clean = tax_id.replace(/[\s\-\.]/g, '');
        taxVerification = /^CHE\d{9}$/.test(clean)
          ? { valid: true }
          : { valid: false, error: 'Invalid Swiss UID format (CHE + 9 digits)' };
      } else {
        taxVerification = validateLocalTaxNumber(tax_id, cc);
      }
    } else {
      taxVerification = validateLocalTaxNumber(tax_id, cc);
    }

    // Address verification
    let addressResult = { verified: false, confidence: 0, matchedName: undefined as string | undefined };
    if (business_name && (address || city)) {
      addressResult = await verifyAddress(business_name, address, city);
    }

    // Determine verification status
    let verificationStatus: string;
    let verificationNotes: string;

    if (tax_id_type === 'vat_id' && isEuCountry(cc) && taxVerification.valid) {
      // EU VAT ID valid via VIES = fully verified
      verificationStatus = 'verified';
      const vatLabel = EU_VAT_FORMATS[cc]?.label || 'VAT ID';
      verificationNotes = `${vatLabel} via VIES verified. ${addressResult.verified ? 'Address verified.' : 'Address could not be automatically verified.'}`;
    } else if (tax_id_type === 'vat_id' && !isEuCountry(cc) && taxVerification.valid && addressResult.verified) {
      // Non-EU VAT + address match = verified
      verificationStatus = 'verified';
      verificationNotes = `Tax ID format valid. Address verified via Google Places (confidence: ${addressResult.confidence}%).`;
    } else if (tax_id_type === 'vat_id' && !isEuCountry(cc) && taxVerification.valid) {
      // Non-EU VAT format valid but no address match = pending review
      verificationStatus = 'pending_review';
      verificationNotes = `Tax ID format valid, but address could not be matched. Admin review required.`;
    } else if (tax_id_type === 'local_tax_number' && taxVerification.valid && addressResult.verified) {
      // Local tax number + address = verified
      verificationStatus = 'verified';
      verificationNotes = `Local tax number format valid. Address verified via Google Places (confidence: ${addressResult.confidence}%).`;
    } else if (tax_id_type === 'local_tax_number' && taxVerification.valid) {
      // Local tax number only = pending review
      verificationStatus = 'pending_review';
      verificationNotes = `Local tax number format valid, but address could not be matched. Admin review required.`;
    } else {
      verificationStatus = 'failed';
      verificationNotes = taxVerification.error || 'Verification failed.';
    }

    // Update with service role
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: updateError } = await adminSupabase
      .from('partner_profiles')
      .update({
        verification_status: verificationStatus,
        verification_method: tax_id_type,
        tax_id,
        tax_id_type,
        tax_id_verified: tax_id_type === 'vat_id' && isEuCountry(cc) ? taxVerification.valid : false,
        address_verified: addressResult.verified,
        verification_notes: verificationNotes,
        verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
        country: cc,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);

    return new Response(JSON.stringify({
      status: verificationStatus,
      tax_id_valid: taxVerification.valid,
      address_verified: addressResult.verified,
      address_confidence: addressResult.confidence,
      matched_business_name: addressResult.matchedName,
      vies_name: taxVerification.name,
      vies_address: taxVerification.address,
      notes: verificationNotes,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
