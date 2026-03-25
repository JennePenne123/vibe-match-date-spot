
# VybePulse – Gesamt-Projektübersicht & Roadmap

**Stand: 25. März 2026** | **Geschätzter Fortschritt: ~89%**

---

## 🎯 Projektziel

VybePulse ist eine KI-gestützte Date-Planning-Plattform, die Paaren personalisierte Venue-Empfehlungen liefert, basierend auf beidseitigen Präferenzen, AI-Matching und kontinuierlichem Feedback-Learning.

---

## ✅ Fertiggestellte Features (~89%)

### 🏠 User-Frontend
- **Landing Page** mit Auth-Modal (Google, Apple, E-Mail) + Social Proof Banner
- **Onboarding** (Gamified, mit Fortschritts-Labels & Motivations-Nachrichten)
- **Home** mit Quick-Start Templates, AI-Empfehlungen, Upcoming Dates, Pending Ratings
- **4-Tab Bottom-Nav** (Home, Plan Date, Chats, Profile) mit Slide-Animationen
- **Modernes Dark-Design** (Slate-900/Indigo Farbschema)
- **6-Sprachen i18n** (DE, EN, FR, ES, IT, AR)
- **PWA-Support** (Service Worker, Offline-Banner, Push Notifications)
- **Responsive Mobile-First** Design (402px optimiert)
- **SEO-optimiert** (OG-Tags, JSON-LD, Meta-Descriptions, robots.txt)
- **Framer Motion Animationen** ✅ (gestaffelte Card-Einblendung, Expand/Collapse)

### 🤖 KI-Engine
- **AI-Matching-Algorithmus** mit gewichteten Scoring-Faktoren (Küche, Vibe, Preis, Timing, Rating)
- **Collaborative Scoring** für beidseitige Präferenzen mit Shared-Bonus-System
- **Feedback-Loop**: AI lernt aus Ratings und passt Gewichte an (`user_preference_vectors`)
- **Cold-Start-Lösung**: Onboarding-Präferenzen → initiale `feature_weights` + Preference-Vektoren
- **Mood Check-In** mit Score-Modifier
- **Implizite Signale**: Dwell Time, Scroll Depth, Repeat Views, Voucher-Klicks → Scoring-Integration
- **Beschleunigte Gewichtsanpassung**: Stärkere Adjustments bei wenig Datenpunkten
- **Contextual Factors**: Tageszeit, Saison (Wetter-Integration geplant)
- **Compatibility Scores** zwischen User-Paaren
- **AI Edge Function** für Venue-Reasoning (Top-N Enhancement, optional aktivierbar)
- **Präziseres Scoring** ✅ Gewichte optimiert → Top-3 Venues erreichen ~80%+ Match-Score
- **Konsistente Match-Scores** ✅ Keine Mock-Overrides mehr bei Venue-Detail-Ansicht
- **Cuisine-Mismatch-Penalty** ✅ Stärkere Bestrafung für falsche Küchen-Matches
- **Venue-Blocklist** ✅ Lieferservices, Takeaway-only, Supermärkte werden automatisch gefiltert
- **AI-Transparenz** ✅ Confidence-Level, "Warum dieses Venue?"-Chips, Personalisierungs-Indikator

### 📅 Date-Planning
- **Smart Date Planner** (Solo + Collaborative Mode)
- **6-Step Planning Flow**: Partner → Präferenzen → AI-Matching → Review → Proposal → Einladung
- **Date Proposals** mit Ablaufdatum
- **Realtime Collaborative Sessions** (beide Partner setzen Präferenzen)
- **Date Invitations** mit Status-Tracking (pending → accepted → completed)
- **Invitation Messenger** (Chat pro Einladung)
- **Automatische Date-Erinnerungen** ✅ (Cron-Job alle 30min, 24h + 1h vor Date)

### 🏪 Venue-System
- **Venue-Suche** (Overpass + Radar + Foursquare, Google Places als Fallback)
- **Venue Detail Pages** mit Fotos, Ratings, Öffnungszeiten, Karte
- **Venue Feedback** (Like/Dislike/Super Like/Skip)
- **30-min LRU Venue-Cache** mit automatischer Invalidierung bei Standortwechsel
- **Map View** mit Clustered Markers (Leaflet)
- **Globaler Standort-Sync** ✅ Stadtwechsel in Preferences → Planner übernimmt automatisch
- **Radar-API Radius-Fix** ✅ Max 10km (API-Limit)
- **Strikte Geo-Filterung** ✅ Bounding-Box verhindert standortfremde Ergebnisse

