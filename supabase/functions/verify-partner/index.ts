import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyRequest {
  tax_id: string;
  tax_id_type: 'ust_id' | 'steuernummer';
  country_code?: string;
  business_name?: string;
  address?: string;
  city?: string;
}

// Validate EU VAT ID via VIES SOAP API
async function validateViesVatId(vatId: string, countryCode: string): Promise<{ valid: boolean; name?: string; address?: string; error?: string }> {
  // Clean the VAT ID - remove spaces, dashes
  const cleanVatId = vatId.replace(/[\s\-\.]/g, '');
  
  // Extract country code from VAT ID if present
  let cc = countryCode.toUpperCase();
  let vatNumber = cleanVatId;
  
  if (/^[A-Z]{2}/.test(cleanVatId)) {
    cc = cleanVatId.substring(0, 2);
    vatNumber = cleanVatId.substring(2);
  }

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${cc}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '',
      },
      body: soapBody,
    });

    const text = await response.text();
    
    const validMatch = text.match(/<ns2:valid>(true|false)<\/ns2:valid>/);
    const nameMatch = text.match(/<ns2:name>([^<]*)<\/ns2:name>/);
    const addressMatch = text.match(/<ns2:address>([^<]*)<\/ns2:address>/);
    
    if (!validMatch) {
      // Check for fault
      const faultMatch = text.match(/<faultstring>([^<]*)<\/faultstring>/);
      return { 
        valid: false, 
        error: faultMatch ? faultMatch[1] : 'VIES API response could not be parsed' 
      };
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

// Validate German Steuernummer format (basic format check)
function validateSteuernummer(steuernummer: string): { valid: boolean; error?: string } {
  const clean = steuernummer.replace(/[\s\-\/]/g, '');
  
  // German tax numbers are 10-11 digits (unified) or 13 digits (with Bundesland prefix)
  if (!/^\d{10,13}$/.test(clean)) {
    return { valid: false, error: 'Steuernummer muss 10-13 Ziffern haben' };
  }
  
  return { valid: true };
}

// Simple address verification using Google Places text search
async function verifyAddress(businessName: string, address: string, city: string): Promise<{ verified: boolean; confidence: number; matchedName?: string }> {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set, skipping address verification');
    return { verified: false, confidence: 0 };
  }

  try {
    const query = encodeURIComponent(`${businessName} ${address} ${city}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=de`
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

    return {
      verified: confidence >= 50,
      confidence,
      matchedName: topResult.name,
    };
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
    // Auth check
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

    let taxVerification: { valid: boolean; error?: string; name?: string; address?: string };
    
    if (tax_id_type === 'ust_id') {
      taxVerification = await validateViesVatId(tax_id, country_code);
    } else {
      taxVerification = validateSteuernummer(tax_id);
    }

    // Address verification (runs in parallel for USt-IdNr, sequential for Steuernummer)
    let addressResult = { verified: false, confidence: 0, matchedName: undefined as string | undefined };
    if (business_name && (address || city)) {
      addressResult = await verifyAddress(business_name, address, city);
    }

    // Determine overall verification status
    let verificationStatus: string;
    let verificationNotes: string;

    if (tax_id_type === 'ust_id' && taxVerification.valid) {
      // USt-IdNr valid via VIES = fully verified
      verificationStatus = 'verified';
      verificationNotes = `USt-IdNr. via VIES bestätigt. ${addressResult.verified ? 'Adresse verifiziert.' : 'Adresse konnte nicht automatisch verifiziert werden.'}`;
    } else if (tax_id_type === 'steuernummer' && taxVerification.valid && addressResult.verified) {
      // Valid Steuernummer format + address match = verified
      verificationStatus = 'verified';
      verificationNotes = `Steuernummer-Format gültig. Adresse über Google Places verifiziert (Konfidenz: ${addressResult.confidence}%).`;
    } else if (tax_id_type === 'steuernummer' && taxVerification.valid) {
      // Valid Steuernummer format but no address match = pending admin review
      verificationStatus = 'pending_review';
      verificationNotes = `Steuernummer-Format gültig, aber Adressabgleich nicht erfolgreich. Admin-Prüfung erforderlich.`;
    } else {
      // Invalid tax ID
      verificationStatus = 'failed';
      verificationNotes = taxVerification.error || 'Verifizierung fehlgeschlagen.';
    }

    // Update partner profile with service role
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: updateError } = await adminSupabase
      .from('partner_profiles')
      .update({
        verification_status: verificationStatus,
        verification_method: tax_id_type,
        tax_id: tax_id,
        tax_id_type: tax_id_type,
        tax_id_verified: tax_id_type === 'ust_id' ? taxVerification.valid : false,
        address_verified: addressResult.verified,
        verification_notes: verificationNotes,
        verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
