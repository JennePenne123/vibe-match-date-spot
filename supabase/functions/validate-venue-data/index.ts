import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Mavenu/1.0 (venue-validation)";
const BATCH_SIZE = 10; // Process 10 venues at a time to respect rate limits
const DELAY_MS = 1100; // Nominatim requires max 1 req/sec

interface ValidationIssue {
  type: string;
  message: string;
  severity: "warning" | "error";
}

interface ValidationResult {
  venue_id: string;
  venue_name: string;
  score: number;
  issues: ValidationIssue[];
  nominatim_match_name: string | null;
  address_corrected: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Calculate distance between two lat/lng points in meters (Haversine) */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Search Nominatim for a venue by name + address and compare with stored coordinates */
async function validateVenue(venue: {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  let score = 100;
  let nominatimName: string | null = null;
  let addressCorrected = false;

  // Basic data checks
  if (!venue.latitude || !venue.longitude) {
    issues.push({ type: "missing_coords", message: "Keine Koordinaten vorhanden", severity: "error" });
    score -= 40;
  }

  if (!venue.address || venue.address.length < 5) {
    issues.push({ type: "missing_address", message: "Adresse fehlt oder zu kurz", severity: "error" });
    score -= 20;
  }

  if (!venue.name || venue.name.length < 3) {
    issues.push({ type: "invalid_name", message: "Name fehlt oder zu kurz", severity: "error" });
    score -= 30;
  }

  // If we have coordinates, reverse-geocode to check what's actually there
  if (venue.latitude && venue.longitude) {
    try {
      // Step 1: Reverse geocode the stored coordinates
      const reverseUrl = `${NOMINATIM_BASE}/reverse?lat=${venue.latitude}&lon=${venue.longitude}&format=json&addressdetails=1&zoom=18&namedetails=1`;
      const reverseRes = await fetch(reverseUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });

      if (reverseRes.ok) {
        const reverseData = await reverseRes.json();
        const foundName = reverseData.namedetails?.name || reverseData.name || "";
        nominatimName = foundName || null;

        // Check if the reverse-geocoded name matches our venue name
        if (foundName) {
          const nameMatch = compareFuzzy(venue.name, foundName);
          if (nameMatch < 0.3) {
            issues.push({
              type: "name_mismatch",
              message: `Name "${venue.name}" stimmt nicht mit Koordinaten-Ergebnis "${foundName}" überein (Ähnlichkeit: ${Math.round(nameMatch * 100)}%)`,
              severity: "warning",
            });
            score -= 20;
          }
        }

        // Check address quality from reverse geocoding
        const addr = reverseData.address || {};
        const reverseAddress = [
          [addr.road || addr.pedestrian || "", addr.house_number || ""].filter(Boolean).join(" "),
          [addr.postcode || "", addr.city || addr.town || addr.village || ""].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ");

        if (reverseAddress && reverseAddress.length > venue.address.length) {
          // We have a better address from reverse geocoding
          issues.push({
            type: "address_improved",
            message: `Bessere Adresse gefunden: "${reverseAddress}"`,
            severity: "warning",
          });
        }
      }

      await sleep(DELAY_MS);

      // Step 2: Forward search for the venue name to find its true location
      const searchQuery = `${venue.name} ${extractCity(venue.address)}`;
      const searchUrl = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=3&countrycodes=de,at,ch`;
      const searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });

      if (searchRes.ok) {
        const searchResults = await searchRes.json();

        if (searchResults.length === 0) {
          issues.push({
            type: "not_found_nominatim",
            message: `"${venue.name}" nicht bei Nominatim/OSM gefunden – eventuell nicht in OpenStreetMap eingetragen`,
            severity: "warning",
          });
          score -= 10;
        } else {
          // Find best matching result
          const bestMatch = searchResults[0];
          const resultLat = parseFloat(bestMatch.lat);
          const resultLon = parseFloat(bestMatch.lon);
          const distanceM = haversineMeters(venue.latitude, venue.longitude, resultLat, resultLon);

          if (distanceM > 500) {
            issues.push({
              type: "location_mismatch",
              message: `Gespeicherte Koordinaten weichen ${Math.round(distanceM)}m vom Nominatim-Ergebnis ab`,
              severity: distanceM > 2000 ? "error" : "warning",
            });
            score -= distanceM > 2000 ? 30 : 15;
          } else if (distanceM < 100) {
            // Coordinates match well
            score = Math.min(score + 5, 100);
          }
        }
      }
    } catch (err) {
      issues.push({
        type: "validation_error",
        message: `Validierung fehlgeschlagen: ${err.message}`,
        severity: "warning",
      });
    }
  }

  return {
    venue_id: venue.id,
    venue_name: venue.name,
    score: Math.max(0, Math.min(100, score)),
    issues,
    nominatim_match_name: nominatimName,
    address_corrected: addressCorrected,
  };
}

/** Extract city from address string */
function extractCity(address: string): string {
  if (!address) return "";
  // Try to find city after last comma or after postal code
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    // Last meaningful part is often the city
    const lastPart = parts[parts.length - 1];
    // Remove country names
    return lastPart.replace(/\b(Germany|Deutschland|Austria|Österreich|Switzerland|Schweiz)\b/gi, "").trim();
  }
  return address;
}

/** Simple fuzzy string comparison (0-1 scale) using bigrams */
function compareFuzzy(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-zäöüß0-9]/g, "");
  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return 1;
  if (!na || !nb) return 0;

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  // Bigram similarity
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };

  const bg1 = bigrams(na);
  const bg2 = bigrams(nb);
  let intersection = 0;
  for (const b of bg1) if (bg2.has(b)) intersection++;

  return (2 * intersection) / (bg1.size + bg2.size);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request
    const body = await req.json().catch(() => ({}));
    const venueId = body.venue_id as string | undefined;
    const limit = Math.min(body.limit || BATCH_SIZE, 50);
    const dryRun = body.dry_run !== false; // Default to dry_run=true for safety

    // Fetch venues to validate
    let query = supabase
      .from("venues")
      .select("id, name, address, latitude, longitude")
      .eq("is_active", true)
      .order("last_validated_at", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (venueId) {
      query = supabase
        .from("venues")
        .select("id, name, address, latitude, longitude")
        .eq("id", venueId);
    }

    const { data: venues, error: fetchError } = await query;
    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!venues || venues.length === 0) {
      return new Response(
        JSON.stringify({ message: "Keine Venues zum Validieren gefunden", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each venue with rate limiting
    const results: ValidationResult[] = [];
    for (const venue of venues) {
      const result = await validateVenue(venue);
      results.push(result);

      // Update venue with validation results (unless dry_run)
      if (!dryRun) {
        await supabase
          .from("venues")
          .update({
            data_quality_score: result.score,
            data_quality_issues: result.issues,
            last_validated_at: new Date().toISOString(),
            nominatim_match_name: result.nominatim_match_name,
          })
          .eq("id", venue.id);
      }

      // Rate limiting between venues
      if (venues.indexOf(venue) < venues.length - 1) {
        await sleep(DELAY_MS);
      }
    }

    // Summary
    const summary = {
      total_validated: results.length,
      dry_run: dryRun,
      avg_quality_score: Math.round(results.reduce((s, r) => s + r.score, 0) / results.length),
      issues_found: results.filter((r) => r.issues.length > 0).length,
      critical_issues: results.filter((r) => r.issues.some((i) => i.severity === "error")).length,
      name_mismatches: results.filter((r) => r.issues.some((i) => i.type === "name_mismatch")).length,
      location_mismatches: results.filter((r) => r.issues.some((i) => i.type === "location_mismatch")).length,
    };

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
