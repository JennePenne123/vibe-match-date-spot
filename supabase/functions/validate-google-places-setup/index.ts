import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting with logging for validation endpoints
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'validate-google-places-setup', RATE_LIMITS.VALIDATION, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 VALIDATE-GOOGLE: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    console.log('🔍 VALIDATE GOOGLE PLACES: Starting validation...');

    // Check if API key is available
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    console.log('🔑 VALIDATE GOOGLE PLACES: API Key available:', !!apiKey);
    
    if (!apiKey) {
      return Response.json({
        isValid: false,
        error: 'GOOGLE_PLACES_API_KEY environment variable not set',
        details: 'API key missing from environment'
      }, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Test API key with the new Places API (New) - Text Search
    const testUrl = 'https://places.googleapis.com/v1/places:searchText';
    console.log('📡 VALIDATE GOOGLE PLACES: Testing new Places API (New)...');

    const testResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName',
      },
      body: JSON.stringify({ textQuery: 'restaurant', maxResultCount: 1 }),
    });
    const testData = await testResponse.json();

    console.log('🏢 VALIDATE GOOGLE PLACES: Test response status:', testResponse.status);
    console.log('📊 VALIDATE GOOGLE PLACES: Test response data:', JSON.stringify(testData, null, 2));

    // New API returns errors in `error` field with HTTP non-200 status
    if (testResponse.status === 403 || testData?.error?.status === 'PERMISSION_DENIED') {
      const msg = testData?.error?.message || 'Permission denied';
      const denied = /billing/i.test(msg)
        ? 'Billing not enabled'
        : /API.*not.*enabled|SERVICE_DISABLED/i.test(msg)
          ? 'Places API (New) not enabled in this Google Cloud project'
          : msg;
      return Response.json({
        isValid: false,
        error: 'Google Places API (New) request denied',
        details: { status: testData?.error?.status || 'PERMISSION_DENIED', error_message: denied, raw: testData?.error },
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (testResponse.status === 429 || testData?.error?.status === 'RESOURCE_EXHAUSTED') {
      return Response.json({
        isValid: false,
        error: 'Google Places API quota exceeded',
        details: { status: 'RESOURCE_EXHAUSTED', error_message: testData?.error?.message || 'Quota exceeded' },
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (testResponse.status === 200) {
      console.log('✅ VALIDATE GOOGLE PLACES: API key validation successful');
      return Response.json({
        isValid: true,
        message: 'Google Places API (New) is working correctly',
        details: { places_found: testData.places?.length || 0 },
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (testResponse.status !== 200) {
      return Response.json({
        isValid: false,
        error: 'Google Places API returned non-200 status',
        details: {
          status: testResponse.status,
          statusText: testResponse.statusText,
          data: testData
        }
      }, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Unknown status
    return Response.json({
      isValid: false,
      error: 'Unknown Google Places API response',
      details: {
        status: testResponse.status,
        raw_response: testData
      }
    }, { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ VALIDATE GOOGLE PLACES: Validation error:', error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    return Response.json({
      isValid: false,
      error: 'Validation failed with exception',
      details: {
        message: errorObj.message,
        stack: errorObj.stack
      }
    }, { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})