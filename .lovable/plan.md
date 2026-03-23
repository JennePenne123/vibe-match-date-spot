
# VybePulse – Gesamt-Projektübersicht & Roadmap

**Stand: 23. März 2026** | **Geschätzter Fortschritt: ~82%**

---

## 🎯 Projektziel

VybePulse ist eine KI-gestützte Date-Planning-Plattform, die Paaren personalisierte Venue-Empfehlungen liefert, basierend auf beidseitigen Präferenzen, AI-Matching und kontinuierlichem Feedback-Learning.

---

## ✅ Fertiggestellte Features (~82%)

### 🏠 User-Frontend
- **Landing Page** mit Auth-Modal (Google, Apple, E-Mail)
- **Onboarding** (3-Step Carousel)
- **Home** mit Quick-Start Templates, AI-Empfehlungen, Upcoming Dates, Pending Ratings
- **4-Tab Bottom-Nav** (Home, Plan Date, Chats, Profile) mit Slide-Animationen
- **Modernes Dark-Design** (Slate-900/Indigo Farbschema)
- **6-Sprachen i18n** (DE, EN, FR, ES, IT, AR)
- **PWA-Support** (Service Worker, Offline-Banner, Push Notifications)
- **Responsive Mobile-First** Design (402px optimiert)
- **SEO-optimiert** (OG-Tags, JSON-LD, Meta-Descriptions, robots.txt)

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

### 📅 Date-Planning
- **Smart Date Planner** (Solo + Collaborative Mode)
- **6-Step Planning Flow**: Partner → Präferenzen → AI-Matching → Review → Proposal → Einladung
- **Date Proposals** mit Ablaufdatum
- **Realtime Collaborative Sessions** (beide Partner setzen Präferenzen)
- **Date Invitations** mit Status-Tracking (pending → accepted → completed)
- **Invitation Messenger** (Chat pro Einladung)

### 🏪 Venue-System
- **Venue-Suche** (Foursquare + Radar Integration, Google Places deaktiviert)
- **Venue Detail Pages** mit Fotos, Ratings, Öffnungszeiten, Karte
- **Venue Feedback** (Like/Dislike/Super Like/Skip)
- **30-min LRU Venue-Cache**
- **Map View** mit Clustered Markers (Leaflet)

### 🎟️ Voucher & Rewards
- **QR-Code Voucher-System** (Wallet → QR anzeigen → Partner scannt → Edge Function validiert)
- **Wallet mit echten Supabase-Daten** ✅ (reward_redemptions + voucher_redemptions kombiniert)
- **Gamification**: Punkte, Badges, Streaks, Leaderboard, Levels
- **Reward Shop** mit Einlösung (monatliche Limits, Premium-Zugang)
- **Referral-System** mit Codes + Punkten
- **Push-Notifications bei Voucher-Einlösung** (User + Partner + Voucher-Ersteller)

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
- **Auth-Redirect Konsistenz** ✅ → alle Seiten → `/?auth=required`
- **autoComplete-Attribute** auf Auth-Formularen ✅

### ⚙️ Account & Settings
- **E-Mail & Passwort ändern** (mit Re-Auth)
- **Konto pausieren/reaktivieren**
- **DSGVO-Datenexport** (JSON)
- **Konto löschen** (mit manueller Bestätigung)
- **Push-Notification Einstellungen**
- **Sprachauswahl**
- **Support-Bereich** (FAQ-Accordion + E-Mail-Fallback)
- **Rechtliche Seiten** (Impressum, Datenschutz, AGB)
- **DSGVO-Opt-Out** für implizite Signale ✅ (Toggle in Settings + localStorage)
- **Datenschutzerklärung aktualisiert** ✅ (Sentry, Foursquare/Radar, implizites Tracking dokumentiert)

---

## 🔧 Offene Aufgaben vor Launch (~18%)

