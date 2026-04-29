import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.95.0/cors';
import { z } from 'https://esm.sh/zod@3.23.8';

/**
 * Validates a DEHOGA membership for a partner.
 * Two paths:
 *  - method=member_id: format check on member ID (real DEHOGA API hookup TODO)
 *  - method=invitation_code: lookup against dehoga_invitation_codes whitelist
 *
 * On success, sets is_dehoga_member=true on partner_profiles via service role.
 */

const BodySchema = z.object({
  method: z.enum(['member_id', 'invitation_code']),
  member_id: z.string().trim().min(3).max(50).optional(),
  landesverband: z.string().trim().min(2).max(100).optional(),
  invitation_code: z.string().trim().min(4).max(32).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
      throw new Error('Supabase env not configured');
    }

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    // Feature-Flag check
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: flag } = await admin
      .from('feature_flags')
      .select('enabled')
      .eq('flag_key', 'dehoga_onboarding_enabled')
      .maybeSingle();
    if (!flag?.enabled) {
      return new Response(JSON.stringify({ error: 'DEHOGA onboarding not yet available' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate body
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = parsed.data;

    let verifiedLandesverband: string | null = null;
    let verifiedMemberId: string | null = null;

    if (body.method === 'invitation_code') {
      if (!body.invitation_code) {
        return new Response(JSON.stringify({ error: 'invitation_code required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const code = body.invitation_code.toUpperCase();
      const { data: codeRow, error: codeErr } = await admin
        .from('dehoga_invitation_codes')
        .select('id, landesverband, used_by, valid_until')
        .eq('code', code)
        .maybeSingle();
      if (codeErr || !codeRow) {
        return new Response(JSON.stringify({ error: 'Invalid code' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (codeRow.used_by) {
        return new Response(JSON.stringify({ error: 'Code already used' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (codeRow.valid_until && new Date(codeRow.valid_until) < new Date()) {
        return new Response(JSON.stringify({ error: 'Code expired' }), {
          status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await admin.from('dehoga_invitation_codes')
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq('id', codeRow.id);
      verifiedLandesverband = codeRow.landesverband;
    } else {
      // method=member_id — format check (echte DEHOGA-API-Anbindung folgt nach Partnerschaft)
      if (!body.member_id || !body.landesverband) {
        return new Response(JSON.stringify({ error: 'member_id and landesverband required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!/^[A-Z0-9-]{4,30}$/i.test(body.member_id)) {
        return new Response(JSON.stringify({ error: 'Invalid member_id format' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      verifiedMemberId = body.member_id;
      verifiedLandesverband = body.landesverband;
    }

    // Update partner profile (Select → Update Pattern wegen RLS-Trigger Best Practice)
    const { data: profile } = await admin
      .from('partner_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Partner profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { error: updErr } = await admin
      .from('partner_profiles')
      .update({
        is_dehoga_member: true,
        dehoga_member_id: verifiedMemberId,
        dehoga_landesverband: verifiedLandesverband,
        dehoga_verification_method: body.method,
        dehoga_verified_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({
      success: true,
      landesverband: verifiedLandesverband,
      method: body.method,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('validate-dehoga-membership error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});