import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Verify request is authorized by the internal CRON_SECRET header.
 * Returns true when valid.
 */
export function isCronAuthorized(req: Request): boolean {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) return false;
  const provided = req.headers.get('x-cron-secret');
  return !!provided && provided === cronSecret;
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
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    isAdmin = !!roleRow;
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