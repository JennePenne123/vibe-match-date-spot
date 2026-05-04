## H!Outz – Projektstand (14.04.2026)

### 📊 Codebase-Statistiken
| Metrik | Anzahl |
|---|---|
| Seiten | 57 |
| Komponenten | 193 |
| Custom Hooks | 52 |
| Services | 61 |
| Edge Functions | 38 |
| DB-Migrationen | 153 |
| Sprachen (i18n) | 3 (DE, EN, ES) |

### Tech-Stack
- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui
- **Backend**: Supabase (Auth, DB, RLS, Edge Functions, Storage)
- **KI**: Lovable AI Gateway (Venue-Matching, Kompatibilität, Concierge, Tag-Analyse)
- **Internationalisierung**: i18next (DE/EN/ES)
- **Mobile**: Capacitor (vorbereitet für iOS/Android)
- **Marketing**: Remotion (Promo-Videos)

---

## ✅ Erledigt (Gesamt)

### Kern-Features
- [x] KI-basiertes Venue-Matching mit personalisierten Scores
- [x] Mood-Check-In → Venue-Empfehlungen in 30 Sekunden
- [x] Date-Planning (Solo, Zu zweit, Gruppen-Dates)
- [x] Freundschaftssystem + Kompatibilitäts-Scores
- [x] Einladungs- & Chat-System für Dates
- [x] Voucher-System (Erstellen, Einlösen, QR-Scan)
- [x] Belohnungssystem (Punkte, XP, Level, Badges, Streaks)
- [x] Referral-System mit Codes
- [x] Favoriten-System
- [x] Date-Feedback mit Gamification-Rewards
- [x] KI-Concierge (Chat-basierte Venue-Empfehlungen)

### Partner-Portal
- [x] Partner-Dashboard mit Analytics
- [x] Venue-Verwaltung + Voucher-Management
- [x] QR-Code-Generierung & Scanner
- [x] Netzwerk-Karte (Partner-zu-Partner-Verbindungen)
- [x] City-Rankings
- [x] Venue-Vergleich
- [x] Staff-Management (Einladen, QR-Token, Scanner)
- [x] Partner-exklusive Vouchers (Netzwerk-Rabatte)
- [x] Automatische Partner-Verifizierung (VIES API)
- [x] Manuelle Admin-Verifizierung für Ausnahmen
- [x] KI-Tag-Vorschläge aus Venue-Websites

### Admin-Panel
- [x] Dashboard mit Übersicht
- [x] User-Management
- [x] Moderation
- [x] System-Health-Monitoring
- [x] Error-Logs
- [x] Team-Verwaltung (Rollen: Owner, Admin, Moderator, Viewer)
- [x] Analytics

### Sicherheit
- [x] Row-Level Security (RLS) auf allen Tabellen
- [x] Rollen-System (admin, venue_partner, regular) via `user_roles`
- [x] `has_role()` Security Definer Funktion
- [x] Partner-Profil-Schutz (Trigger gegen Selbst-Verifizierung)
- [x] Rollen-Escalation-Schutz (Trigger `validate_role_insert`)
- [x] Rate-Limiting auf Edge Functions
- [x] Realtime-Channel-Security (Prefix-only Pattern)
- [x] Storage-Bucket-Schutz (kein Dateilisten für Unbefugte)
- [x] Waitlist-Validierung (Name/E-Mail-Format)
- [x] Account-Löschung (DSGVO-konform, `delete_user_data`)
- [x] Profil-Sichtbarkeit (ohne E-Mail-Leak)

### Venue-Daten
- [x] Multi-Provider-Suche (Foursquare, Overpass, Radar, TripAdvisor)
- [x] Google Places Validierung
- [x] Datenqualitäts-Scoring
- [x] Venue-Daten-Cleanup (Nicht-Gastronomie entfernt, Museen/Theater/Kinos behalten)

### E-Mail & Notifications
- [x] E-Mail-Domain (support.hioutz.app) konfiguriert + DNS verifiziert
- [x] Auth-E-Mail-Templates mit H!Outz-Branding
- [x] Transaktionale E-Mails (Verifizierung, Einladung, Erinnerung)
- [x] Push-Notifications (VAPID/Web Push)
- [x] In-App Benachrichtigungssystem

### Rechtstexte
- [x] AGB (Entwurf, Platzhalter für Firmendaten)
- [x] Datenschutzerklärung (Entwurf, DSGVO + KI-Profiling-Hinweis)
- [x] Impressum (Entwurf)
- [x] Widerrufsformular (Entwurf)
- [x] Partner-AGB + Datenschutz

