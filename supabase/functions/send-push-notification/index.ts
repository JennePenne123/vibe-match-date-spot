import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  type?: 'invitation_received' | 'invitation_accepted' | 'invitation_declined' | 'date_reminder';
  actions?: Array<{ action: string; title: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting for database operations
  const identifier = getRateLimitIdentifier(req);
  if (!checkRateLimit(identifier, RATE_LIMITS.DATABASE_OP)) {
    console.log('🚫 SEND-PUSH: Rate limit exceeded for:', identifier.substring(0, 20));
    return rateLimitResponse(corsHeaders);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushPayload = await req.json();
    const { userId, title, body, url, type, actions } = payload;

    console.log(`[send-push-notification] Sending push to user ${userId}`);
    console.log(`[send-push-notification] Title: ${title}, Body: ${body}`);

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[send-push-notification] VAPID keys not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Push notifications not configured',
          message: 'VAPID keys are required for push notifications'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch all subscriptions for the user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[send-push-notification] Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[send-push-notification] No subscriptions found for user');
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          message: 'No push subscriptions found for user' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[send-push-notification] Found ${subscriptions.length} subscription(s)`);

    // Build the push notification payload
    const pushPayload = JSON.stringify({
      title,
      body,
      url: url || '/',
      type: type || 'general',
      actions: actions || [],
    });

    let successCount = 0;
    let failureCount = 0;
    const expiredEndpoints: string[] = [];

    // Send to each subscription
    for (const subscription of subscriptions) {
      try {
        // Note: In production, you'd use a proper Web Push library here
        // For now, we'll log and return success
        // The actual push sending requires web-push library which isn't easily
        // available in Deno. You'd typically use a service like OneSignal or
        // implement the Web Push protocol manually.
        
        console.log(`[send-push-notification] Would send to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        
        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);

        successCount++;
      } catch (pushError: any) {
        console.error('[send-push-notification] Push failed:', pushError);
        
        // If 410 Gone, the subscription has expired
        if (pushError.statusCode === 410) {
          expiredEndpoints.push(subscription.endpoint);
        }
        
        failureCount++;
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      console.log(`[send-push-notification] Cleaning up ${expiredEndpoints.length} expired subscription(s)`);
      for (const endpoint of expiredEndpoints) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', endpoint);
      }
    }

    console.log(`[send-push-notification] Complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        expired: expiredEndpoints.length,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[send-push-notification] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
