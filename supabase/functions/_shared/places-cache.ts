/**
 * Shared server-side cache for external Places provider responses.
 *
 * Stores already-normalised venue payloads in `public.venue_search_cache`
 * (cache_type = 'google_places'), so repeated searches for the same
 * location/type combination are served from Postgres instead of billing a new
 * Google Places request. Works across users, sessions and devices.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

export const PLACES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export function getServiceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Stable cache key: sha-256 over the exact upstream request. */
export async function buildPlacesCacheKey(
  endpoint: string,
  body: unknown,
  fieldMask: string,
): Promise<string> {
  const raw = JSON.stringify({ endpoint, body, fieldMask });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `gplaces:${hex}`;
}

export async function readPlacesCache(
  supabase: SupabaseClient | null,
  cacheKey: string,
): Promise<{ venues: any[]; ageMs: number } | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("venue_search_cache")
      .select("payload, created_at, hit_count")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!data?.payload) return null;

    // Best-effort hit counter (fire and forget)
    supabase
      .from("venue_search_cache")
      .update({
        hit_count: (data.hit_count ?? 0) + 1,
        last_hit_at: new Date().toISOString(),
      })
      .eq("cache_key", cacheKey)
      .then(() => {});

    return {
      venues: data.payload as any[],
      ageMs: Date.now() - new Date(data.created_at as string).getTime(),
    };
  } catch (err) {
    console.warn("[places-cache] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function writePlacesCache(
  supabase: SupabaseClient | null,
  cacheKey: string,
  venues: any[],
  ttlMs: number = PLACES_CACHE_TTL_MS,
): Promise<void> {
  if (!supabase) {
    console.warn("[places-cache] no service client — skipping write");
    return;
  }
  if (!venues.length) return;
  try {
    const { error } = await supabase
      .from("venue_search_cache")
      .upsert(
        {
          cache_key: cacheKey,
          cache_type: "search",
          source: "google_places",
          payload: venues,
          result_count: venues.length,
          expires_at: new Date(Date.now() + ttlMs).toISOString(),
        },
        { onConflict: "cache_key" },
      );
    if (error) {
      console.warn("[places-cache] write rejected:", error.message);
    } else {
      console.log(`[places-cache] stored ${venues.length} venues for ${cacheKey}`);
    }
  } catch (err) {
    console.warn("[places-cache] write failed:", err instanceof Error ? err.message : err);
  }
}
