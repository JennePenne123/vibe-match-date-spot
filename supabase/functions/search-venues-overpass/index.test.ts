import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("search-venues-overpass returns venues for Hamburg", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/search-venues-overpass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      latitude: 53.5511,
      longitude: 9.9937,
      cuisines: ["Italian"],
      radius: 3000,
      limit: 10,
      venueTypes: [],
      activities: [],
    }),
  });

  const body = await response.json();
  console.log("Response status:", response.status);
  console.log("Venues found:", body.count);
  console.log("First 3 venues:", body.venues?.slice(0, 3)?.map((v: any) => `${v.name} (${v.cuisine_type})`));

  assertEquals(response.status, 200);
  assertEquals(Array.isArray(body.venues), true);
  // Overpass should find venues in Hamburg
  console.log("✅ Test passed! Found", body.count, "venues");
});

Deno.test("search-venues-overpass handles activity types", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/search-venues-overpass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      latitude: 53.5511,
      longitude: 9.9937,
      cuisines: [],
      radius: 5000,
      limit: 10,
      venueTypes: ["cinema", "museum"],
      activities: ["cultural_act"],
    }),
  });

  const body = await response.json();
  console.log("Activity venues found:", body.count);
  console.log("Venues:", body.venues?.slice(0, 3)?.map((v: any) => `${v.name} (${v.cuisine_type})`));

  assertEquals(response.status, 200);
  assertEquals(Array.isArray(body.venues), true);
  console.log("✅ Activity test passed!");
});
