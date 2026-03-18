
# VybePulse – Gesamt-Projektübersicht & Roadmap

**Stand: 17. März 2026** | **Geschätzter Fortschritt: ~70%**

---

## 🎯 Projektziel

VybePulse ist eine KI-gestützte Date-Planning-Plattform, die Paaren personalisierte Venue-Empfehlungen liefert, basierend auf beidseitigen Präferenzen, AI-Matching und kontinuierlichem Feedback-Learning.

---

## ✅ Fertiggestellte Features (~70%)

### 🏠 User-Frontend
- **Landing Page** mit Auth-Modal (Google, Apple, E-Mail)
- **Onboarding** (3-Step Carousel)
- **Home** mit Quick-Start Templates, AI-Empfehlungen, Upcoming Dates, Pending Ratings
- **4-Tab Bottom-Nav** (Home, Plan Date, Chats, Profile) mit Swipe-Gesten
- **Modernes Dark-Design** (Slate-900/Indigo Farbschema)
- **6-Sprachen i18n** (DE, EN, FR, ES, IT, AR)
- **PWA-Support** (Service Worker, Offline-Banner, Push Notifications)
- **Responsive Mobile-First** Design (402px optimiert)

### 🤖 KI-Engine
- **AI-Matching-Algorithmus** mit gewichteten Scoring-Faktoren (Küche, Vibe, Preis, Timing, Rating)
- **Collaborative Scoring** für beidseitige Präferenzen mit Shared-Bonus-System
- **Feedback-Loop**: AI lernt aus Ratings und passt Gewichte an (`user_preference_vectors`)
- **Mood Check-In** mit Score-Modifier
- **Implizite Signale**: Dwell Time, Scroll Depth, Repeat Views, Voucher-Klicks → fließen in Scoring ein
- **Contextual Factors**: Tageszeit, Saison
- **Compatibility Scores** zwischen User-Paaren

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
- **Reward Shop** mit Einlösung
- **Referral-System** mit Codes + Punkten

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
- **Rate Limiting** auf Edge Functions
- **Error Monitoring Service** (JS, API, UI, Performance Fehler → DB)
- **Input Sanitization** (DOMPurify)
- **Session Cleanup** (automatisch)
- **OSRM Routing** Integration

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

## 🔧 Offene Aufgaben vor Launch (~30%)

### 🔴 Kritisch (Must-Have für Launch)

| # | Aufgabe | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 1 | **Wallet mit echten Daten** | Mittel | Mock-Vouchers durch Supabase-Queries ersetzen |
| 2 | **Google Places API konfigurieren** | Klein | API-Key im Dashboard einrichten, Venue-Suche live schalten |
| 3 | **Route Code Splitting** | Klein | Alle Haupt-Routes lazy-loaden → ~50% kleineres Bundle |
| 4 | **Produktions-Assets** | Klein | OG-Images, App-Icons, Favicon finalisieren |
| 5 | ~~**Auth-Redirect Konsistenz**~~ | ✅ Erledigt | Alle Seiten einheitlich → `/?auth=required` |
| 6 | **Admin-Zugänge konfigurieren** | Klein | Manuell: `INSERT INTO user_roles (user_id, role) VALUES ('UUID', 'admin')` im SQL Editor ausführen. User-UUIDs unter Supabase → Auth → Users nachschlagen. |
| 7 | **Security Hardening** | Klein | OTP-Ablauf <10min, Leaked Password Protection, autoComplete-Attribute |

### 🟡 Wichtig (Sollte vor Launch)

| # | Aufgabe | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 8 | **DSGVO-Update Datenschutzerklärung** | Klein | Implizites Tracking dokumentieren, Consent prüfen |
| 9 | **Sentry Integration** | Klein | Konto erstellen, DSN hinterlegen, SDK einbinden |
| 10 | **Redemption Push-Notifications** | Mittel | Push bei Voucher-Einlösung (User + Partner) |
| 11 | **Image-Optimierung** | Klein | lazy loading, srcSet, WebP, Avatar-Komprimierung |
| 12 | **React Query Tuning** | Klein | Differenzierte staleTime pro Query-Typ |

### 🟢 Post-Launch / Nice-to-Have

| # | Aufgabe | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 13 | **Stripe Premium-Subscription** | Groß | Free/Premium Tiers, Paywall, Checkout, Webhooks |
| 14 | **KI-Support-Agent** | Groß | AI-Chat als First-Line-Support (ersetzt FAQ) |
| 15 | **Partner Redemption-Übersicht** | Mittel | Eingelöste Vouchers detailliert im Partner-Dashboard |
| 16 | **Bundle-Analyse automatisieren** | Klein | vite-plugin-visualizer + Budget-Limits |
| 17 | **Supabase Realtime konsolidieren** | Mittel | Gemeinsamer Channel statt separate Subscriptions |
| 18 | **Route Preloading** | Klein | Prefetch nach Login + Hover-Prefetch |

---

## 📊 Fortschritts-Einschätzung

```
Gesamt-Fortschritt: ████████████████████░░░░░░░░░░ ~70%

Frontend UI/UX:     █████████████████████████████░ ~95%
KI-Engine:          ████████████████████████░░░░░░ ~80%
Date-Planning:      █████████████████████████████░ ~95%
Venue-System:       ██████████████████████░░░░░░░░ ~75% (echte API-Anbindung fehlt)
Voucher/Rewards:    ████████████████████░░░░░░░░░░ ~65% (Wallet noch Mock-Daten)
Partner-Portal:     █████████████████████████░░░░░ ~85%
Admin Dashboard:    █████████████████████████████░ ~95%
Security/Infra:     ████████████████████████░░░░░░ ~80%
Monetarisierung:    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ~10% (Stripe noch nicht)
Performance:        ██████████████████░░░░░░░░░░░░ ~60% (Code Splitting offen)
DSGVO/Legal:        ████████████████████░░░░░░░░░░ ~65% (implizites Tracking-Update)
```

### Zeitliche Einschätzung bis Launch (Sommer 2026)
- **Kritische Aufgaben (1-7)**: ~2-3 Sessions
- **Wichtige Aufgaben (8-12)**: ~2 Sessions
- **Gesamt bis MVP-Launch**: ~4-5 Sessions
- **Post-Launch Features**: Laufend nach Priorität

---

## 🏗️ Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Backend | Supabase (Auth, DB, Realtime, Edge Functions, Storage) |
| AI/ML | Custom Scoring Engine + Edge Functions (OpenAI-ready) |
| Maps | Leaflet + OSRM Routing |
| Venues | Foursquare API + Google Places API |
| i18n | i18next (6 Sprachen) |
| PWA | Service Worker + Push Notifications |
| Monitoring | Error Monitoring Service (Sentry geplant) |
| Payments | Stripe (geplant) |
