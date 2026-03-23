
# VybePulse – Gesamt-Projektübersicht & Roadmap

**Stand: 18. März 2026** | **Geschätzter Fortschritt: ~77%**

---

## 🎯 Projektziel

VybePulse ist eine KI-gestützte Date-Planning-Plattform, die Paaren personalisierte Venue-Empfehlungen liefert, basierend auf beidseitigen Präferenzen, AI-Matching und kontinuierlichem Feedback-Learning.

---

## ✅ Fertiggestellte Features (~77%)

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
- **Beschleunigte Gewichtsanpassung**: Stärkere Adjustments bei wenig Datenpunkten für schnelleres Lernen
- **Contextual Factors**: Tageszeit, Saison (Wetter-Integration geplant)
- **Compatibility Scores** zwischen User-Paaren
- **AI Edge Function** für Venue-Reasoning (Top-N Enhancement, optional aktivierbar)

### 📅 Date-Planning
- **Smart Date Planner** (Solo + Collaborative Mode)
- **6-Step Planning Flow**: Partner → Präferenzen → AI-Matching → Review → Proposal → Einladung
- **Date Proposals** mit Ablaufdatum
- **Realtime Collaborative Sessions** (beide Partner setzen Präferenzen)
- **Date Invitations** mit Status-Tracking (pending → accepted → completed)
- **Invitation Messenger** (Chat pro Einladung)

### 🏪 Venue-System
- **Venue-Suche** (Foursquare + Google Places Integration)
- **Venue Detail Pages** mit Fotos, Ratings, Öffnungszeiten, Karte
- **Venue Feedback** (Like/Dislike/Super Like/Skip)
- **30-min LRU Venue-Cache**
- **Map View** mit Clustered Markers (Leaflet)

### 🎟️ Voucher & Rewards
- **QR-Code Voucher-System** (Wallet → QR anzeigen → Partner scannt → Edge Function validiert)
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
- **Input Sanitization** (DOMPurify)
- **Session Cleanup** (automatisch)
- **OSRM Routing** Integration
- **Auth-Redirect Konsistenz** → alle Seiten → `/?auth=required` ✅
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

---

## 🔧 Offene Aufgaben vor Launch (~23%)

### 🔴 Kritisch (Must-Have für Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 1 | **Wallet mit echten Daten** | 🔴 Offen | Mock-Vouchers durch Supabase-Queries ersetzen |
| 2 | ~~**Venue API konfigurieren**~~ | ✅ Erledigt | Radar + Foursquare Strategie implementiert (Google Places deaktiviert) |
| 3 | ~~**Route Code Splitting**~~ | ✅ Erledigt | War bereits implementiert (alle Routes nutzen React.lazy) |
| 4 | **Produktions-Assets** | 🔴 Offen | OG-Images, App-Icons, Favicon finalisieren |
| 5 | ~~**Auth-Redirect Konsistenz**~~ | ✅ Erledigt | Alle Seiten einheitlich → `/?auth=required` |
| 6 | **Admin-Zugänge konfigurieren** | 📋 Manuell | `INSERT INTO user_roles (user_id, role) VALUES ('UUID', 'admin')` im SQL Editor |
| 7 | **Security Hardening** | 📋 Manuell | OTP-Ablauf <10min, **Leaked Password Protection (HIBP Check) aktivieren** (Auth → Email Settings), **Anonymous Sign-Ins deaktivieren** (Auth → Providers) im Supabase Dashboard |

### 🟡 Wichtig (Sollte vor Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 8 | **DSGVO-Update Datenschutzerklärung** | 🟡 Offen | Implizites Tracking dokumentieren, Consent/Opt-Out prüfen |
| 9 | **Sentry Integration** | 🟡 Offen | Konto erstellen, DSN hinterlegen, SDK einbinden |
| 10 | ~~**Redemption Push-Notifications**~~ | ✅ Erledigt | Push bei Voucher-Einlösung an User + Partner |
| 11 | ~~**Image-Optimierung**~~ | ✅ Erledigt | lazy loading, decoding=async, fetchPriority auf LCP-Elementen |
| 12 | **React Query Tuning** | 🟡 Offen | Differenzierte staleTime pro Query-Typ |
| 13 | **VAPID-Keys einrichten** | 📋 Manuell | `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` als Edge Function Secrets |
| 14 | **Wetter-Integration** | 🟡 Geplant | OpenWeatherMap API → Kontext-Aware Scoring (Indoor/Outdoor, Terrasse) |

### 🟢 Post-Launch / Nice-to-Have

| # | Aufgabe | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 15 | **Stripe Premium-Subscription** | Groß | Free/Premium Tiers, Paywall, Checkout, Webhooks |
| 16 | **KI-Support-Agent** | Groß | AI-Chat als First-Line-Support (ersetzt FAQ) |
| 17 | **Partner Redemption-Übersicht** | Mittel | Eingelöste Vouchers detailliert im Partner-Dashboard |
| 18 | **Bundle-Analyse automatisieren** | Klein | vite-plugin-visualizer + Budget-Limits |
| 19 | **Supabase Realtime konsolidieren** | Mittel | Gemeinsamer Channel statt separate Subscriptions |
| 20 | **Route Preloading** | Klein | Prefetch nach Login + Hover-Prefetch |
| 21 | **DSGVO Opt-Out für implizite Signale** | Klein | Toggle in Settings zum Deaktivieren von Tracking |
| 22 | **Feedback-Impact-Anzeige** | Klein | Hinweis auf Home wenn sich Empfehlungen durch Feedback verändert haben |

---

## 📊 Fortschritts-Einschätzung

```
Gesamt-Fortschritt: ███████████████████████░░░░░░░ ~77%

Frontend UI/UX:     ██████████████████████████████ ~98%
KI-Engine:          █████████████████████████░░░░░ ~85%
Date-Planning:      █████████████████████████████░ ~95%
Venue-System:       ██████████████████████░░░░░░░░ ~75% (echte API-Anbindung fehlt)
Voucher/Rewards:    ██████████████████████░░░░░░░░ ~70% (Wallet noch Mock-Daten)
Partner-Portal:     █████████████████████████░░░░░ ~85%
Admin Dashboard:    █████████████████████████████░ ~95%
Security/Infra:     ██████████████████████████░░░░ ~85% (VAPID offen)
Monetarisierung:    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ~10% (Stripe noch nicht)
Performance:        ██████████████████░░░░░░░░░░░░ ~60% (Code Splitting offen)
DSGVO/Legal:        ████████████████████░░░░░░░░░░ ~65% (Tracking-Update offen)
```

### Zeitliche Einschätzung bis Launch (Sommer 2026)
- **Kritische Aufgaben (1-4)**: ~2 Sessions (Code-Änderungen)
- **Manuelle Aufgaben (6, 7, 13)**: Jederzeit im Dashboard erledigbar
- **Wichtige Aufgaben (8, 9, 11, 12, 14)**: ~3 Sessions
- **Gesamt bis MVP-Launch**: ~5 Sessions
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
| Venues | Foursquare API + Google Places API |
| i18n | i18next (6 Sprachen) |
| PWA | Service Worker + Push Notifications |
| Monitoring | Error Monitoring Service (Sentry geplant) |
| Payments | Stripe (geplant) |