### 🎟️ Voucher & Rewards
- **QR-Code Voucher-System** (Wallet → QR anzeigen → Partner scannt → Edge Function validiert)
- **Wallet mit echten Supabase-Daten** ✅ (reward_redemptions + voucher_redemptions kombiniert)
- **Gamification**: Punkte, Badges, Streaks, Leaderboard, Levels
- **Reward Shop** mit Einlösung (monatliche Limits, Premium-Zugang)
- **Referral-System** mit Codes + Punkten
- **Push-Notifications bei Voucher-Einlösung** (User + Partner + Voucher-Ersteller)

### 📱 Social & Viral Features ✅ NEU
- **WhatsApp/Telegram Share** für Date-Einladungen (1-Tap Share-Button)
- **Native Share API** als Fallback
- **Social Proof Banner** auf der Landing Page (User-Counts, Match-Genauigkeit)
- **Link-Kopieren** für Date-Einladungen

### 👔 Partner-Portal
- **Dashboard** mit KPIs
- **Venue Management** (Fotos, Details, Öffnungszeiten)
- **Voucher-Erstellung & -Verwaltung** (mit Analytics)
- **QR-Scanner** (User-Voucher einlösen + Partner-Netzwerk)
- **City Rankings** (Venue-Performance nach Stadt)
- **Reports** mit PDF-Export
- **Partner-Netzwerk** (exklusive Vouchers zwischen Partnern)
- **Guest Feedback Widget**

### 🔐 Admin Dashboard
- **Dashboard** mit KPIs
- **Analytics** (Charts)
- **Nutzer-Übersicht**
- **Content-Moderation**
- **System Health**
- **Error Monitoring** (4 Fehlertypen, Statistiken, Filter, Stack Traces)
- **Zugangsschutz** via `AdminRouteGuard` + `user_roles`

### 🛡️ Infrastruktur & Security
- **Supabase Backend**: Auth, RLS, Edge Functions, Realtime
- **RLS-Policies** auf allen Tabellen (inkl. SECURITY DEFINER für Rollen)
- **Rate Limiting** auf Edge Functions (mit Request-Logging)
- **Error Monitoring Service** (JS, API, UI, Performance Fehler → DB)
- **Sentry Integration** ✅ (vybepulse.sentry.io, DSN konfiguriert, SDK aktiv)
- **Input Sanitization** (DOMPurify)
- **Session Cleanup** (automatisch)
- **OSRM Routing** Integration
- **Security Scan: 8/8 Findings gefixt** ✅ NEU
  - profiles_safe E-Mail-Leak behoben
  - Venue-Policy Source-Bypass entfernt
  - Analytics-Views mit security_invoker gesichert
  - Partner-Update erfordert venue_partner-Rolle
  - api_usage_logs INSERT auf eigene user_id beschränkt
- **Verbleibende Warnungen**: Extension in Public (kosmetisch), request_logs true (kein user_id)

### ⚙️ Account & Settings
- **E-Mail & Passwort ändern** (mit Re-Auth)
- **Konto pausieren/reaktivieren**
- **DSGVO-Datenexport** (JSON)
- **Konto löschen** (mit manueller Bestätigung)
- **Push-Notification Einstellungen**
- **Sprachauswahl**
- **Support-Bereich** (FAQ-Accordion + E-Mail-Fallback)
- **Rechtliche Seiten** (Impressum, Datenschutz, AGB)
- **DSGVO-Opt-Out** für implizite Signale ✅

---

## 🔧 Offene Aufgaben vor Launch (~11%)

### 🔴 Kritisch (Must-Have für Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 1 | **Produktions-Assets** | 🔴 Offen | OG-Images, App-Icons (192x192, 512x512), Favicons (16x16, 32x32, 180x180) |
| 2 | **Admin-Zugänge konfigurieren** | 📋 Manuell | `INSERT INTO user_roles (user_id, role) VALUES ('UUID', 'admin')` im SQL Editor |

### 🟡 Wichtig (Sollte vor Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 3 | **Bundle-Optimierung** | 🟡 Offen | Code-Splitting, Lazy Loading für Routes, Tree-Shaking-Audit |
| 4 | **Wetter-Integration** | 🟡 Geplant | OpenWeatherMap API → Kontext-Aware Scoring (Indoor/Outdoor, Terrasse) |
| 5 | **E2E Testing** | 🟡 Offen | Kritische Flows testen (Auth, Onboarding, Recommendations, Date-Invite) |

### 🟢 Post-Launch / Nice-to-Have

