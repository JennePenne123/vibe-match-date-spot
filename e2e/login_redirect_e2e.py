"""End-to-end tests for the post-login redirect logic.

Runs the real app in a headless browser against the local dev server
(http://localhost:8080) with all Supabase network calls stubbed, so every
login scenario can be verified deterministically:

  1. pending group invite  -> /join-group?token=...
  2. admin / venue partner -> /partner
  3. onboarding incomplete -> /welcome
  4. regular user          -> /home (or /mood without a mood check-in today)

Run with:  python3 e2e/login_redirect_e2e.py
"""

import asyncio
import json
import os
import sys
import time

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")
SUPABASE_REF = "dfjwubatslzblagthbdw"
STORAGE_KEY = f"sb-{SUPABASE_REF}-auth-token"
USER_ID = "11111111-1111-1111-1111-111111111111"
EMAIL = "e2e-user@example.test"

COMPLETE_PREFS = {
    "user_id": USER_ID,
    "preferred_cuisines": ["italian"],
    "preferred_vibes": ["cozy"],
    "home_address": "Hamburg",
}
EMPTY_PREFS = {"user_id": USER_ID, "preferred_cuisines": [], "preferred_vibes": []}


def fake_session() -> dict:
    user = {
        "id": USER_ID,
        "aud": "authenticated",
        "role": "authenticated",
        "email": EMAIL,
        "user_metadata": {"name": "E2E User"},
        "app_metadata": {"provider": "email"},
        "created_at": "2026-01-01T00:00:00Z",
    }
    return {
        "access_token": "e2e-access-token",
        "refresh_token": "e2e-refresh-token",
        "token_type": "bearer",
        "expires_in": 3600,
        "expires_at": int(time.time()) + 3600,
        "user": user,
    }


async def install_supabase_stubs(context, roles, preferences):
    session = fake_session()

    async def json_route(route, payload, status=200):
        await route.fulfill(
            status=status,
            content_type="application/json",
            headers={"access-control-allow-origin": "*"},
            body=json.dumps(payload),
        )

    async def handler(route):
        request = route.request
        url = request.url
        if request.method == "OPTIONS":
            await route.fulfill(
                status=204,
                headers={
                    "access-control-allow-origin": "*",
                    "access-control-allow-headers": "*",
                    "access-control-allow-methods": "*",
                },
            )
            return
        if "/auth/v1/user" in url:
            await json_route(route, session["user"])
            return
        if "/auth/v1/token" in url:
            await json_route(route, session)
            return
        if "/auth/v1/logout" in url:
            await json_route(route, {})
            return
        if "/rest/v1/user_roles" in url:
            await json_route(route, roles)
            return
        if "/rest/v1/user_preferences" in url:
            await json_route(route, [preferences] if preferences else [])
            return
        if "/functions/v1/" in url:
            await json_route(route, {})
            return
        await json_route(route, [])

    await context.route(f"https://{SUPABASE_REF}.supabase.co/**", handler)


async def run_case(browser, name, *, roles, preferences, group_token, mood_today, expected):
    context = await browser.new_context(viewport={"width": 402, "height": 900})
    await install_supabase_stubs(context, roles, preferences)
    page = await context.new_page()

    # Establish the origin before seeding storage.
    await page.goto(BASE_URL, wait_until="domcontentloaded")

    seed = {
        "key": STORAGE_KEY,
        "session": json.dumps(fake_session()),
        "token": group_token,
        "mood": json.dumps(
            {"mood": "great", "date": time.strftime("%Y-%m-%d", time.gmtime())}
        )
        if mood_today
        else None,
    }
    await page.evaluate(
        """(s) => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem(s.key, s.session);
            if (s.token) localStorage.setItem('hioutz-pending-group-token', s.token);
            if (s.mood) localStorage.setItem('hioutz-daily-mood', s.mood);
        }""",
        seed,
    )

    await page.goto(f"{BASE_URL}/?auth=required", wait_until="domcontentloaded")

    ok = False
    actual = ""
    for _ in range(60):
        actual = (await page.evaluate("location.pathname + location.search")).strip()
        if actual.startswith(expected):
            ok = True
            break
        await page.wait_for_timeout(250)

    if not ok:
        await page.screenshot(path=f"/tmp/browser/e2e-fail-{name}.png")

    await context.close()
    print(f"{'PASS' if ok else 'FAIL'}  {name}: expected {expected}, got {actual}")
    return ok


async def main():
    os.makedirs("/tmp/browser", exist_ok=True)
    cases = [
        dict(
            name="group-invite-wins",
            roles=[{"role": "admin"}],
            preferences=None,
            group_token="abc123def456",
            mood_today=True,
            expected="/join-group?token=abc123def456",
        ),
        dict(
            name="admin-to-partner",
            roles=[{"role": "admin"}],
            preferences=COMPLETE_PREFS,
            group_token=None,
            mood_today=True,
            expected="/partner",
        ),
        dict(
            name="venue-partner-to-partner",
            roles=[{"role": "venue_partner"}],
            preferences=COMPLETE_PREFS,
            group_token=None,
            mood_today=True,
            expected="/partner",
        ),
        dict(
            name="incomplete-onboarding-to-welcome",
            roles=[],
            preferences=EMPTY_PREFS,
            group_token=None,
            mood_today=True,
            expected="/welcome",
        ),
        dict(
            name="regular-user-to-home",
            roles=[],
            preferences=COMPLETE_PREFS,
            group_token=None,
            mood_today=True,
            expected="/home",
        ),
        dict(
            name="regular-user-without-mood-to-mood",
            roles=[],
            preferences=COMPLETE_PREFS,
            group_token=None,
            mood_today=False,
            expected="/mood",
        ),
    ]

    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for case in cases:
            results.append(await run_case(browser, **case))
        await browser.close()

    passed = sum(1 for r in results if r)
    print(f"\n{passed}/{len(results)} login redirect scenarios passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
