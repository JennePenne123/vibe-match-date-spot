## MVP Pre-Launch Checklist

### Phase 1: Branding & Assets
- [ ] Final App Icons (iOS/Android adaptive icons)
- [ ] Favicons für Web
- [ ] App Store Screenshots
- [ ] Landing Page Hero Assets

### Phase 2: Rechtstexte & Compliance
- [ ] AGB: Platzhalter ersetzen (Firma, Adresse, Geschäftsführer)
- [ ] Datenschutz: Platzhalter ersetzen + DSFA prüfen
- [ ] Impressum: Vollständige Angaben
- [ ] AI-Profiling Hinweis (Verarbeitung durch KI-Systeme)

### Phase 3: OAuth & Authentifizierung
- [ ] Google OAuth in Produktion aktivieren
- [ ] Apple OAuth in Produktion aktivieren
- [ ] Supabase Site-URLs auf Produktionsdomain umstellen

### Phase 4: Native Mobile App (Capacitor)
- [ ] iOS: `npx cap add ios` + Xcode Permissions prüfen
- [ ] Android: `npx cap add android` + AndroidManifest Permissions prüfen
- [ ] Camera/QR-Scan: NSCameraUsageDescription in Info.plist
- [ ] Geolocation: NSLocationWhenInUseUsageDescription + Android Location Permissions
- [ ] Push Notifications: Firebase + APNS Certificates einrichten
- [ ] Native Build Tests vor App Store Submission

### Phase 5: Infrastruktur
- [ ] E-Mail-Domain in Cloud → Emails einrichten
- [ ] Auth-E-Mails (Verification, Password Reset) testen
- [ ] Edge Functions Deployment auf Production prüfen
- [ ] Rate Limiting + API Usage Monitoring aktiv

### Phase 6: Partner Onboarding
- [x] Automatische Verifizierung (VIES API) aktiv
- [x] Manuelle Admin-Verifizierung-UI für Ausnahmen
- [x] KI-Tag-Vorschläge aus Venue-Websites (Edge Function `analyze-venue-website`)

---

## Heute erledigt (12.04.2026)

### KI-gestützte Venue-Tag-Vorschläge ✅
- Edge Function `analyze-venue-website` erstellt: Analysiert Venue-Websites + ähnliche erfolgreiche Venues
- Generiert optimale Tags mit Confidence-Score, Quelle (Website/KI/ähnliche Venues) und Begründung
- Behebt Fehlkategorisierungen (z.B. Schweinske: "Burger" → "Schnitzel, Hausmannskost")
- AITagSuggestions-Komponente erweitert: Toggle zwischen "Website + KI" und "Gäste-Feedback"

### Date-Planning: Mode-Auswahl ✅
- Neuer erster Schritt "Wie möchtest du daten?" mit drei Modi:
  - **Solo-Date**: Alleine Venues entdecken (überspringt Partner-Auswahl)
  - **Zu zweit**: Klassisches Date mit Partner-Einladung
  - **Gruppen-Date**: Mehrteilnehmer-Planung
- Übersetzungen in DE/EN/ES hinzugefügt

### Sicherheits-Fixes ✅
- **Partner-Profil-Schutz**: Trigger `protect_partner_profile_fields` aktiviert – verhindert Selbst-Verifizierung, Membership-Manipulation und Gründerstatus-Änderung durch Nicht-Admins
- **Rollen-Escalation-Schutz**: Trigger `validate_role_insert` – nur `regular`-Rolle ohne Admin-Rechte vergabbar, verhindert Privilege Escalation über SECURITY DEFINER-Pfade
- **Realtime Voucher-Broadcast entfernt**: `vouchers` und `voucher_redemptions` aus Realtime-Publication entfernt, Hook auf sicheres Polling (15s) umgestellt

### Test-Setup ✅
- Freundschaft zwischen Lenny und Jan Wiechmann für gegenseitiges Testen eingerichtet

---

## Automatische Partner-Verifizierung

### Flow:
```
Partner gibt USt-IdNr. ein → Status: pending_review
  → auto-verify-partner Edge Function wird aufgerufen
    → VIES API prüft USt-IdNr.
      ✅ Gültig → Status: verified + E-Mail + Push
      ❌ Ungültig → Status: pending_review + Admin-Notiz
      ⚠️ Keine USt-IdNr. → Manuelle Admin-Prüfung
```

### E-Mail Benachrichtigungen
- ⚠️ **Aktuell ist keine E-Mail-Domain konfiguriert**
- Muss zuerst über Cloud → Emails eingerichtet werden
- Danach: Transaktionale E-Mails bei Status-Änderung

---

## Post-Launch Roadmap

### Monetarisierung & Payments
- [ ] Stripe-Integration für Premium-Modelle
- [ ] Premium-Vouchers für Top-3-Matches (abhängig von Stripe)
- [ ] Bei eigener Zahlungsabwicklung (nicht App Store): Muster-Widerrufsformular in AGB ergänzen (§ 355 BGB)

### Features
- [ ] Favoriten-System: DB-Migration für Persistenz und KI-Signale
- [ ] Transportdienst-Integration (FREE NOW, MOIA)
- [ ] Nutzergenerierte Venue-Reviews
- [ ] KI: Automatisierter Support-Agent
- [ ] KI: Date Recaps

### POS-/Kassensystem-Integration
- [ ] Partner-Umfrage: Welches Kassensystem nutzen eure Venues? (orderbird, Lightspeed, SumUp, ready2order, gastrofix)
- [ ] Phase 1: Voucher-Einlösung im meistgenutzten POS-System (API-Integration)
- [ ] Phase 2: Besuchstracking & automatische Feedback-Auslösung über POS
- [ ] Phase 3: Umsatz-Analytics als Premium-Partner-Feature

### Marketing
- [ ] Effizienter, kostengünstiger Marketingplan entwickeln
