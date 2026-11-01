import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Verify request comes from our own scheduler or another backend function.
 * Accepts (any one is enough):
 *  - `x-cron-token` matching `venue_import_control.cron_token` (used by all pg_cron jobs)
 *  - legacy `x-cron-secret` matching the CRON_SECRET env var
 *  - `Authorization: Bearer <service role key>` (function-to-function calls)
 * ALWAYS await this — it is async.
 */
export async function isCronAuthorized(req: Request): Promise<boolean> {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const legacy = req.headers.get('x-cron-secret');
  if (cronSecret && legacy && legacy === cronSecret) return true;

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) return true;

  const token = req.headers.get('x-cron-token');
  if (!token || !serviceRoleKey) return false;
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey);
    const { data } = await admin
      .from('venue_import_control')
      .select('cron_token')
      .eq('id', true)
      .maybeSingle();
    return !!data?.cron_token && data.cron_token === token;
  } catch {
    return false;
  }
}

export function unauthorizedResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

/**
 * Verify the caller has a valid Supabase user JWT.
 * Returns { userId, isAdmin } on success, null otherwise.
 */
export async function verifyUserAuth(
  req: Request,
): Promise<{ userId: string; isAdmin: boolean; token: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = data.claims.sub as string;

  // Optional admin lookup — non-fatal
  let isAdmin = false;
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const [{ data: roleRow }, { data: teamRow }] = await Promise.all([
      admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
      admin.from('admin_team').select('user_id').eq('user_id', userId).maybeSingle(),
    ]);
    isAdmin = !!roleRow || !!teamRow;
  } catch {
    isAdmin = false;
  }

  return { userId, isAdmin, token };
}

/**
 * Allow either a valid CRON_SECRET header or an authenticated admin user.
 * Returns true when the caller is authorized.
 */
export async function requireCronOrAdmin(req: Request): Promise<boolean> {
  if (isCronAuthorized(req)) return true;
  const auth = await verifyUserAuth(req);
  return !!auth?.isAdmin;
}