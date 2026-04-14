import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate scheduled/manual invocations with CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');
  
  // Require valid secret for all invocations
  if (!cronSecret || providedSecret !== cronSecret) {
    console.warn('⚠️ Unauthorized access attempt to check-completed-dates');
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Invalid or missing credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
      .select('id, sender_id, recipient_id, actual_date_time, title, venue_id')
      .eq('status', 'accepted')
      .eq('date_status', 'scheduled')
      .not('actual_date_time', 'is', null)
      .lt('actual_date_time', twoHoursAgo);

    // Send date reminder emails for upcoming dates (within the next 2 hours)
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    
    const { data: upcomingDates } = await supabase
      .from('date_invitations')
      .select('id, sender_id, recipient_id, actual_date_time, title, venue_id')
      .eq('status', 'accepted')
      .eq('date_status', 'scheduled')
      .not('actual_date_time', 'is', null)
      .gte('actual_date_time', now)
      .lte('actual_date_time', twoHoursFromNow);

    if (upcomingDates && upcomingDates.length > 0) {
      console.log(`📨 Sending reminders for ${upcomingDates.length} upcoming dates`);
      for (const date of upcomingDates) {
        try {
          // Get participant emails and venue name
          const [senderRes, recipientRes, venueRes] = await Promise.all([
            supabase.from('profiles').select('email, name').eq('id', date.sender_id).single(),
            supabase.from('profiles').select('email, name').eq('id', date.recipient_id).single(),
            date.venue_id ? supabase.from('venues').select('name, address').eq('id', date.venue_id).single() : null,
          ]);

          const dateTime = new Date(date.actual_date_time!);
          const formattedDate = dateTime.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
          const formattedTime = dateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

          // Send reminder to both participants
          for (const participant of [
            { profile: senderRes.data, partnerName: recipientRes.data?.name },
            { profile: recipientRes.data, partnerName: senderRes.data?.name },
          ]) {
            if (participant.profile?.email) {
              await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  templateName: 'date-reminder',
                  recipientEmail: participant.profile.email,
                  idempotencyKey: `date-reminder-${date.id}-${participant.profile.email}`,
                  templateData: {
                    partnerName: participant.partnerName || 'Dein Date',
                    title: date.title,
                    venueName: venueRes?.data?.name,
                    venueAddress: venueRes?.data?.address,
                    dateFormatted: formattedDate,
                    timeFormatted: formattedTime,
                  },
                }),
              });
            }
          }
          console.log(`  📧 Reminder sent for date "${date.title}"`);
        } catch (reminderError) {
          console.error(`  ⚠️ Reminder error for date ${date.id}:`, reminderError);
        }
      }
    }

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
