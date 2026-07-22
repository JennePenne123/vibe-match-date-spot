/**
 * RLS Regression Tests
 *
 * Guards the most sensitive tables against accidental privilege regressions
 * caused by schema changes, policy edits or view refactors.
 *
 * Every assertion follows the same shape:
 *   1. Hit the table as an anonymous PostgREST caller.
 *   2. Expect either an RLS/permission error OR an empty result set.
 *   3. Never expect leaked rows.
 *
 * Also verifies that a freshly signed-up "regular" user cannot read data
 * belonging to other users, and cannot escalate their own role.
 *
 * Runs against the real Supabase project via the public anon key — no
 * service-role secret is used, so this test is safe for CI.
 */
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://dfjwubatslzblagthbdw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE";

function anon(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function expectNoLeak(
  client: SupabaseClient,
  table: string,
  columns = "*",
) {
  const { data, error } = await client.from(table as any).select(columns).limit(5);
  // Acceptable outcomes: permission error, RLS-empty result, or explicit []
  if (error) {
    // Any permission / RLS error is a valid "no leak" signal.
    expect(error).toBeTruthy();
    return;
  }
  expect(Array.isArray(data)).toBe(true);
  expect(data?.length ?? 0).toBe(0);
}

describe("RLS regression – anonymous callers", () => {
  const sensitiveTables = [
    "profiles",
    "user_roles",
    "admin_team",
    "user_preferences",
    "user_points",
    "date_invitations",
    "date_planning_sessions",
    "date_proposals",
    "date_group_members",
    "date_group_messages",
    "friendships",
    "push_subscriptions",
    "referrals",
    "reward_redemptions",
    "partner_profiles",
    "partner_exclusive_vouchers",
    "vouchers",
    "support_tickets",
    "error_logs",
    "request_logs",
    "api_usage_logs",
    "ai_learning_data",
    "ai_compatibility_scores",
    "user_venue_feedback",
    "user_preference_vectors",
  ];

  for (const table of sensitiveTables) {
    it(`anon cannot read rows from ${table}`, async () => {
      await expectNoLeak(anon(), table);
    }, 15_000);
  }

  it("anon cannot INSERT into user_roles (privilege escalation vector)", async () => {
    const { error } = await anon()
      .from("user_roles" as any)
      .insert({
        user_id: "00000000-0000-0000-0000-000000000001",
        role: "admin",
      });
    expect(error).toBeTruthy();
  });

  it("anon cannot INSERT into admin_team", async () => {
    const { error } = await anon()
      .from("admin_team" as any)
      .insert({
        user_id: "00000000-0000-0000-0000-000000000001",
        admin_role: "owner",
      } as any);
    expect(error).toBeTruthy();
  });

  it("anon verify_admin_access() never returns true", async () => {
    const { data, error } = await (anon().rpc as any)("verify_admin_access");
    if (error) {
      expect(data).not.toBe(true);
    } else {
      expect(data).toBe(false);
    }
  });

  it("anon has_role(admin) never returns true", async () => {
    const { data, error } = await (anon().rpc as any)("has_role", {
      _user_id: "00000000-0000-0000-0000-000000000001",
      _role: "admin",
    });
    if (error) {
      expect(data).not.toBe(true);
    } else {
      expect(data).not.toBe(true);
    }
  });
});

describe("RLS regression – signed-in non-admin", () => {
  it("cannot escalate own role via user_roles insert, and cannot read other users' data", async () => {
    const email = `e2e-rls-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
    const password = `Passw0rd!${Math.random().toString(36).slice(2)}`;
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signUp, error: signUpErr } = await client.auth.signUp({
      email,
      password,
    });
    if (signUpErr || !signUp.session) {
      console.warn(
        "[rlsRegression] skipping signed-in checks:",
        signUpErr?.message ?? "no session (email confirmation required)",
      );
      return;
    }

    const uid = signUp.user!.id;

    try {
      // 1) Cannot self-assign admin role
      const { error: escalateErr } = await client
        .from("user_roles" as any)
        .insert({ user_id: uid, role: "admin" });
      expect(escalateErr).toBeTruthy();

      // 2) Cannot join admin_team
      const { error: adminTeamErr } = await client
        .from("admin_team" as any)
        .insert({ user_id: uid, admin_role: "owner" } as any);
      expect(adminTeamErr).toBeTruthy();

      // 3) verify_admin_access must still be false
      const { data: isAdmin } = await (client.rpc as any)("verify_admin_access");
      expect(isAdmin).not.toBe(true);

      // 4) Cannot read other users' preferences
      const { data: prefs } = await client
        .from("user_preferences")
        .select("user_id")
        .neq("user_id", uid)
        .limit(5);
      expect(prefs?.length ?? 0).toBe(0);

      // 5) Cannot read other users' push subscriptions
      const { data: subs } = await client
        .from("push_subscriptions" as any)
        .select("user_id")
        .neq("user_id", uid)
        .limit(5);
      expect(subs?.length ?? 0).toBe(0);

      // 6) Cannot read raw request_logs (admin-only)
      const { data: logs, error: logsErr } = await client
        .from("request_logs" as any)
        .select("*")
        .limit(1);
      if (!logsErr) {
        expect(logs?.length ?? 0).toBe(0);
      }
    } finally {
      await client.auth.signOut().catch(() => {});
    }
  }, 45_000);
});
