import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { isCronAuthorized, unauthorizedResponse } from '../_shared/auth-guards.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Critical tables to back up (in dependency-safe order for restore)
const TABLES = [
  'profiles',
  'user_roles',
  'user_preferences',
  'user_points',
  'user_favorites',
  'venues',
  'venue_partnerships',
  'partner_profiles',
  'friendships',
  'date_planning_sessions',
  'date_invitations',
  'date_proposals',
  'date_feedback',
  'date_groups',
  'date_group_members',
  'vouchers',
  'partner_exclusive_vouchers',
  'reward_redemptions',
  'referrals',
  'ai_learning_data',
  'user_venue_feedback',
  'feature_flags',
  'admin_team',
  'dehoga_invitation_codes',
];

const RETENTION_WEEKS = 8;

async function dumpTable(supabase: ReturnType<typeof createClient>, table: string) {
  const pageSize = 1000;
  let from = 0;
  const rows: unknown[] = [];
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!isCronAuthorized(req)) {
    console.warn('[weekly-db-backup] Unauthorized invocation');
    return unauthorizedResponse(corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const results: Record<string, { rows: number; bytes: number; error?: string }> = {};
  let totalRows = 0;
  let totalBytes = 0;

  for (const table of TABLES) {
    try {
      const rows = await dumpTable(supabase, table);
      const json = JSON.stringify(rows);
      const bytes = new TextEncoder().encode(json).length;
      const path = `backup-${stamp}/${table}.json`;
      const { error: upErr } = await supabase.storage
        .from('db-backups')
        .upload(path, json, { contentType: 'application/json', upsert: true });
      if (upErr) throw upErr;
      results[table] = { rows: rows.length, bytes };
      totalRows += rows.length;
      totalBytes += bytes;
    } catch (e) {
      results[table] = { rows: 0, bytes: 0, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Manifest
  const manifest = {
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    total_rows: totalRows,
    total_bytes: totalBytes,
    tables: results,
    retention_weeks: RETENTION_WEEKS,
  };
  await supabase.storage
    .from('db-backups')
    .upload(`backup-${stamp}/_manifest.json`, JSON.stringify(manifest, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });

  // Retention: list folders and delete anything older than RETENTION_WEEKS
  try {
    const cutoff = Date.now() - RETENTION_WEEKS * 7 * 24 * 60 * 60 * 1000;
    const { data: folders } = await supabase.storage.from('db-backups').list('', { limit: 1000 });
    for (const f of folders ?? []) {
      if (!f.name.startsWith('backup-')) continue;
      const ts = f.name.replace('backup-', '').replace(/-/g, (m, i: number) =>
        i === 10 ? 'T' : i === 13 || i === 16 ? ':' : i === 19 ? '.' : '-'
      );
      const d = new Date(ts);
      if (!isFinite(d.getTime()) || d.getTime() >= cutoff) continue;
      const { data: files } = await supabase.storage.from('db-backups').list(f.name, { limit: 1000 });
      const paths = (files ?? []).map((x) => `${f.name}/${x.name}`);
      if (paths.length) await supabase.storage.from('db-backups').remove(paths);
    }
  } catch (e) {
    console.warn('Retention cleanup failed:', e);
  }

  console.log('💾 WEEKLY-DB-BACKUP:', JSON.stringify({ stamp, totalRows, totalBytes }));
  return new Response(JSON.stringify({ ok: true, ...manifest }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});