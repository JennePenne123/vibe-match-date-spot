---
name: Wording Neutralization
description: Solo-First wording strategy — neutralize "Date" in generic UI, keep only in explicit pair-dating flows
type: constraint
---
H!Outz positioniert sich als KI-Concierge für Erlebnisse (Solo, Duo, Gruppe). Daher gilt:

**Neutralisiert in i18n (DE/EN/ES):**
- Home, Landing-Hero, Onboarding-Screens, Profile-Activity, Chats-Empty, Wizard-Steps, Tutorial, Notifications, GroupDates, Friends-Sharing
- "Plan Date" → "Plan etwas" / "Plan something" / "Planea algo"
- "Date Spots" → "Spots" / "Lugares"
- "Date Planner" → "AI Concierge"
- "Upcoming Dates" → "Anstehende Pläne" / "Upcoming Plans" / "Planes Próximos"
- "Date Invitation" toasts → "Einladung" / "Invitation" / "Invitación"

**Neue i18n-Sektionen (Step 1a):**
- `notifications.*` — Toast-Texte für Einladungs-Events
- `groupDates.*` — Empty-State und CTA für Gruppen
- `friendsShare.*` — Referral-Link Sharing-Texte
- `tutorial.*` — Solo-First neu formuliert
- `preferences.stepContext` / `stepContextDesc` — ersetzt hardcoded "Date-Kontext"

**Bleibt "Date" (echte Paar-Dating-Flows):**
- `dateInvite.*`, `dateProposal.*`, `dateCancel.*` — explizite Einladungen
- `datePlanning.mode_single_*` — "Date für zwei" Mode
- `feedback.*` mit Partner-Bezug — Paar-Bewertungen
- `ratings.dateWith` — Bewertung eines spezifischen Dates
- `chat.newDate` — manuell gewählter Chat-Titel
- DB-Felder, Variablennamen (`proposed_date`, `dateType`)
- `Datenschutz.tsx` — juristisch präzise Begriffe ("Date-Bewertungen")

**Why:** Solo-User darf sich nirgendwo „falsch" fühlen in der App. „Date" nur dort wo zwei Personen explizit involviert sind.
