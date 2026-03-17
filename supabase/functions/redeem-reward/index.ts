import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_MONTHLY_LIMIT = 2;
const PREMIUM_7_DAY_COST = 750;

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

    // Verify user JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reward_type, voucher_id } = await req.json();
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user points
    const { data: userPoints, error: pointsError } = await adminClient
      .from("user_points")
      .select("total_points, level, badges, premium_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pointsError || !userPoints) {
      return new Response(
        JSON.stringify({ error: "Punkte konnten nicht geladen werden" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isPremium = userPoints.premium_until && new Date(userPoints.premium_until) > new Date();

    // Check monthly redemption limit (free users only)
    if (!isPremium) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: countError } = await adminClient
        .from("reward_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (countError) {
        console.error("Count error:", countError);
        return new Response(
          JSON.stringify({ error: "Fehler beim Prüfen des Monatslimits" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "Monatliches Einlöse-Limit erreicht",
            status: "monthly_limit",
            limit: FREE_MONTHLY_LIMIT,
            used: count,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle voucher redemption
    if (reward_type === "voucher") {
      if (!voucher_id) {
        return new Response(
          JSON.stringify({ error: "Voucher-ID fehlt" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch voucher details
      const { data: voucher, error: voucherError } = await adminClient
        .from("vouchers")
        .select("id, title, discount_type, discount_value, venue_id, code, status, valid_until, max_redemptions, current_redemptions")
        .eq("id", voucher_id)
        .eq("status", "active")
        .maybeSingle();

      if (voucherError || !voucher) {
        return new Response(
          JSON.stringify({ error: "Voucher nicht gefunden oder nicht aktiv" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(voucher.valid_until) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Voucher ist abgelaufen" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (voucher.max_redemptions && voucher.current_redemptions >= voucher.max_redemptions) {
        return new Response(
          JSON.stringify({ error: "Voucher hat maximale Einlösungen erreicht" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already redeemed by this user
      const { data: existingRedemption } = await adminClient
        .from("voucher_redemptions")
        .select("id")
        .eq("voucher_id", voucher_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingRedemption) {
        return new Response(
          JSON.stringify({ error: "Du hast diesen Voucher bereits eingelöst" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate cost: voucher discount_value as points cost
      // e.g. 10% = 500 points, 15% = 750, 20% = 1000, 25% = 1250
      const pointsCost = Math.round(voucher.discount_value * 100);

      if (userPoints.total_points < pointsCost) {
        return new Response(
          JSON.stringify({
            error: "Nicht genug Punkte",
            required: pointsCost,
            available: userPoints.total_points,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct points
      const newTotal = userPoints.total_points - pointsCost;
      const thresholds = [0, 150, 500, 1000, 2000, 3500, 5500];
      let newLevel = 1;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (newTotal >= thresholds[i]) { newLevel = i + 1; break; }
      }

      await adminClient
        .from("user_points")
        .update({ total_points: newTotal, level: newLevel })
        .eq("user_id", user.id);

      // Create voucher redemption
      await adminClient
        .from("voucher_redemptions")
        .insert({
          voucher_id: voucher.id,
          user_id: user.id,
          discount_applied: voucher.discount_value,
          status: "completed",
        });

      // Track reward redemption for monthly limits
      await adminClient
        .from("reward_redemptions")
        .insert({
          user_id: user.id,
          reward_type: "voucher",
          voucher_id: voucher.id,
          points_spent: pointsCost,
        });

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Voucher erfolgreich eingelöst!",
          points_spent: pointsCost,
          new_total: newTotal,
          voucher: {
            title: voucher.title,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            code: voucher.code,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle premium redemption (7 days via points)
    if (reward_type === "premium") {
      if (userPoints.total_points < PREMIUM_7_DAY_COST) {
        return new Response(
          JSON.stringify({
            error: "Nicht genug Punkte",
            required: PREMIUM_7_DAY_COST,
            available: userPoints.total_points,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate new premium_until (extend if already premium)
      const now = new Date();
      const currentPremiumEnd = userPoints.premium_until
        ? new Date(userPoints.premium_until)
        : now;
      const baseDate = currentPremiumEnd > now ? currentPremiumEnd : now;
      const newPremiumUntil = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const newTotal = userPoints.total_points - PREMIUM_7_DAY_COST;
      const thresholds = [0, 150, 500, 1000, 2000, 3500, 5500];
      let newLevel = 1;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (newTotal >= thresholds[i]) { newLevel = i + 1; break; }
      }

      await adminClient
        .from("user_points")
        .update({
          total_points: newTotal,
          level: newLevel,
          premium_until: newPremiumUntil.toISOString(),
        })
        .eq("user_id", user.id);

      // Track reward redemption
      await adminClient
        .from("reward_redemptions")
        .insert({
          user_id: user.id,
          reward_type: "premium",
          points_spent: PREMIUM_7_DAY_COST,
        });

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Premium für 7 Tage aktiviert!",
          points_spent: PREMIUM_7_DAY_COST,
          new_total: newTotal,
          premium_until: newPremiumUntil.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unbekannter Reward-Typ" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Redeem reward error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
