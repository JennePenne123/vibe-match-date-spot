import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from '../_shared/cors.ts';

const CODE_COUNT = 10;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function requireUser(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function randomCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}

function normalize(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function hashCode(userId: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${userId}:${normalize(code)}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: { action?: string; email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  try {
    // ---------- Generate a fresh batch (replaces existing codes) ----------
    if (body.action === 'generate') {
      const user = await requireUser(req);
      if (!user) return json({ error: 'unauthorized' }, 401);

      await admin.from('user_recovery_codes').delete().eq('user_id', user.id);

      const codes: string[] = [];
      const rows: { user_id: string; code_hash: string; batch_label: string }[] = [];
      const batchLabel = new Date().toISOString();

      while (codes.length < CODE_COUNT) {
        const code = randomCode();
        if (codes.includes(code)) continue;
        codes.push(code);
        rows.push({
          user_id: user.id,
          code_hash: await hashCode(user.id, code),
          batch_label: batchLabel,
        });
      }

      const { error } = await admin.from('user_recovery_codes').insert(rows);
      if (error) throw error;

      // Codes are returned exactly once and never stored in plain text.
      return json({ codes, generated_at: batchLabel });
    }

    // ---------- Redeem a code (no session required) ----------
    if (body.action === 'redeem') {
      const email = (body.email ?? '').trim().toLowerCase();
      const code = body.code ?? '';
      if (!email || normalize(code).length < 8) return json({ error: 'invalid_body' }, 400);

      // Resolve the user id for the given email
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      // Always behave the same way for unknown accounts / wrong codes
      if (!profile) return json({ error: 'invalid_code' }, 401);

      const codeHash = await hashCode(profile.id, code);
      const { data: row } = await admin
        .from('user_recovery_codes')
        .select('id, used_at')
        .eq('user_id', profile.id)
        .eq('code_hash', codeHash)
        .maybeSingle();

      if (!row || row.used_at) return json({ error: 'invalid_code' }, 401);

      const { error: markError } = await admin
        .from('user_recovery_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', row.id)
        .is('used_at', null);
      if (markError) return json({ error: 'invalid_code' }, 401);

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
      if (userError || !userData.user?.email) return json({ error: 'invalid_code' }, 401);

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
      });
      if (linkError || !linkData.properties?.hashed_token) {
        return json({ error: 'session_creation_failed' }, 500);
      }

      const { count } = await admin
        .from('user_recovery_codes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .is('used_at', null);

      return json({
        verified: true,
        email: userData.user.email,
        token_hash: linkData.properties.hashed_token,
        remaining: count ?? 0,
      });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    console.error('[recovery-codes] error', err);
    return json({ error: 'internal_error' }, 500);
  }
});