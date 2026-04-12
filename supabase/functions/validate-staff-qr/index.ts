import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const INTERVAL = 30; // seconds – must match client

/** Same hash as client RotatingQRCode component */
function generateTimeCode(token: string, timeWindow: number): string {
  const input = `${token}:${timeWindow}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Verify caller is authenticated
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { staff_id, partner_id, voucher_id, tc, tw } = body;

    if (!staff_id || !partner_id || !tc || tw === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Look up the staff member and their qr_code_token (service role to bypass RLS)
    const { data: staffRow, error: staffErr } = await supabaseAdmin
      .from("venue_staff")
      .select("id, partner_id, qr_code_token, name, status")
      .eq("id", staff_id)
      .eq("partner_id", partner_id)
      .eq("status", "active")
      .maybeSingle();

    if (staffErr || !staffRow) {
      return new Response(JSON.stringify({ valid: false, reason: "Staff not found or inactive" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify time code – accept current window and previous window (clock drift tolerance)
    const now = Date.now();
    const currentWindow = Math.floor(now / (INTERVAL * 1000));
    const validWindows = [currentWindow, currentWindow - 1]; // allow 1 window of drift

    const expectedCodes = validWindows.map((w) =>
      generateTimeCode(staffRow.qr_code_token, w)
    );

    if (!expectedCodes.includes(tc)) {
      return new Response(JSON.stringify({ valid: false, reason: "QR code expired or invalid" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. If voucher_id is provided, verify the voucher exists and belongs to this partner
    let voucherInfo = null;
    if (voucher_id) {
      const { data: voucher, error: vErr } = await supabaseAdmin
        .from("partner_exclusive_vouchers")
        .select("id, title, discount_type, discount_value, status, valid_until, receiving_partner_id")
        .eq("id", voucher_id)
        .eq("receiving_partner_id", partner_id)
        .eq("status", "active")
        .maybeSingle();

      if (vErr || !voucher) {
        return new Response(JSON.stringify({ valid: false, reason: "Voucher not found or inactive" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(voucher.valid_until) < new Date()) {
        return new Response(JSON.stringify({ valid: false, reason: "Voucher expired" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      voucherInfo = {
        id: voucher.id,
        title: voucher.title,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
      };

      // Mark voucher as redeemed
      await supabaseAdmin
        .from("partner_exclusive_vouchers")
        .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
        .eq("id", voucher_id);
    }

    // 4. Update last_scan_at on staff record
    await supabaseAdmin
      .from("venue_staff")
      .update({ last_scan_at: new Date().toISOString() })
      .eq("id", staff_id);

    return new Response(
      JSON.stringify({
        valid: true,
        staff_name: staffRow.name,
        partner_id: staffRow.partner_id,
        voucher: voucherInfo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("validate-staff-qr error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
