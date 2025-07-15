import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🔧 VALIDATE SETUP: Function started');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Test API Key
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    console.log('🔑 VALIDATE SETUP: API Key check:', {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'
    });

    if (!apiKey) {
      return Response.json({
        success: false,
        error: 'Google Places API key not found',
        checks: {
          apiKey: false,
          connectivity: false,
          permissions: false
        }
      }, { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test API connectivity with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Hamburg&key=${apiKey}`;
    
    console.log('🌐 VALIDATE SETUP: Testing API connectivity...');
    const response = await fetch(testUrl);
    const data = await response.json();
    
    console.log('📊 VALIDATE SETUP: API Response:', {
      status: data.status,
      hasResults: !!data.results?.length
    });

    const checks = {
      apiKey: true,
      connectivity: response.ok,
      permissions: data.status === 'OK',
      quotaOk: data.status !== 'OVER_QUERY_LIMIT',
      validKey: data.status !== 'REQUEST_DENIED'
    };

    return Response.json({
      success: checks.connectivity && checks.permissions,
      checks,
      apiStatus: data.status,
      message: data.error_message || 'API validation complete'
    }, { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ VALIDATE SETUP: Error:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      checks: {
        apiKey: false,
        connectivity: false,
        permissions: false
      }
    }, { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});