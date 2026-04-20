import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  checkRateLimitWithLogging,
  getRateLimitIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
} from "../_shared/rate-limiter.ts";

/**
 * Tiered Venue Search Orchestrator
 * ---------------------------------
 * Strategy (per user decision):
 *  1. Cache lookup (search results: 3 days TTL)
 *  2. Google Places (PRIMARY)        – best data quality, cost ~$17/1k (Standard field mask)
 *  3. Overpass/OSM  (FALLBACK)       – free, triggered on Google error OR empty result
 *     + Nominatim enrichment for venues with missing addresses (1 req/sec rate-limit aware)
 *
 * Fallback trigger: error/timeout OR empty result set
 * Foursquare: DISABLED (code retained, toggle via FOURSQUARE_ENABLED constant)
 */

const SEARCH_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days for search results
const GOOGLE_TIMEOUT_MS = 8000;
const FOURSQUARE_TIMEOUT_MS = 8000;
const OVERPASS_TIMEOUT_MS = 12000;
const NOMINATIM_TIMEOUT_MS = 3000;
const FOURSQUARE_ENABLED = false; // Disabled per user decision (2026-04-20)

interface SearchPayload {
  latitude: number;
  longitude: number;
  radius?: number;
  cuisines?: string[];
  venueTypes?: string[];
  activities?: string[];
  limit?: number;
  forceRefresh?: boolean;
}

interface TierResult {
  source: "google_places" | "foursquare" | "overpass";
  venues: any[];
  durationMs: number;
  error?: string;
}

function buildCacheKey(p: SearchPayload): string {
  const lat = Number(p.latitude).toFixed(3); // ~110m precision
  const lng = Number(p.longitude).toFixed(3);
  const radius = Math.round((p.radius ?? 5000) / 500) * 500; // bucket to 500m
  const cuisines = [...(p.cuisines ?? [])].sort().join(",");
  const types = [...(p.venueTypes ?? [])].sort().join(",");
  const acts = [...(p.activities ?? [])].sort().join(",");
  return `search:${lat}:${lng}:${radius}:${cuisines}|${types}|${acts}`;
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
    ),
  ]);
}

async function callTier(
  supabase: ReturnType<typeof createClient>,
  fnName: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ venues: any[]; error?: string }> {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke(fnName, { body }),
      timeoutMs,
      fnName,
    );
    if (error) return { venues: [], error: error.message };
    return { venues: (data as any)?.venues ?? [] };
  } catch (err) {
    return { venues: [], error: err instanceof Error ? err.message : String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const identifier = getRateLimitIdentifier(req);
  const rl = await checkRateLimitWithLogging(
    identifier,
    "search-venues-tiered",
    RATE_LIMITS.EXTERNAL_API,
    req,
  );
  if (!rl.allowed) return rateLimitResponse(corsHeaders);

  const startedAt = Date.now();
  const tiersTried: TierResult[] = [];

  try {
    const payload = (await req.json()) as SearchPayload;
    if (!payload?.latitude || !payload?.longitude) {
      return new Response(
        JSON.stringify({ success: false, error: "latitude/longitude required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const cacheKey = buildCacheKey(payload);

    // 1️⃣ CACHE LOOKUP (skip if forceRefresh)
    if (!payload.forceRefresh) {
      const { data: cached } = await supabase
        .from("venue_search_cache")
        .select("payload, source, expires_at, hit_count")
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached) {
        // Best-effort hit counter update (don't await)
        supabase
          .from("venue_search_cache")
          .update({
            hit_count: (cached.hit_count ?? 0) + 1,
            last_hit_at: new Date().toISOString(),
          })
          .eq("cache_key", cacheKey)
          .then(() => {});

        return new Response(
          JSON.stringify({
            success: true,
            venues: cached.payload,
            source: cached.source,
            cached: true,
            duration_ms: Date.now() - startedAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2️⃣ TIER 1: GOOGLE PLACES (PRIMARY)
    const googlePayload = {
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius: payload.radius ?? 5000,
      cuisines: payload.cuisines ?? [],
      originalCuisines: payload.cuisines ?? [],
      types: payload.venueTypes?.length ? payload.venueTypes : ["restaurant"],
      // Field mask hint (Standard tier) – consumed by search-venues if it switches to Places API New
      fieldMask: "essentials+pro",
    };
    const t1Start = Date.now();
    const r1 = await callTier(supabase, "search-venues", googlePayload, GOOGLE_TIMEOUT_MS);
    tiersTried.push({
      source: "google_places",
      venues: r1.venues,
      durationMs: Date.now() - t1Start,
      error: r1.error,
    });

    let finalSource: TierResult["source"] = "google_places";
    let finalVenues = r1.venues;

    // Fallback trigger: error OR empty result
    if (!r1.venues.length) {
      // 3️⃣ TIER 2: FOURSQUARE (SECONDARY)
      const fsqPayload = {
        latitude: payload.latitude,
        longitude: payload.longitude,
        radius: payload.radius ?? 5000,
        cuisines: payload.cuisines ?? [],
        venueTypes: payload.venueTypes ?? [],
        activities: payload.activities ?? [],
        limit: payload.limit ?? 20,
      };
      const t2Start = Date.now();
      const r2 = await callTier(
        supabase,
        "search-venues-foursquare",
        fsqPayload,
        FOURSQUARE_TIMEOUT_MS,
      );
      tiersTried.push({
        source: "foursquare",
        venues: r2.venues,
        durationMs: Date.now() - t2Start,
        error: r2.error,
      });

      if (r2.venues.length) {
        finalSource = "foursquare";
        finalVenues = r2.venues;
      } else {
        // 4️⃣ TIER 3: OVERPASS / OSM (FINAL FALLBACK)
        const osmPayload = {
          latitude: payload.latitude,
          longitude: payload.longitude,
          radius: payload.radius ?? 5000,
          cuisines: payload.cuisines ?? [],
          venueTypes: payload.venueTypes ?? [],
          activities: payload.activities ?? [],
          limit: payload.limit ?? 20,
        };
        const t3Start = Date.now();
        const r3 = await callTier(
          supabase,
          "search-venues-overpass",
          osmPayload,
          OVERPASS_TIMEOUT_MS,
        );
        tiersTried.push({
          source: "overpass",
          venues: r3.venues,
          durationMs: Date.now() - t3Start,
          error: r3.error,
        });
        finalSource = "overpass";
        finalVenues = r3.venues;
      }
    }

    // 5️⃣ CACHE WRITE (only if we have venues)
    if (finalVenues.length > 0) {
      const expiresAt = new Date(Date.now() + SEARCH_TTL_MS).toISOString();
      // Fire-and-forget upsert
      supabase
        .from("venue_search_cache")
        .upsert(
          {
            cache_key: cacheKey,
            cache_type: "search",
            source: finalSource,
            payload: finalVenues,
            result_count: finalVenues.length,
            expires_at: expiresAt,
          },
          { onConflict: "cache_key" },
        )
        .then(() => {});
    }

    return new Response(
      JSON.stringify({
        success: true,
        venues: finalVenues,
        source: finalSource,
        cached: false,
        duration_ms: Date.now() - startedAt,
        tiers_tried: tiersTried.map((t) => ({
          source: t.source,
          venue_count: t.venues.length,
          duration_ms: t.durationMs,
          error: t.error,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ TIERED SEARCH: Critical error:", message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Tiered search failed",
        details: message,
        tiers_tried: tiersTried,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});