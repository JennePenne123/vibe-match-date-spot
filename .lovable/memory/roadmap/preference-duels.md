---
name: Preference Duels (Swipe-Fragen)
description: Alle 2 Wochen 5-10 Paarvergleichs-Fragen ("Pasta oder Pizza") als starkes Präferenzsignal in user_preference_vectors. Post-Launch, hinter Feature-Flag `preference_duels`.
type: feature
---

**Idee:** Alle ~2 Wochen erhält der Nutzer eine geschlossene Swipe-Frage (Paarvergleich A vs. B) zu Vorlieben – z.B. "Pasta oder Pizza", "Cocktailbar oder Weinbar", "Live-Musik oder Ruhe".

**Warum es funktioniert:**
- Sehr niedrige Reibung (5s, ein Tap) → hohe Completion-Rate
- Paarvergleiche liefern **relative** Präferenzen (stärkeres Signal als absolute Ratings)
- Speist `user_preference_vectors` mit explizitem, hochwertigem Signal

**Umsetzung (Post-Launch):**
1. Neue Tabelle `preference_duels` (id, category, option_a, option_b, weight)
2. Tabelle `user_duel_responses` (user_id, duel_id, choice, answered_at)
3. Trigger: 5–10 Fragen alle 14 Tage per Push/In-App-Card
4. UI: Swipe-Card auf Home (links/rechts oder Tap)
5. Ergebnisse fließen mit höherem Gewicht als implizite Klicks in `user_preference_vectors`
6. Feature-Flag `preference_duels` – Default off, aktivieren wenn Nutzerbasis >X

**Timing:** Retention-Feature, erst nach Launch bauen, wenn genug Nutzer für sinnvolle Frequenz vorhanden.