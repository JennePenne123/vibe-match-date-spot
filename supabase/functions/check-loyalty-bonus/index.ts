import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find founding partners who:
    // 1. Are on pro tier
    // 2. Have is_founding_partner = true
    // 3. Have paid_pro_since set (meaning their free year ended and they started paying)
    // 4. Have NOT yet received loyalty bonus
    // 5. Have been paying for >= 12 months
    const { data: eligiblePartners, error } = await supabase
      .from('partner_profiles')
      .select('id, user_id, membership_valid_until, paid_pro_since, business_name')
      .eq('membership_tier', 'pro')
      .eq('is_founding_partner', true)
      .eq('loyalty_bonus_awarded', false)
      .not('paid_pro_since', 'is', null);

    if (error) {
      console.error('Error fetching partners:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const bonusMonths = 3;
    let awardedCount = 0;

    for (const partner of eligiblePartners || []) {
      const paidSince = new Date(partner.paid_pro_since);
      const monthsPaid = (now.getFullYear() - paidSince.getFullYear()) * 12 +
        (now.getMonth() - paidSince.getMonth());

      if (monthsPaid >= 12) {
        // Award the bonus: extend membership by 3 months
        const currentEnd = partner.membership_valid_until
          ? new Date(partner.membership_valid_until)
          : now;
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + bonusMonths);

        const { error: updateError } = await supabase
          .from('partner_profiles')
          .update({
            loyalty_bonus_awarded: true,
            loyalty_bonus_awarded_at: now.toISOString(),
            loyalty_bonus_months: bonusMonths,
            membership_valid_until: newEnd.toISOString(),
          })
          .eq('id', partner.id);

        if (!updateError) {
          awardedCount++;
          console.log(`Loyalty bonus awarded to ${partner.business_name} (${partner.user_id})`);
        } else {
          console.error(`Failed to award bonus to ${partner.id}:`, updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        checked: eligiblePartners?.length || 0,
        awarded: awardedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
