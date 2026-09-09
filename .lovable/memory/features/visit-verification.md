---
name: Visit Verification (Geo Check-in)
description: Standortbasierte Besuchsbestätigung vor Bewertungen; Tabelle venue_visits, 150m/250m Radien, Rating-Prompt am Abend
type: feature
---

Bewertungen sollen nur zählen, wenn der Nutzer wirklich vor Ort war.

- Tabelle `venue_visits` (user_id, invitation_id, venue_id + Koordinaten, arrived_at, left_at, verified, verification_method 'manual'|'auto', closest_distance_m, rating_prompt_at, rating_prompted). RLS: nur eigener Nutzer.
- `date_feedback.visit_verified` + `visit_verification_method` markieren unbestätigte Bewertungen.
- Radien: Ankunft ≤ 150 m, Verlassen > 250 m (Hysterese), Mindestaufenthalt 15 Min, 2 aufeinanderfolgende „away"-Messungen.
- Erkennung kombiniert: automatisch per Polling (90 s, nur wenn App im Vordergrund und Geo-Permission `granted`) + manueller „Ich bin da"-Button (`VisitCheckInCard` auf Home).
- Rating-Prompt-Zeit (`computeRatingPromptAt`): vor 20 Uhr → 20:30 desselben Tages; 20–23 Uhr → +45 Min; nach 23 Uhr → 09:00 nächster Tag.
- Ohne Nachweis darf trotzdem bewertet werden, aber sichtbar als „Unbestätigt"; Flag geht als `visit_verified` in `contextData` ans AI-Learning.
- Code: `src/services/visitVerificationService.ts`, `src/hooks/useVisitVerification.ts`, `src/components/home/VisitCheckInCard.tsx`, `PendingRatingsCard`, `DateRatingModal`, `useDateRating`.
