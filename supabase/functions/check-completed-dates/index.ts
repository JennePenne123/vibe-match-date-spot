import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a manual trigger (for testing)
  const url = new URL(req.url);
  const isManualTrigger = url.searchParams.get('manual') === 'true';
  
  console.log(`🔍 Check Completed Dates - Starting scan... ${isManualTrigger ? '[MANUAL TRIGGER]' : '[SCHEDULED]'}`);

  try {
    // Create Supabase client with service role for elevated privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query for date invitations that should be marked as completed
    // Looking for accepted dates that have passed by at least 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: eligibleDates, error: queryError } = await supabase
      .from('date_invitations')
      .select('id, sender_id, recipient_id, actual_date_time, title')
      .eq('status', 'accepted')
      .eq('date_status', 'scheduled')
      .not('actual_date_time', 'is', null)
      .lt('actual_date_time', twoHoursAgo);

    if (queryError) {
      console.error('❌ Error querying eligible dates:', queryError);
      throw queryError;
    }

    console.log(`📊 Found ${eligibleDates?.length || 0} dates to mark as completed`);

    if (!eligibleDates || eligibleDates.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No dates to mark as completed',
          updated: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update all eligible dates to 'completed' status
    const dateIds = eligibleDates.map(d => d.id);
    
    const { data: updatedDates, error: updateError } = await supabase
      .from('date_invitations')
      .update({ date_status: 'completed' })
      .in('id', dateIds)
      .select();

    if (updateError) {
      console.error('❌ Error updating date status:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully marked ${updatedDates?.length || 0} dates as completed`);
    
    // Log each updated date for monitoring
    eligibleDates.forEach(date => {
      console.log(`  📅 Date "${date.title}" (ID: ${date.id}) marked completed`);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marked ${updatedDates?.length || 0} dates as completed`,
        updated: updatedDates?.length || 0,
        dateIds: dateIds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in check-completed-dates function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
