/**
 * Shared photo backfill cache + logging.
 *
 * Every attempt to find real photos for a venue is recorded in
 * `public.venue_photo_attempts` (one row per venue + source). Backfill workers
 * read this table first so the same venue is never queried twice against a
 * paid/rate-limited provider within its cooldown window, and admins can track
 * hit rates and estimated cost.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type PhotoSource = "google" | "wikimedia" | "foursquare";
export type PhotoAttemptStatus = "hit" | "miss" | "error";

/** Cooldown before a venue is retried against the same source. */
export const COOLDOWN_MS: Record<PhotoAttemptStatus, number> = {
  hit: 180 * 24 * 60 * 60 * 1000, // 180 days — we already have photos
  miss: 30 * 24 * 60 * 60 * 1000, // 30 days — provider has nothing (yet)
  error: 2 * 60 * 60 * 1000, // 2 hours — transient failure
};

/** Rough per-request cost in USD, used for cost monitoring only. */
export const COST_PER_CALL: Record<PhotoSource, number> = {
  google: 0.032,
  wikimedia: 0,
  foursquare: 0,
};

/**
 * Returns the subset of venue ids that are still inside their cooldown window
 * for the given source and must therefore be skipped.
 */
export async function getCachedVenueIds(
  admin: SupabaseClient,
  source: PhotoSource,
  venueIds: string[],
): Promise<Set<string>> {
  if (venueIds.length === 0) return new Set();
  try {
    const { data, error } = await admin
      .from("venue_photo_attempts")
      .select("venue_id")
      .eq("source", source)
      .in("venue_id", venueIds)
      .gt("next_retry_at", new Date().toISOString());
    if (error) {
      console.warn("[photo-cache] read failed:", error.message);
      return new Set();
    }
    return new Set((data || []).map((r: { venue_id: string }) => r.venue_id));
  } catch (err) {
    console.warn("[photo-cache] read error:", err instanceof Error ? err.message : err);
    return new Set();
  }
}

export interface RecordAttemptInput {
  venueId: string;
  source: PhotoSource;
  status: PhotoAttemptStatus;
  photoCount?: number;
  apiCalls?: number;
  message?: string;
}

/** Upserts the attempt row (cache entry + audit log in one). */
export async function recordPhotoAttempt(
  admin: SupabaseClient,
  input: RecordAttemptInput,
): Promise<void> {
  const apiCalls = input.apiCalls ?? 1;
  try {
    const { error } = await admin.from("venue_photo_attempts").upsert(
      {
        venue_id: input.venueId,
        source: input.source,
        status: input.status,
        photo_count: input.photoCount ?? 0,
        api_calls: apiCalls,
        estimated_cost: Number((COST_PER_CALL[input.source] * apiCalls).toFixed(4)),
        message: input.message?.slice(0, 300) ?? null,
        attempted_at: new Date().toISOString(),
        next_retry_at: new Date(Date.now() + COOLDOWN_MS[input.status]).toISOString(),
      },
      { onConflict: "venue_id,source" },
    );
    if (error) console.warn("[photo-cache] write rejected:", error.message);
  } catch (err) {
    console.warn("[photo-cache] write failed:", err instanceof Error ? err.message : err);
  }
}
