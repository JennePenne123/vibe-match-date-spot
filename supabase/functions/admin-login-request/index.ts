import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

// Hidden admin magic-link request.
// - Server-side gate via admin_team (service role)
// - Always returns identical response (no user enumeration)
// - Only sends magic link if email belongs to an admin_team member

const GENERIC_RESPONSE = {
  ok: true,
  message: 'If this address is authorized, a sign-in link has been sent.',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  let email = '';
  let redirectTo = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
    redirectTo = String(body?.redirectTo ?? '').trim();
  } catch {
    return jsonResponse(GENERIC_RESPONSE);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    // Don't leak validation details
    return jsonResponse(GENERIC_RESPONSE);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Look up auth user by email
    const { data: usersResp, error: usersErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersErr) {
      console.error('admin-login-request: listUsers failed', usersErr);
      return jsonResponse(GENERIC_RESPONSE);
    }

    const matched = usersResp?.users?.find(
      (u) => (u.email ?? '').toLowerCase() === email
    );
    if (!matched) {
      return jsonResponse(GENERIC_RESPONSE);
    }

    // 2. Verify membership in admin_team (server-side gate)
    const { data: teamRow, error: teamErr } = await admin
      .from('admin_team')
      .select('admin_role')
      .eq('user_id', matched.id)
      .maybeSingle();

    if (teamErr || !teamRow) {
      return jsonResponse(GENERIC_RESPONSE);
    }

    // 3. Send magic link via public auth (triggers auth-email-hook automatically)
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: otpErr } = await publicClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo || undefined,
      },
    });

    if (otpErr) {
      console.error('admin-login-request: signInWithOtp failed', otpErr);
    }
  } catch (err) {
    console.error('admin-login-request: unexpected error', err);
  }

  return jsonResponse(GENERIC_RESPONSE);
});
