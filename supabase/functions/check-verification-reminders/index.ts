import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const now = new Date();

    // Find partners with deadlines in 1 day (reminder at day 6) or 4 days (reminder at day 3)
    const { data: partners, error } = await supabase
      .from('partner_profiles')
      .select('id, user_id, business_name, verification_deadline, verification_status, business_email, contact_person')
      .eq('verification_status', 'unverified')
      .not('verification_deadline', 'is', null);

    if (error) throw error;

    const reminders: Array<{ partnerId: string; daysLeft: number; email: string; name: string }> = [];

    for (const partner of partners || []) {
      const deadline = new Date(partner.verification_deadline);
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminders at day 3 remaining (= 4 days after start) and day 1 remaining (= 6 days after start)
      if (daysLeft === 3 || daysLeft === 1) {
        reminders.push({
          partnerId: partner.id,
          daysLeft,
          email: partner.business_email,
          name: partner.contact_person || partner.business_name,
        });

        // Update notes to track reminder sent
        await supabase
          .from('partner_profiles')
          .update({
            verification_notes: `Erinnerung gesendet: ${daysLeft} Tag(e) verbleibend (${now.toISOString()})`,
            updated_at: now.toISOString(),
          })
          .eq('id', partner.id);
      }
    }

    // Send push notifications for each reminder
    for (const reminder of reminders) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: (partners || []).find(p => p.id === reminder.partnerId)?.user_id,
            title: `⏰ Verifizierung: Noch ${reminder.daysLeft} Tag(e)`,
            body: `Hallo ${reminder.name}, verifiziere dein Geschäft, um weiterhin alle Funktionen nutzen zu können.`,
            url: '/partner/profile',
          },
        });
      } catch (pushErr) {
        console.error('Push notification failed for', reminder.partnerId, pushErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reminders_sent: reminders.length,
      details: reminders.map(r => ({ partnerId: r.partnerId, daysLeft: r.daysLeft })),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Verification reminder error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
