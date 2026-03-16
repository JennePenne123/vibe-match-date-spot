import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-venue-partner`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ invitationId: "test" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Missing authorization header");
});

Deno.test("rejects invalid token", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-venue-partner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer invalid-token`,
    },
    body: JSON.stringify({ invitationId: "test-123" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
});
