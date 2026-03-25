import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth check: only cron or service role
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const body = await req.json().catch(() => ({}));
    
    if (cronSecret && body.cron_secret !== cronSecret) {
      if (!authHeader?.includes(serviceRoleKey)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    // Find dates happening in the next 24h that haven't been reminded
    const { data: upcomingDates, error: dateError } = await supabase
      .from('date_invitations')
      .select('id, title, venue_id, proposed_date, sender_id, recipient_id, date_status')
      .eq('status', 'accepted')
      .in('date_status', ['scheduled', null])
      .gte('proposed_date', now.toISOString())
      .lte('proposed_date', in24h.toISOString());

    if (dateError) {
      console.error('Error fetching dates:', dateError);
      throw dateError;
    }

    console.log(`Found ${upcomingDates?.length || 0} upcoming dates to remind`);

    const notifications: Array<{ userId: string; title: string; body: string; type: string }> = [];

    for (const date of upcomingDates || []) {
      const dateTime = new Date(date.proposed_date);
      const hoursUntil = (dateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Determine reminder type
      let reminderType = '';
      let emoji = '';
      if (hoursUntil <= 1.5) {
        reminderType = '1h';
        emoji = '⏰';
      } else if (hoursUntil <= 25) {
        reminderType = '24h';
        emoji = '📅';
      }

      if (!reminderType) continue;

      const timeStr = dateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      // Notify both sender and recipient
      for (const userId of [date.sender_id, date.recipient_id]) {
        notifications.push({
          userId,
          title: `${emoji} Date-Erinnerung`,
          body: reminderType === '1h' 
            ? `Dein Date "${date.title}" startet in 1 Stunde um ${timeStr}!`
            : `Morgen um ${timeStr}: "${date.title}" – Freu dich drauf! 💜`,
          type: `date_reminder_${reminderType}`
        });
      }
    }

    // Send push notifications
    let sentCount = 0;
    for (const notif of notifications) {
      try {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh_key, auth_key')
          .eq('user_id', notif.userId);

        if (subs && subs.length > 0) {
          // Invoke the existing send-push-notification function
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: notif.userId,
              title: notif.title,
              body: notif.body,
              data: { type: notif.type }
            }
          });
          sentCount++;
        }
      } catch (e) {
        console.error(`Failed to send notification to ${notif.userId}:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      upcomingDates: upcomingDates?.length || 0,
      notificationsSent: sentCount 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Date reminder error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