### 🔴 Kritisch (Must-Have für Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 1 | **Produktions-Assets** | 🔴 Offen | OG-Images, App-Icons, Favicon finalisieren |
| 2 | **Admin-Zugänge konfigurieren** | 📋 Manuell | `INSERT INTO user_roles (user_id, role) VALUES ('UUID', 'admin')` im SQL Editor |
| 3 | **Security Hardening** | 📋 Manuell | OTP-Ablauf <10min, **Leaked Password Protection (HIBP Check)**, **Anonymous Sign-Ins deaktivieren** im Supabase Dashboard |

### 🟡 Wichtig (Sollte vor Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 4 | **React Query Tuning** | 🟡 Offen | Differenzierte staleTime pro Query-Typ |
| 5 | **VAPID-Keys einrichten** | 📋 Manuell | `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` als Edge Function Secrets |
| 6 | **Wetter-Integration** | 🟡 Geplant | OpenWeatherMap API → Kontext-Aware Scoring (Indoor/Outdoor, Terrasse) |

### 🟢 Post-Launch / Nice-to-Have

| # | Aufgabe | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 7 | **Stripe Premium-Subscription** | Groß | Free/Premium Tiers, Paywall, Checkout, Webhooks |
| 8 | **KI-Support-Agent** | Groß | AI-Chat als First-Line-Support (ersetzt FAQ) |
| 9 | **Partner Redemption-Übersicht** | Mittel | Eingelöste Vouchers detailliert im Partner-Dashboard |
| 10 | **Bundle-Analyse automatisieren** | Klein | vite-plugin-visualizer + Budget-Limits |
| 11 | **Supabase Realtime konsolidieren** | Mittel | Gemeinsamer Channel statt separate Subscriptions |
| 12 | ~~**Route Preloading**~~ | ✅ Done | Prefetch nach Login + Hover-Prefetch |
| 13 | ~~**Feedback-Impact-Anzeige**~~ | ✅ Done | Hinweis auf Home wenn sich Empfehlungen durch Feedback verändert haben |
| 14 | **Tree-Shaking-Audit** | Klein | Ungenutzten Code und Imports identifizieren und entfernen |
| 15 | **Bundle-Größe optimieren** | Mittel | Chunk-Splitting analysieren, große Dependencies prüfen |
| 16 | **React Query Tuning** | Klein | Differenzierte staleTime pro Query-Typ (z.B. 30s für Admin, 10min für Stammdaten) |

---

## 📊 Fortschritts-Einschätzung

```
Gesamt-Fortschritt: █████████████████████████░░░░░ ~82%

Frontend UI/UX:     ██████████████████████████████ ~98%
KI-Engine:          ███████████████████████████░░░ ~90%  ↑ Scoring optimiert
Date-Planning:      █████████████████████████████░ ~95%
Venue-System:       █████████████████████████░░░░░ ~80%  ↑ API-Strategie steht
Voucher/Rewards:    █████████████████████████░░░░░ ~85%  ↑ Wallet mit echten Daten
Partner-Portal:     █████████████████████████░░░░░ ~85%
Admin Dashboard:    █████████████████████████████░ ~95%
Security/Infra:     ███████████████████████████░░░ ~90%  ↑ Sentry aktiv
Monetarisierung:    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ~10% (Stripe noch nicht)
Performance:        ██████████████████████████░░░░ ~85%  ↑ Code Splitting + Image Opt.
DSGVO/Legal:        ████████████████████████████░░ ~92%  ↑ Datenschutz aktualisiert
```

### Zeitliche Einschätzung bis Launch (Sommer 2026)
- **Kritische Aufgaben (1-3)**: ~1 Session + manuelle Dashboard-Schritte
- **Wichtige Aufgaben (4-6)**: ~2 Sessions
- **Gesamt bis MVP-Launch**: ~3 Sessions
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
| Venues | Foursquare API + Radar API |
| i18n | i18next (6 Sprachen) |
| PWA | Service Worker + Push Notifications |
| Monitoring | Error Monitoring Service + Sentry (aktiv) |
| Payments | Stripe (geplant) |
