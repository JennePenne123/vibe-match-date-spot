import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the scanning partner's JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: scanningUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !scanningUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { voucher_id, user_id, code, type } = await req.json();

    // Use service role for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify scanner is a venue_partner
    const { data: partnerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", scanningUser.id)
      .eq("role", "venue_partner")
      .maybeSingle();

    if (!partnerRole) {
      return new Response(
        JSON.stringify({ error: "Only venue partners can redeem vouchers", status: "unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle user voucher redemption
    if (type === "vybe_user_voucher") {
      // Find the voucher
      const { data: voucher, error: voucherError } = await adminClient
        .from("vouchers")
        .select("*, venues(name)")
        .eq("id", voucher_id)
        .eq("code", code)
        .eq("status", "active")
        .maybeSingle();

      if (voucherError || !voucher) {
        return new Response(
          JSON.stringify({ error: "Voucher nicht gefunden oder ungültig", status: "not_found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already redeemed by this user
      const { data: existingRedemption } = await adminClient
        .from("voucher_redemptions")
        .select("id")
        .eq("voucher_id", voucher_id)
        .eq("user_id", user_id)
        .maybeSingle();

      if (existingRedemption) {
        return new Response(
          JSON.stringify({
            error: "Dieser Voucher wurde bereits eingelöst",
            status: "already_redeemed",
            redeemed: true,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check voucher validity (30-day rule)
      if (new Date(voucher.valid_until) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Voucher ist abgelaufen", status: "expired" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check max redemptions
      if (voucher.max_redemptions && voucher.current_redemptions >= voucher.max_redemptions) {
        return new Response(
          JSON.stringify({ error: "Voucher hat maximale Einlösungen erreicht", status: "max_reached" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the scanning partner owns this venue
      const { data: partnership } = await adminClient
        .from("venue_partnerships")
        .select("id")
        .eq("partner_id", scanningUser.id)
        .eq("venue_id", voucher.venue_id)
        .eq("status", "active")
        .maybeSingle();

      if (!partnership) {
        return new Response(
          JSON.stringify({
            error: "Sie sind nicht berechtigt, Vouchers für dieses Venue einzulösen",
            status: "wrong_venue",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create redemption record
      const { error: redemptionError } = await adminClient
        .from("voucher_redemptions")
        .insert({
          voucher_id: voucher_id,
          user_id: user_id,
          discount_applied: voucher.discount_value,
          status: "completed",
        });

      if (redemptionError) {
        console.error("Redemption error:", redemptionError);
        return new Response(
          JSON.stringify({ error: "Fehler beim Einlösen", status: "error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Award points to the user who redeemed the voucher
      try {
        const { data: currentPoints } = await adminClient
          .from("user_points")
          .select("total_points, level, badges")
          .eq("user_id", user_id)
          .maybeSingle();

        if (currentPoints) {
          const newTotal = (currentPoints.total_points || 0) + 15;
          // Calculate level using fixed thresholds
          const thresholds = [0, 150, 500, 1000, 2000, 3500, 5500];
          let newLevel = 1;
          for (let i = thresholds.length - 1; i >= 0; i--) {
            if (newTotal >= thresholds[i]) {
              newLevel = i + 1;
              break;
            }
          }

          await adminClient
            .from("user_points")
            .update({ total_points: newTotal, level: newLevel })
            .eq("user_id", user_id);
        }
      } catch (pointsError) {
        console.error("Points award error (non-blocking):", pointsError);
      }

      // current_redemptions is incremented by the trigger `increment_voucher_redemptions`

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Voucher erfolgreich eingelöst!",
          voucher: {
            title: voucher.title,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            venue_name: (voucher.venues as any)?.name || "Venue",
            code: voucher.code,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle partner exclusive voucher redemption
    if (type === "vybe_partner") {
      // This is handled by the existing partner QR flow in the frontend
      return new Response(
        JSON.stringify({ error: "Partner-Vouchers werden direkt verarbeitet", status: "use_frontend" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unbekannter QR-Code-Typ", status: "unknown_type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Redeem voucher error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler", status: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
