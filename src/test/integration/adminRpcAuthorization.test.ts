/**
 * Integration tests: Admin RPC Authorization
 *
 * Ensures that privileged Supabase RPC functions reject unauthorized callers
 * even when client-side guards (AdminRouteGuard, UI checks) are bypassed.
 *
 * Strategy:
 *  - Use the public anon key (same key the browser uses) → auth.uid() is null.
 *  - Every admin-only RPC MUST error out server-side.
 *  - We also assert on the error message to make sure the rejection comes from
 *    our authorization check (not from a schema mismatch or network issue).
 *
 * If any of these tests fail, an attacker who bypasses client guards could call
 * the RPC directly. Treat failures as critical security regressions.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://dfjwubatslzblagthbdw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE";

const ONLINE = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// Anonymous client — simulates an attacker calling RPCs directly without admin role.
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ARBITRARY_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * We accept either:
 *  - A thrown/returned Postgres error (RAISE EXCEPTION inside the function)
 *  - A Supabase auth error (401) because the JWT lacks the required claims
 *  - PostgREST permission-denied (42501) when EXECUTE has been revoked
 */
function expectUnauthorized(error: unknown, ctx: string) {
  expect(error, `${ctx} → expected an authorization error, got none`).toBeTruthy();
  const anyErr = error as { message?: string; code?: string };
  const msg = (anyErr?.message ?? "").toLowerCase();
  const code = anyErr?.code ?? "";
  const looksLikeAuthzError =
    msg.includes("unauthorized") ||
    msg.includes("authentication required") ||
    msg.includes("admin") ||
    msg.includes("permission denied") ||
    msg.includes("access denied") ||
    msg.includes("only") ||
    msg.includes("cannot") ||
    code === "42501" ||
    code === "PGRST301";
  expect(
    looksLikeAuthzError,
    `${ctx} → error was not an authorization error: code=${code} msg=${anyErr?.message}`,
  ).toBe(true);
}

describe.skipIf(!ONLINE)("Admin RPC authorization (anonymous caller)", () => {
  beforeAll(() => {
    // Guarantee no session leaks in from other tests.
    anonClient.auth.signOut().catch(() => {});
  });

  it("get_retention_metrics rejects non-admins", async () => {
    const { error } = await anonClient.rpc("get_retention_metrics", { days_back: 30 });
    expectUnauthorized(error, "get_retention_metrics");
  });

  it("get_cron_jobs_status rejects non-admins", async () => {
    const { error } = await anonClient.rpc("get_cron_jobs_status");
    expectUnauthorized(error, "get_cron_jobs_status");
  });

  it("create_test_venues rejects non-admins", async () => {
    const { error } = await anonClient.rpc("create_test_venues", { venues_data: [] });
    expectUnauthorized(error, "create_test_venues");
  });

  it("get_city_venue_rankings rejects non-partners/non-admins", async () => {
    const { error } = await anonClient.rpc("get_city_venue_rankings", { _city: "Hamburg" });
    expectUnauthorized(error, "get_city_venue_rankings");
  });
});

describe.skipIf(!ONLINE)("User RPC authorization (cross-user access)", () => {
  it("award_user_points rejects unauthenticated callers", async () => {
    const { error } = await anonClient.rpc("award_user_points", {
      target_user_id: ARBITRARY_UUID,
      points_to_add: 100,
    });
    expectUnauthorized(error, "award_user_points");
  });

  it("update_user_streak rejects unauthenticated callers", async () => {
    const { error } = await anonClient.rpc("update_user_streak", {
      target_user_id: ARBITRARY_UUID,
      new_streak: 999,
    });
    expectUnauthorized(error, "update_user_streak");
  });

  it("count_perfect_pairs rejects unauthenticated callers", async () => {
    const { error } = await anonClient.rpc("count_perfect_pairs", {
      target_user_id: ARBITRARY_UUID,
    });
    expectUnauthorized(error, "count_perfect_pairs");
  });

  it("delete_user_data rejects unauthenticated callers", async () => {
    const { error } = await anonClient.rpc("delete_user_data", {
      target_user_id: ARBITRARY_UUID,
    });
    expectUnauthorized(error, "delete_user_data");
  });

  it("reset_user_preferences_to_default rejects unauthenticated callers", async () => {
    const { error } = await anonClient.rpc("reset_user_preferences_to_default", {
      target_user_id: ARBITRARY_UUID,
    });
    expectUnauthorized(error, "reset_user_preferences_to_default");
  });

  it("setup_test_user_preferences rejects unauthenticated callers", async () => {
    const { error } = await anonClient.rpc("setup_test_user_preferences", {
      target_user_id: ARBITRARY_UUID,
    });
    expectUnauthorized(error, "setup_test_user_preferences");
  });
});

describe.skipIf(!ONLINE)("Privileged table access as anonymous", () => {
  it("admin_team is not readable by anon", async () => {
    const { data, error } = await anonClient.from("admin_team").select("*").limit(1);
    // Either an explicit error or an empty result (RLS filters out all rows).
    if (error) {
      expectUnauthorized(error, "admin_team select");
    } else {
      expect(data ?? []).toEqual([]);
    }
  });

  it("user_roles cannot be inserted by anon", async () => {
    const { error } = await anonClient
      .from("user_roles")
      .insert({ user_id: ARBITRARY_UUID, role: "admin" });
    expectUnauthorized(error, "user_roles insert admin");
  });
});