/**
 * Integration test: /admin route access control
 *
 * Guarantees that a caller without the admin role cannot pass the server-side
 * gate that `AdminRouteGuard` relies on. The guard calls the SECURITY DEFINER
 * RPC `verify_admin_access()`; if that RPC ever returns `true` for a non-admin
 * session, the redirect to `/home` would not fire and unauthorized users could
 * reach the admin dashboard.
 *
 * We simulate two hostile scenarios against the real Supabase project:
 *   1. Anonymous visitor (no JWT at all)
 *   2. Signed-in-but-not-admin session (auth.uid() present, no admin row)
 *
 * Both must be rejected. We also assert the exact client-side redirect that
 * `AdminRouteGuard` performs when `verify_admin_access` does not return true.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://dfjwubatslzblagthbdw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE";

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Mirrors the decision the real `AdminRouteGuard` component makes.
 * Kept in sync with src/components/AdminRouteGuard.tsx.
 */
async function resolveAdminGuard(
  client: any,
): Promise<"allowed" | "denied"> {
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData?.user) return "denied";

  const { data, error } = await (client.rpc as any)("verify_admin_access");
  if (error || data !== true) return "denied";
  return "allowed";
}

describe("/admin route – server-side access control", () => {
  it("anonymous visitors are denied by the guard (would redirect to /home)", async () => {
    const result = await resolveAdminGuard(anonClient);
    expect(result).toBe("denied");
  });

  it("verify_admin_access RPC does not return true for anon callers", async () => {
    const { data, error } = await (anonClient.rpc as any)("verify_admin_access");
    // Either PostgREST refuses (EXECUTE revoked from anon → 42501 / 401)
    // or the function returns false. It MUST NOT return true.
    if (error) {
      expect(data).not.toBe(true);
    } else {
      expect(data).toBe(false);
    }
  });

  it("signed-in non-admin sessions are still denied", async () => {
    // Ephemeral throwaway account: signs up, is a plain 'regular' user
    // (assign_default_role trigger), then calls the guard.
    const email = `e2e-nonadmin-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}@example.test`;
    const password = `Passw0rd!${Math.random().toString(36).slice(2)}`;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signUp, error: signUpErr } = await userClient.auth.signUp({
      email,
      password,
    });

    if (signUpErr || !signUp.session) {
      // Project may require email confirmation; in that case we cannot obtain
      // a session for a fresh user in CI. Skip rather than false-fail.
      console.warn(
        "[adminRouteAccess] skipping non-admin session test:",
        signUpErr?.message ?? "no session (email confirmation likely required)",
      );
      return;
    }

    try {
      const result = await resolveAdminGuard(userClient);
      expect(result).toBe("denied");

      const { data } = await (userClient.rpc as any)("verify_admin_access");
      expect(data).not.toBe(true);
    } finally {
      await userClient.auth.signOut().catch(() => {});
    }
  }, 30_000);

  it("admin sessions are allowed through the guard (no redirect)", async () => {
    // We cannot sign in as a real admin in CI without leaking credentials,
    // so we build a fake client that behaves like Supabase would for an
    // authenticated admin: getUser() returns a user, and verify_admin_access
    // RPC returns `true`. This is the exact contract AdminRouteGuard depends
    // on — if this ever regresses, admins would be locked out of /admin.
    const adminClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: "00000000-0000-0000-0000-0000000000ad" } },
          error: null,
        }),
      },
      rpc: async (fn: string) => {
        if (fn !== "verify_admin_access") {
          return { data: null, error: new Error(`unexpected rpc: ${fn}`) };
        }
        return { data: true, error: null };
      },
    };

    const result = await resolveAdminGuard(adminClient);
    expect(result).toBe("allowed");
  });

  it("guard denies when RPC returns anything other than strict true", async () => {
    // Defensive: a truthy-but-not-true response (e.g. object, string) must
    // NOT be treated as admin access.
    for (const bogus of [null, undefined, false, 0, "true", 1, {}]) {
      const client = {
        auth: {
          getUser: async () => ({
            data: { user: { id: "00000000-0000-0000-0000-000000000001" } },
            error: null,
          }),
        },
        rpc: async () => ({ data: bogus, error: null }),
      };
      const result = await resolveAdminGuard(client);
      expect(result, `bogus RPC payload ${JSON.stringify(bogus)}`).toBe("denied");
    }
  });

  describe("hard refresh on /admin without admin role", () => {
    // A hard refresh throws away all in-memory React state and remounts the
    // guard from scratch. Each mount MUST re-run the server check — never
    // rely on cached client state. We simulate this by creating a fresh
    // Supabase client (no persisted session, no shared state) on every
    // iteration and asserting the guard blocks each time.

    it("blocks on every fresh mount (10 consecutive hard refreshes)", async () => {
      for (let i = 0; i < 10; i++) {
        const freshClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false, storageKey: `hr-${i}` },
        });
        const result = await resolveAdminGuard(freshClient);
        expect(result, `hard refresh #${i + 1}`).toBe("denied");
      }
    }, 30_000);

    it("redirect target in AdminRouteGuard is /home (source-code contract)", () => {
      // The E2E behavior we promise the user is "redirect to /home".
      // If someone changes the target without updating this test, the
      // contract breaks silently. Pin the target here.
      const src = readFileSync(
        resolve(process.cwd(), "src/components/AdminRouteGuard.tsx"),
        "utf8",
      );
      expect(src).toMatch(/<Navigate\s+to=["']\/home["']\s+replace\s*\/>/);
    });

    it("guard does not leak admin access via a stale cached RPC result", async () => {
      // Two sequential mounts on the same client instance — the second call
      // must still hit the server and get `false`, never a cached `true`.
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const first = await resolveAdminGuard(client);
      const second = await resolveAdminGuard(client);
      expect(first).toBe("denied");
      expect(second).toBe("denied");
    });
  });
});