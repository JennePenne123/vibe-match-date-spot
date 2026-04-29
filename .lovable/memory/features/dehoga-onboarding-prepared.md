---
name: DEHOGA Onboarding (versteckt vorbereitet)
description: Komplettes DEHOGA-Mitglieder-Onboarding ist gebaut, aber per Feature-Flag versteckt bis Partnerschaft offiziell ist
type: feature
---
Status: VORBEREITET, AUSGEBLENDET. Aktivierung später per SQL ohne Deployment.

**Aktivieren wenn DEHOGA-Partnerschaft offiziell ist:**
```sql
UPDATE public.feature_flags SET enabled = true WHERE flag_key = 'dehoga_onboarding_enabled';
```

**Komponenten:**
- Route: `/partner/dehoga` → `src/pages/partner/DehogaOnboarding.tsx` (4-Step Wizard)
- Edge Function: `validate-dehoga-membership` (validiert Code/Member-ID, setzt Verifikation via Service-Role)
- Hook: `useFeatureFlag(flagKey)` — unterstützt `?preview=<token>` Bypass für interne Tests
- Trust-Badge: `src/components/partner/DehogaBadge.tsx` (rendert nur wenn Flag + Member)
- DB: `feature_flags`, `dehoga_invitation_codes`, neue Spalten in `partner_profiles` (is_dehoga_member, dehoga_member_id, dehoga_landesverband, dehoga_verified_at, dehoga_verification_method)
- Schutz-Trigger `protect_partner_profile_fields()` blockiert Self-Setting der DEHOGA-Felder — nur Service-Role/Admin

**DEHOGA-Pricing (in feature_flags.metadata gespeichert):** Pro €9,99 (statt €13,90), Business €21,90 (statt €29,90), Premium €42,90 (statt €59,90) — ~28% Rabatt.

**Preview-Token:** `hioutz-dehoga-2026` → `/partner/dehoga?preview=hioutz-dehoga-2026` für interne Tests.

**Verifikations-Methoden:** `member_id` (Format-Check, echte DEHOGA-API-Anbindung TODO nach Partnerschaft) ODER `invitation_code` (Whitelist in `dehoga_invitation_codes`).

**TODO bei Live-Schaltung:**
1. Feature-Flag in DB auf `enabled=true` setzen
2. DEHOGA-API-Endpoint für echte Member-ID-Validierung in Edge Function einbauen (aktuell nur Format-Check)
3. `DehogaBadge` in Partner-Profil-Karten (Venues, Reviews) einbinden
4. Optionaler Hinweis-Banner im normalen `/partner/onboarding` zur Weiterleitung
5. Stripe-Pricing-Tiers entsprechend anpassen