"""End-to-end tests for the category-aware date-planning flow (solo + group).

Runs the real app in a headless browser against the local dev server
(http://localhost:8080) with all Supabase network calls stubbed, so the
adaptive wizard can be verified deterministically:

  1. food category         -> cuisine picker, dietary + budget sections visible
  2. outdoor category      -> no dietary, no budget section
  3. outdoor follow-up     -> terrain question appears after picking a place type
  4. category switch       -> answers of a category come back when switching back
  5. /plan-date solo       -> preferences step adapts to the active category
  6. /plan-date group      -> partner selection step is reachable

Run with:  python3 e2e/date_flow_e2e.py
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

PREFS = {
    "user_id": USER_ID,
    "preferred_cuisines": [],
    "preferred_vibes": [],
    "preferred_venue_types": [],
    "dietary_restrictions": [],
    "preferred_price_range": [],
    "home_address": "Hamburg",
    "home_latitude": 53.5503,
    "home_longitude": 9.9937,
    "lifestyle_data": {},
}

# Visible labels used as assertions (German UI).
L_FOOD_PICKER = "Worauf hast du Lust?"
L_OUTDOOR_PICKER = "Wohin ins Grüne?"
L_DIETARY = "Ernährungsanforderungen?"
L_BUDGET = "Was ist dein Budget?"
L_OUTDOOR_FOLLOWUP = "Wie soll's draußen sein?"
L_PARKS = "Parks"


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


async def install_supabase_stubs(context):
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
        if "/rest/v1/user_preferences" in url:
            if request.method in ("POST", "PATCH", "PUT"):
                await json_route(route, [PREFS])
            else:
                await json_route(route, [PREFS])
            return
        if "/functions/v1/" in url:
            await json_route(route, {})
            return
        await json_route(route, [])

    await context.route(f"https://{SUPABASE_REF}.supabase.co/**", handler)
    # Third-party lookups must never block a test run.
    await context.route("https://nominatim.openstreetmap.org/**", lambda r: r.fulfill(
        status=200, content_type="application/json", body="[]"))


async def new_page(browser, category=None):
    context = await browser.new_context(viewport={"width": 402, "height": 1400})
    await install_supabase_stubs(context)
    page = await context.new_page()
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    await page.evaluate(
        """(s) => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem(s.key, s.session);
            if (s.category) sessionStorage.setItem('hioutz-situational-category', s.category);
        }""",
        {"key": STORAGE_KEY, "session": json.dumps(fake_session()), "category": category},
    )
    return context, page


async def visible(page, label, timeout=6000) -> bool:
    try:
        await page.get_by_text(label, exact=False).first.wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False


async def absent(page, label, settle=1200) -> bool:
    await page.wait_for_timeout(settle)
    return await page.get_by_text(label, exact=False).count() == 0


async def next_step(page):
    await page.get_by_role("button", name="Weiter").first.click()
    await page.wait_for_timeout(600)


async def open_wizard(page, category):
    await page.goto(f"{BASE_URL}/preferences?category={category}", wait_until="domcontentloaded")
    await page.get_by_text("Prioritäten", exact=False).first.wait_for(state="visible", timeout=15000)


# --------------------------------------------------------------------------- cases


async def case_food_sections(browser):
    context, page = await new_page(browser)
    try:
        await open_wizard(page, "food")
        await next_step(page)
        checks = {
            "cuisine picker": await visible(page, L_FOOD_PICKER),
            "dietary section": await visible(page, L_DIETARY),
        }
        await next_step(page)
        checks["budget section"] = await visible(page, L_BUDGET)
        return checks
    finally:
        await context.close()


async def case_outdoor_sections(browser):
    context, page = await new_page(browser)
    try:
        await open_wizard(page, "outdoor")
        await next_step(page)
        checks = {
            "outdoor picker": await visible(page, L_OUTDOOR_PICKER),
            "no dietary section": await absent(page, L_DIETARY),
        }
        await next_step(page)
        checks["no budget section"] = await absent(page, L_BUDGET)
        return checks
    finally:
        await context.close()


async def case_outdoor_follow_up(browser):
    context, page = await new_page(browser)
    try:
        await open_wizard(page, "outdoor")
        await next_step(page)
        checks = {"follow-up hidden first": await absent(page, L_OUTDOOR_FOLLOWUP)}
        await page.get_by_text(L_PARKS, exact=True).first.click()
        checks["follow-up after pick"] = await visible(page, L_OUTDOOR_FOLLOWUP)
        return checks
    finally:
        await context.close()


async def case_category_switch_memory(browser):
    context, page = await new_page(browser)
    try:
        await open_wizard(page, "outdoor")
        await next_step(page)
        await page.get_by_text(L_PARKS, exact=True).first.click()
        await page.wait_for_timeout(600)

        # Switch to food: outdoor-only answers must not leak into the food wizard.
        await open_wizard(page, "food")
        await next_step(page)
        checks = {"outdoor answers dropped in food": await absent(page, L_OUTDOOR_FOLLOWUP)}

        # Switch back: the earlier outdoor answer is restored from memory.
        await open_wizard(page, "outdoor")
        await next_step(page)
        checks["outdoor answers restored"] = await visible(page, L_OUTDOOR_FOLLOWUP)
        return checks
    finally:
        await context.close()


async def case_plan_date_solo(browser):
    context, page = await new_page(browser, category="outdoor")
    try:
        await page.goto(f"{BASE_URL}/plan-date?mode=solo", wait_until="domcontentloaded")
        return {
            "solo preferences step": await visible(page, "Vibe", timeout=20000),
            "no cuisine section": await absent(page, "Küche"),
        }
    finally:
        await context.close()


async def case_plan_date_group(browser):
    context, page = await new_page(browser, category="outdoor")
    try:
        await page.goto(f"{BASE_URL}/plan-date?mode=group", wait_until="domcontentloaded")
        return {"group partner step": await visible(page, "Zurück", timeout=20000)}
    finally:
        await context.close()


CASES = [
    ("food category sections", case_food_sections),
    ("outdoor category sections", case_outdoor_sections),
    ("outdoor follow-up question", case_outdoor_follow_up),
    ("category switch memory", case_category_switch_memory),
    ("/plan-date solo flow", case_plan_date_solo),
    ("/plan-date group flow", case_plan_date_group),
]


async def main():
    os.makedirs("/tmp/browser", exist_ok=True)
    failed = 0
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, fn in CASES:
            try:
                checks = await fn(browser)
            except Exception as exc:  # noqa: BLE001 - report, never abort the suite
                print(f"FAIL  {name}: {type(exc).__name__}: {exc}")
                failed += 1
                continue
            bad = [k for k, ok in checks.items() if not ok]
            if bad:
                failed += 1
                print(f"FAIL  {name}: {', '.join(bad)}")
            else:
                print(f"PASS  {name}: {', '.join(checks)}")
        await browser.close()

    total = len(CASES)
    print(f"\n{total - failed}/{total} date flow scenarios passed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
