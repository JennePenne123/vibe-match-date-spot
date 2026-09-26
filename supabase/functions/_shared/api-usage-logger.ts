import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

/**
 * Shared API usage logger for edge functions.
 *
 * Writes one row per external API call into `api_usage_logs` so the admin
 * cost monitoring page reflects server-side calls in (near) real time.
 * Uses the service role key – never expose this to the browser.
 */

// Estimated cost per call in USD (Google Places New pricing, SKU-based)
export const API_COSTS: Record<string, number> = {
  google_places: 0.017,            // Text/Nearby Search (Pro SKU)
  google_places_details: 0.017,    // Place Details (Pro SKU)
  google_places_photos: 0.007,     // Place Photo media
  foursquare: 0.0,
  overpass: 0.0,
  wikimedia: 0.0,
  supabase_edge: 0.000002,
};

let adminClient: SupabaseClient | null = null;

function getAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  adminClient = createClient(url, key);
  return adminClient;
}

export interface UsageLogEntry {
  api_name: string;
  endpoint?: string;
  user_id?: string;
  response_status?: number;
  response_time_ms?: number;
  estimated_cost?: number;
  request_metadata?: Record<string, unknown>;
  cache_hit?: boolean;
}

/**
 * Fire-and-forget usage log. Never throws – logging must not break the
 * actual API call flow.
 */
export async function logApiUsage(entry: UsageLogEntry): Promise<void> {
  try {
    const admin = getAdmin();
    if (!admin) return;
    const row = {
      api_name: entry.api_name,
      endpoint: entry.endpoint ?? null,
      user_id: entry.user_id ?? null,
      response_status: entry.response_status ?? null,
      response_time_ms: entry.response_time_ms ?? null,
      estimated_cost: entry.estimated_cost ?? API_COSTS[entry.api_name] ?? 0,
      request_metadata: entry.request_metadata ?? null,
      cache_hit: entry.cache_hit ?? false,
    };
    const { error } = await admin.from('api_usage_logs').insert(row);
    if (error) console.warn('[api-usage] insert failed:', error.message);
  } catch (e) {
    console.warn('[api-usage] log error:', e);
  }
}

/**
 * Wraps a fetch() call to an external API with timing + usage logging.
 * Returns the raw Response so callers can inspect status/body themselves.
 */
export async function fetchWithUsageLog(
  apiName: string,
  endpoint: string,
  init: RequestInit & { userId?: string; metadata?: Record<string, unknown>; estimatedCost?: number } = {},
): Promise<Response> {
  const { userId, metadata, estimatedCost, ...fetchInit } = init;
  const start = Date.now();
  let res: Response | null = null;
  try {
    res = await fetch(endpoint, fetchInit);
    return res;
  } finally {
    const elapsed = Date.now() - start;
    // Don't await – keep the hot path fast
    logApiUsage({
      api_name: apiName,
      endpoint,
      user_id: userId,
      response_status: res?.status,
      response_time_ms: elapsed,
      estimated_cost: estimatedCost,
      request_metadata: metadata,
    });
  }
}

// ---------------------------------------------------------------------------
// Budget guard: monthly spending limit per API (table `api_budget_limits`).
// When the limit is reached, paid calls must be skipped so the app falls back
// to free sources (OSM/Overpass, caches, Wikimedia).
// ---------------------------------------------------------------------------

export interface BudgetStatus {
  allowed: boolean;
  spent: number;
  limit: number | null;
  enabled: boolean;
}

// In-invocation cache so a batch loop only checks once
const budgetCache = new Map<string, BudgetStatus>();

/**
 * Returns true when the API may still be called this month.
 * Fails OPEN (returns true) if the check itself errors – logging/budget
 * infrastructure must never break venue search for users.
 */
export async function isWithinBudget(apiName: string): Promise<boolean> {
  const status = await getBudgetStatus(apiName);
  return status.allowed;
}

export async function getBudgetStatus(apiName: string): Promise<BudgetStatus> {
  const cached = budgetCache.get(apiName);
  if (cached) return cached;

  const open: BudgetStatus = { allowed: true, spent: 0, limit: null, enabled: false };
  try {
    const admin = getAdmin();
    if (!admin) return open;

    const { data: limitRow, error: limitErr } = await admin
      .from('api_budget_limits')
      .select('monthly_limit_usd, enabled')
      .eq('api_name', apiName)
      .maybeSingle();

    if (limitErr || !limitRow || !limitRow.enabled) return open;

    const { data: spentRaw, error: spendErr } = await admin.rpc('get_api_monthly_spend', {
      _api_name: apiName,
    });
    if (spendErr) return open;

    const spent = Number(spentRaw) || 0;
    const limit = Number(limitRow.monthly_limit_usd);
    const status: BudgetStatus = {
      allowed: spent < limit,
      spent,
      limit,
      enabled: true,
    };
    budgetCache.set(apiName, status);
    if (!status.allowed) {
      console.warn(`[budget] ${apiName} monthly limit reached: $${spent.toFixed(2)} / $${limit}`);
    }
    return status;
  } catch (e) {
    console.warn('[budget] check failed, failing open:', e);
    return open;
  }
}
