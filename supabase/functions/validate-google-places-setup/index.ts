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

    // Test API key with a simple Places API call
    const testUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=restaurant&inputtype=textquery&fields=place_id,name&key=${apiKey}`;
    
    console.log('📡 VALIDATE GOOGLE PLACES: Testing API key with test request...');
    
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();
    
    console.log('🏢 VALIDATE GOOGLE PLACES: Test response status:', testResponse.status);
    console.log('📊 VALIDATE GOOGLE PLACES: Test response data:', JSON.stringify(testData, null, 2));

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

    if (testData.status === 'REQUEST_DENIED') {
      return Response.json({
        isValid: false,
        error: 'Google Places API request denied',
        details: {
          status: testData.status,
          error_message: testData.error_message || 'API key invalid or billing not enabled'
        }
      }, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (testData.status === 'OVER_QUERY_LIMIT') {
      return Response.json({
        isValid: false,
        error: 'Google Places API quota exceeded',
        details: {
          status: testData.status,
          error_message: testData.error_message || 'Daily quota exceeded'
        }
      }, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (testData.status === 'OK' || testData.status === 'ZERO_RESULTS') {
      console.log('✅ VALIDATE GOOGLE PLACES: API key validation successful');
      return Response.json({
        isValid: true,
        message: 'Google Places API is working correctly',
        details: {
          status: testData.status,
          candidates_found: testData.candidates?.length || 0
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
        status: testData.status,
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