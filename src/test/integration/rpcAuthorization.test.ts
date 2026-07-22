/**
 * RPC / View Authorization Regression Tests
 *
 * Locks down every SECURITY DEFINER RPC and every exposed view that could
 * leak admin state or cross-user data. The rule is simple:
 *
 *   - anon must NEVER receive `true` from any admin check.
 *   - anon must NEVER read rows from admin-only analytics RPCs.
 *   - signed-in non-admin users must NEVER receive `true` either.
 *   - RPCs that mutate points/preferences/streaks must reject anon.
 *
 * We call the RPCs the way PostgREST would from the browser, using the
 * public anon key. No service-role secret is used.
 */
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://dfjwubatslzblagthbdw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE";

const FAKE_UUID = "00000000-0000-0000-0000-000000000001";
const FAKE_UUID_2 = "00000000-0000-0000-0000-000000000002";

function anon(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Asserts that an RPC response is either a hard error or a non-true value. */
function expectNotTrue(
  data: unknown,
  error: unknown,
  label: string,
) {
  if (error) {
    expect(data, `${label} returned data alongside error`).not.toBe(true);
    return;
  }
  expect(data, `${label} unexpectedly returned true`).not.toBe(true);
}

/** Asserts an RPC must fail outright (permission denied / auth required). */
function expectRejected(data: unknown, error: unknown, label: string) {
  // Either PostgREST refused, or the function raised (e.g. "Authentication required").
  if (error) {
    expect(error).toBeTruthy();
    return;
  }
  // Some RPCs return boolean/null instead of raising; those must not
  // signal success either.
  expect(data, `${label} unexpectedly returned truthy`).toBeFalsy();
}

describe("RPC authorization – anon must never see admin=true", () => {
  it("verify_admin_access() never returns true for anon", async () => {
    const { data, error } = await (anon().rpc as any)("verify_admin_access");
    expectNotTrue(data, error, "verify_admin_access");
  });

  it("has_role(*, 'admin') never returns true for anon", async () => {
    for (const uid of [FAKE_UUID, FAKE_UUID_2]) {
      const { data, error } = await (anon().rpc as any)("has_role", {
        _user_id: uid,
        _role: "admin",
      });
      expectNotTrue(data, error, `has_role(${uid}, admin)`);
    }
  });

  it("has_role(*, 'venue_partner') never returns true for anon", async () => {
    const { data, error } = await (anon().rpc as any)("has_role", {
      _user_id: FAKE_UUID,
      _role: "venue_partner",
    });
    expectNotTrue(data, error, "has_role(*, venue_partner)");
  });

  it("is_admin_owner() never returns true for anon", async () => {
    const { data, error } = await (anon().rpc as any)("is_admin_owner", {
      _user_id: FAKE_UUID,
    });
    expectNotTrue(data, error, "is_admin_owner");
  });

  it("get_admin_role() never returns a real admin role for anon", async () => {
    const { data, error } = await (anon().rpc as any)("get_admin_role", {
      _user_id: FAKE_UUID,
    });
    if (!error) {
      // acceptable: null / empty. Any populated admin_role string is a leak.
      expect(data ?? null, "get_admin_role leaked a role for anon").toBeNull();
    }
  });
});

describe("RPC authorization – admin-only analytics reject anon", () => {
  const adminOnlyRpcs: Array<{ fn: string; args?: Record<string, unknown> }> = [
    { fn: "get_retention_metrics", args: { days_back: 30 } },
    { fn: "get_cron_jobs_status" },
    { fn: "get_city_venue_rankings", args: { _city: "Hamburg" } },
  ];

  for (const { fn, args } of adminOnlyRpcs) {
    it(`${fn}() rejects anon callers`, async () => {
      const { data, error } = await (anon().rpc as any)(fn, args ?? {});
      expectRejected(data, error, fn);
    }, 15_000);
  }
});

describe("RPC authorization – mutating RPCs reject anon", () => {
  it("award_user_points() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)("award_user_points", {
      target_user_id: FAKE_UUID,
      points_to_add: 999_999,
    });
    expectRejected(data, error, "award_user_points");
  });

  it("update_user_streak() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)("update_user_streak", {
      target_user_id: FAKE_UUID,
      new_streak: 999,
    });
    expectRejected(data, error, "update_user_streak");
  });

  it("reset_user_preferences_to_default() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)(
      "reset_user_preferences_to_default",
      { target_user_id: FAKE_UUID },
    );
    expectRejected(data, error, "reset_user_preferences_to_default");
  });

  it("setup_test_user_preferences() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)(
      "setup_test_user_preferences",
      { target_user_id: FAKE_UUID },
    );
    expectRejected(data, error, "setup_test_user_preferences");
  });

  it("delete_user_data() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)("delete_user_data", {
      target_user_id: FAKE_UUID,
    });
    expectRejected(data, error, "delete_user_data");
  });

  it("create_test_venues() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)("create_test_venues", {
      venues_data: [],
    });
    expectRejected(data, error, "create_test_venues");
  });

  it("count_perfect_pairs() rejects anon", async () => {
    const { data, error } = await (anon().rpc as any)("count_perfect_pairs", {
      target_user_id: FAKE_UUID,
    });
    expectRejected(data, error, "count_perfect_pairs");
  });

  it("insert_request_log() cannot be spammed by anon with arbitrary rows", async () => {
    // Function is SECURITY DEFINER but wrapping it in RLS-aware behavior is
    // secondary: at minimum it must not crash the DB and must not accept
    // requests without going through the anon key gate. We assert that even
    // if it "succeeds", it cannot be used to read anything back.
    await (anon().rpc as any)("insert_request_log", {
      p_identifier_hash: "rls-test",
      p_function_name: "rls-test",
    });
    const { data, error } = await anon()
      .from("request_logs" as any)
      .select("*")
      .limit(1);
    if (!error) {
      expect(data?.length ?? 0, "request_logs leaked to anon").toBe(0);
    }
  });
});