| # | Aufgabe | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 6 | **Stripe Premium-Subscription** | Groß | Free/Premium Tiers, Paywall, Checkout, Webhooks |
| 7 | **KI-Support-Agent** | Groß | AI-Chat als First-Line-Support (ersetzt FAQ) |
| 8 | **Standort-Picker im Planner** | Klein | Schneller Stadtwechsel direkt im Smart Date Planner |
| 9 | **Supabase Realtime konsolidieren** | Mittel | Gemeinsamer Channel statt separate Subscriptions |
| 10 | **Partner Redemption-Übersicht** | Mittel | Eingelöste Vouchers detailliert im Partner-Dashboard |
| 11 | **Gemeinsames Planen verbessern** | Mittel | Freunde direkt in die App einladen zum kollaborativen Planning |
| 12 | **🎉 Event-System** | Groß | Events-Tabelle, AI-Scoring für Events, kombinierte Vorschläge (Event + Venue), Partner können Events erstellen |
| 13 | **Event-Kategorien** | Mittel | Konzerte, Ausstellungen, Food-Festivals, Workshops, Sport-Events, Open-Air |
| 14 | **Event + Venue Combos** | Mittel | AI schlägt "Erst Konzert, dann Dinner nebenan" vor |
| 15 | **Event-Kalender** | Mittel | Kalender-View für anstehende Events in der Nähe |
| 16 | **A/B Testing Framework** | Mittel | Feature-Flags, Conversion-Tracking für UI-Varianten |
| 17 | **Multi-User Date Groups** | Groß | Gruppen-Dates planen (3+ Personen, z.B. Doppel-Date) |
| 18 | **Venue-Reviews von Usern** | Mittel | Eigene Review-Funktion statt nur Feedback-Buttons |
| 19 | **AI Date-Recap** | Klein | Nach dem Date: AI generiert eine kurze Zusammenfassung + Erinnerungs-Foto-Prompt |
| 20 | **Partner-Analytics v2** | Mittel | Heatmaps, Conversion Funnels, Zeitraum-Vergleiche im Partner-Portal |

### ✅ Heute erledigt (25. März 2026)

| Aufgabe | Beschreibung |
|---------|--------------|
| ~~Gamified Onboarding~~ | Step-Labels, Motivations-Nachrichten, schnellere Progression |
| ~~Push Date-Erinnerungen~~ | Cron-Job (30min), 24h + 1h vor Date automatische Benachrichtigung |
| ~~Social/Viral Features~~ | WhatsApp/Telegram Share, Social Proof Banner auf Landing Page |
| ~~Security Findings (8/8)~~ | profiles_safe, Venue-Policies, Analytics-Views, Partner-RLS gefixt |
| ~~Framer Motion Animations~~ | Gestaffelte Card-Einblendung auf Results-Seite |
| ~~Deutsche UI-Texte~~ | Results-Seite ins Deutsche übersetzt |

---

## 📊 Fortschritts-Einschätzung

```
Gesamt-Fortschritt: ███████████████████████████░░░ ~89%

Frontend UI/UX:     ██████████████████████████████ ~98%  ↑ Framer Motion
KI-Engine:          █████████████████████████████░ ~95%  ↑ AI-Transparenz
Date-Planning:      █████████████████████████████░ ~96%  ↑ Auto-Erinnerungen
Venue-System:       ██████████████████████████░░░░ ~88%
Voucher/Rewards:    █████████████████████████░░░░░ ~85%
Partner-Portal:     █████████████████████████░░░░░ ~85%
Admin Dashboard:    █████████████████████████████░ ~95%
Security/Infra:     █████████████████████████████░ ~95%  ↑ 8 Findings gefixt
Social/Viral:       ████████████████████████░░░░░░ ~80%  ✅ NEU
Monetarisierung:    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ~10% (Stripe geplant)
Performance:        ███████████████████████████░░░ ~88%  ↑ Animationen
DSGVO/Legal:        ████████████████████████████░░ ~92%
```

### Zeitliche Einschätzung bis Launch (Sommer 2026)
- **Kritische Aufgaben (1-2)**: ~1 Session + manuelle Dashboard-Schritte
- **Wichtige Aufgaben (3-5)**: ~2-3 Sessions
- **Gesamt bis MVP-Launch**: ~3-4 Sessions
- **Post-Launch Features**: Laufend nach Priorität

---

## 🏗️ Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Backend | Supabase (Auth, DB, Realtime, Edge Functions, Storage) |
| AI/ML | Custom Scoring Engine + Edge Functions (Gemini via Lovable AI Gateway) |
| Maps | Leaflet + OSRM Routing |
| Venues | Overpass API + Radar API + Foursquare API |
| i18n | i18next (6 Sprachen) |
| PWA | Service Worker + Web Push API (VAPID) |
| Monitoring | Error Monitoring Service + Sentry (aktiv) |
| Payments | Stripe (geplant) |