### Branding & Assets
- [x] Logo (H!Outz mit Kompass-Stern)
- [x] Favicon (H! mit 4-Punkt-Sparkle ✦)
- [x] App-Icons (PWA: icon-192, icon-512, app-icon)
- [x] Dark-Mode Design-System (Teal #0D9488 + Orange #F97316)
- [x] Logo-Klick → Home Navigation

### Infrastruktur
- [x] Supabase Site-URLs auf Produktions-Domain
- [x] Service Worker + Offline-Banner
- [x] Geo-Privacy-Banner
- [x] Error Boundary (App + Page Level)
- [x] Lazy Loading aller Routen
- [x] Wartelisten-Seite (/waitlist)

### Marketing
- [x] Remotion Promo-Video (Pop Art Comic Style)
- [x] Marketingplan (PDF) mit 12-Wochen-Timeline
- [x] Waitlist-Landingpage

---

## 🔲 Noch offen (Pre-Launch)

### 🚨 Blocker (zwingend vor Launch)
- [ ] UG-Gründung abschließen
- [ ] Firmendaten in `src/config/companyInfo.ts` ersetzen (eine Datei → updated AGB / Datenschutz / Impressum / Widerruf / Partner-AGB / Partner-Privacy automatisch)
- [ ] Google OAuth → Produktions-Credentials (hioutz.app Origins + Redirect URIs) + in Supabase eintragen
- [ ] Supabase Site URL + Redirect URLs final auf https://hioutz.app verifizieren
- [ ] Projekt in Lovable auf **Publish** klicken

### ⚠️ Wichtig (sollte vor Launch)
- [ ] Sentry Test-Event in Produktion einmal verifizieren (SentryTestTrigger-Komponente bereits entfernt ✅)
- [ ] ITMR Legal Erstberatung durchführen
- [ ] DSFA (Datenschutz-Folgenabschätzung) prüfen
- [ ] Rate Limiting & API Quotas validieren (Foursquare, Google Places, Lovable AI)
- [ ] Cron-Jobs Status final checken

### ✅ Bereits erledigt
- [x] Custom Domain hioutz.app verbunden (A-Records + TXT-Verify)
- [x] SSL automatisch provisioniert
- [x] OG-Image (1200×630) in public/og-image.jpg + index.html eingebunden
- [x] Security-Hardening: venue_staff RLS (Staff sieht nur eigenen Eintrag, Trigger gegen Self-Promotion)
- [x] Security-Hardening: Storage-Bucket-Listing blockiert (avatars, venue-photos)
- [x] Security-Hardening: pg_graphql Extension entfernt (nur REST in Nutzung)

### 📱 Post-Launch (optional)
- [ ] Apple OAuth → Apple Developer Program ($99/Jahr) + Konfiguration
- [ ] Native Mobile App (Capacitor: iOS/Android Build, Permissions, Push Certs)
- [ ] App Store Screenshots
- [ ] Stripe-Integration (Monetarisierung)

---

## 📋 Post-Launch Roadmap

### Monetarisierung & Payments
- [ ] Stripe-Integration (4,99 €/Monat, 39,99 €/Jahr, Lifetime 79,99 €)
- [ ] Founding Member Preis (2,99 €/Monat, erste 1.000 Nutzer)
- [ ] Premium-Vouchers für Top-3-Matches
- [ ] Widerrufsformular: Platzhalter ersetzen

### Features
- [ ] Favoriten-Persistenz + KI-Signale (DB-Migration)
- [ ] Transportdienst-Integration (FREE NOW, MOIA)
- [ ] Nutzergenerierte Venue-Reviews
- [ ] KI: Automatisierter Support-Agent
- [ ] KI: Date Recaps
- [ ] KI: Venue Metadata-Enrichment (Google Places/Scraping)

### POS-/Kassensystem-Integration
- [ ] Partner-Umfrage: Welches Kassensystem?
- [ ] Phase 1: Voucher-Einlösung im meistgenutzten POS
- [ ] Phase 2: Besuchstracking über POS
- [ ] Phase 3: Umsatz-Analytics als Premium-Partner-Feature

### Marketing
- [ ] ASO (App Store Optimization)
- [ ] Google Business Profil
- [ ] Instagram/TikTok Content-Strategie starten
- [ ] Partner-QR-Codes in Venues verteilen

---

## 📅 Heute erledigt (14.04.2026)

### Security-Fixes ✅
- Waitlist-Validierung (Name/E-Mail-Format Check in RLS)
- Storage-Bucket-Schutz (kein Dateilisten für Unbefugte in avatars/venue-photos)
- Realtime-Channel-Security (Prefix-only Pattern, kein Channel-Bypass)
- Profil-Sichtbarkeit für Social Features (ohne E-Mail-Leak)

### Branding ✅
- Favicon generiert: "H!" Monogramm mit 4-Punkt-Sparkle ✦ (Teal auf Dark Slate)
- App-Icons aktualisiert (PWA icon-192, icon-512, app-icon)

### UX ✅
- Logo-Klick navigiert jetzt zu /home (Mobile + Desktop Header)

### Venue-Daten Cleanup ✅
- Nicht-Gastronomie-Betriebe weltweit bereinigt (Museen/Theater/Kinos für spätere Aktivitäten-Integration behalten)

### Pre-Launch Planung ✅
- Feature-Icons als nicht nötig eingestuft (Lucide reicht)
- Landing Page Hero Assets als nicht blockend eingestuft