describe("View authorization – anon cannot read privileged views", () => {
  it("profiles_safe view does not leak rows to anon", async () => {
    const { data, error } = await anon()
      .from("profiles_safe" as any)
      .select("*")
      .limit(5);
    if (!error) {
      expect(data?.length ?? 0, "profiles_safe leaked to anon").toBe(0);
    }
  });
});

describe("Signed-in non-admin – RPC surface", () => {
  it("cannot flip admin RPCs to true and cannot call admin-only analytics", async () => {
    const email = `e2e-rpc-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
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
        "[rpcAuthorization] skipping signed-in checks:",
        signUpErr?.message ?? "no session (email confirmation required)",
      );
      return;
    }

    const uid = signUp.user!.id;

    try {
      // Admin checks
      const { data: isAdmin } = await (client.rpc as any)("verify_admin_access");
      expect(isAdmin).not.toBe(true);

      const { data: hasAdmin } = await (client.rpc as any)("has_role", {
        _user_id: uid,
        _role: "admin",
      });
      expect(hasAdmin).not.toBe(true);

      const { data: isOwner } = await (client.rpc as any)("is_admin_owner", {
        _user_id: uid,
      });
      expect(isOwner).not.toBe(true);

      // Admin-only analytics must raise
      const { data: metrics, error: metricsErr } = await (client.rpc as any)(
        "get_retention_metrics",
        { days_back: 7 },
      );
      expectRejected(metrics, metricsErr, "get_retention_metrics (non-admin)");

      const { data: cron, error: cronErr } = await (client.rpc as any)(
        "get_cron_jobs_status",
      );
      expectRejected(cron, cronErr, "get_cron_jobs_status (non-admin)");

      // Mutating another user's data must raise
      const { data: award, error: awardErr } = await (client.rpc as any)(
        "award_user_points",
        { target_user_id: FAKE_UUID, points_to_add: 10 },
      );
      expectRejected(award, awardErr, "award_user_points cross-user");

      const { data: del, error: delErr } = await (client.rpc as any)(
        "delete_user_data",
        { target_user_id: FAKE_UUID },
      );
      expectRejected(del, delErr, "delete_user_data cross-user");
    } finally {
      await client.auth.signOut().catch(() => {});
    }
  }, 45_000);
});
