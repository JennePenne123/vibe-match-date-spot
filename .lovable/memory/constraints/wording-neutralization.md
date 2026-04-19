---
name: Wording Neutralization
description: Solo-First wording strategy — neutralize "Date" in generic UI, keep only in explicit pair-dating flows
type: constraint
---
H!Outz positioniert sich als KI-Concierge für Erlebnisse (Solo, Duo, Gruppe). Daher gilt:

**Neutralisiert in i18n (DE/EN/ES):**
- Home, Landing-Hero, Onboarding-Screens, Profile-Activity, Chats-Empty, Wizard-Steps
- "Plan Date" → "Plan etwas" / "Plan something" / "Planea algo"
- "Date Spots" → "Spots" / "Lugares"
- "Date Planner" → "AI Planner"
- "Upcoming Dates" → "Anstehende Pläne" / "Upcoming Plans" / "Planes Próximos"

**Bleibt "Date" (echte Paar-Dating-Flows):**
- `dateInvite.*`, `dateProposal.*`, `dateCancel.*` — explizite Einladungen
- `datePlanning.mode_single_*` — "Date für zwei" Mode
- `feedback.*` mit Partner-Bezug — Paar-Bewertungen
- `ratings.dateWith` — Bewertung eines spezifischen Dates

**Why:** Solo-User darf sich nirgendwo „falsch" fühlen in der App. „Date" nur dort wo zwei Personen explizit involviert sind.
