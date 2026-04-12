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
- [ ] Automatische Verifizierung (VIES API) aktiv
- [ ] Manuelle Admin-Verifizierung-UI für Ausnahmen

---

## Automatische Partner-Verifizierung (Post-Launch Optimierung)

### Schritt 1: Edge Function `auto-verify-partner`
- Nimmt `partner_profile_id` entgegen
- Prüft die USt-IdNr. über die **EU VIES API** (kostenlos, kein API-Key nötig)
- **Gültig** → Status automatisch auf `verified` setzen, `verified_at` + `verification_notes` aktualisieren
- **Ungültig/Fehler** → Status auf `pending_review` belassen, Notiz mit Fehlgrund hinterlegen
- **Keine USt-IdNr.** → Status auf `pending_review` für manuelle Admin-Prüfung

### Schritt 2: Automatischer Trigger
- Wenn ein Partner seinen Status auf `pending_review` setzt (z.B. nach Tax-ID-Eingabe), wird die Edge Function automatisch vom Frontend aufgerufen
- Optional: Cron-Job der täglich `pending_review` Partner erneut prüft (falls VIES temporär nicht erreichbar war)

### Schritt 3: In-App Benachrichtigungen
- Push-Notification an den Partner bei Verifizierung/Ablehnung
- Toast-Benachrichtigung wenn Partner die App öffnet

### Schritt 4: E-Mail Benachrichtigungen
- ⚠️ **Aktuell ist keine E-Mail-Domain konfiguriert**
- Muss zuerst über Cloud → Emails eingerichtet werden
- Danach: Transaktionale E-Mails bei Status-Änderung (verifiziert / abgelehnt / Nachbesserung nötig)

### Zusammenfassung des Flows:
```
Partner gibt USt-IdNr. ein → Status: pending_review
  → auto-verify-partner Edge Function wird aufgerufen
    → VIES API prüft USt-IdNr.
      ✅ Gültig → Status: verified + E-Mail + Push
      ❌ Ungültig → Status: pending_review + Admin-Notiz
      ⚠️ Keine USt-IdNr. → Manuelle Admin-Prüfung
```

### Schritt 1: Edge Function `auto-verify-partner`
- Nimmt `partner_profile_id` entgegen
- Prüft die USt-IdNr. über die **EU VIES API** (kostenlos, kein API-Key nötig)
- **Gültig** → Status automatisch auf `verified` setzen, `verified_at` + `verification_notes` aktualisieren
- **Ungültig/Fehler** → Status auf `pending_review` belassen, Notiz mit Fehlgrund hinterlegen
- **Keine USt-IdNr.** → Status auf `pending_review` für manuelle Admin-Prüfung

### Schritt 2: Automatischer Trigger
- Wenn ein Partner seinen Status auf `pending_review` setzt (z.B. nach Tax-ID-Eingabe), wird die Edge Function automatisch vom Frontend aufgerufen
- Optional: Cron-Job der täglich `pending_review` Partner erneut prüft (falls VIES temporär nicht erreichbar war)

### Schritt 3: In-App Benachrichtigungen
- Push-Notification an den Partner bei Verifizierung/Ablehnung
- Toast-Benachrichtigung wenn Partner die App öffnet

### Schritt 4: E-Mail Benachrichtigungen
- ⚠️ **Aktuell ist keine E-Mail-Domain konfiguriert**
- Muss zuerst über Cloud → Emails eingerichtet werden
- Danach: Transaktionale E-Mails bei Status-Änderung (verifiziert / abgelehnt / Nachbesserung nötig)

### Zusammenfassung des Flows:
```
Partner gibt USt-IdNr. ein → Status: pending_review
  → auto-verify-partner Edge Function wird aufgerufen
    → VIES API prüft USt-IdNr.
      ✅ Gültig → Status: verified + E-Mail + Push
      ❌ Ungültig → Status: pending_review + Admin-Notiz
      ⚠️ Keine USt-IdNr. → Manuelle Admin-Prüfung
```

---

## Post-Launch Roadmap

### Monetarisierung & Payments
- [ ] Stripe-Integration für Premium-Modelle
- [ ] Bei eigener Zahlungsabwicklung (nicht App Store): Muster-Widerrufsformular in AGB ergänzen (§ 355 BGB)

### Features
- [ ] Favoriten-System: DB-Migration für Persistenz und KI-Signale
- [ ] Transportdienst-Integration (FREE NOW, MOIA)
- [ ] Nutzergenerierte Venue-Reviews
- [ ] KI: Automatisierter Support-Agent
- [ ] KI: Date Recaps

### Marketing
- [ ] Effizienter, kostengünstiger Marketingplan entwickeln
