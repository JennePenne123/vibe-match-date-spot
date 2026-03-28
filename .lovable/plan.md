
# VybePulse – Gesamt-Projektübersicht & Roadmap

**Stand: 28. März 2026** | **Geschätzter Fortschritt: ~94%**

---

## 🎯 Projektziel

VybePulse ist eine KI-gestützte Date-Planning-Plattform, die Paaren personalisierte Venue-Empfehlungen liefert, basierend auf beidseitigen Präferenzen, AI-Matching und kontinuierlichem Feedback-Learning.

---

## ✅ Fertiggestellte Features (~95%)

### 🏠 User-Frontend
- Landing Page mit Auth-Modal (Google, Apple, E-Mail) + Social Proof Banner
- Gamified Onboarding mit Fortschritts-Labels & Motivations-Nachrichten
- Home mit Quick-Start Templates, AI-Empfehlungen, Upcoming Dates, Pending Ratings
- 4-Tab Bottom-Nav (Home, Plan Date, Chats, Profile) mit Slide-Animationen
- Modernes Dark-Design (Slate-900/Indigo Farbschema)
- 6-Sprachen i18n (DE, EN, FR, ES, IT, AR)
- PWA-Support (Service Worker, Offline-Banner, Push Notifications)
- Responsive Mobile-First Design (402px optimiert)
- SEO-optimiert (OG-Tags, JSON-LD, Meta-Descriptions, robots.txt)
- Framer Motion Animationen (gestaffelte Card-Einblendung, Expand/Collapse)

### 🤖 KI-Engine (14-Signal-Pipeline)
- 14-Signal AI-Matching: User Preferences, Real-time Context, Habit Learning, Repeat-Visit Protection, Occasion Scoring, Social Proof, Weather Scoring, Bayesian Ratings, Implicit Signals, Synergy Bonuses, Time-based Auto-Context, Smarter Partner Merging, Temporal Decay (90d), Distance Tolerance Learning
- Collaborative Scoring für beidseitige Präferenzen mit Shared-Bonus-System
- Feedback-Loop: AI lernt aus Ratings und passt Gewichte an
- Cold-Start-Lösung: Onboarding-Präferenzen → initiale feature_weights
- Mood Check-In mit Score-Modifier
- Implizite Signale: Dwell Time, Scroll Depth, Repeat Views, Voucher-Klicks
- AI-Transparenz: Confidence-Level, "Warum dieses Venue?"-Chips, Personalisierungs-Indikator

### 📅 Date-Planning
- Smart Date Planner (Solo + Collaborative Mode)
- 6-Step Planning Flow: Partner → Präferenzen → AI-Matching → Review → Proposal → Einladung
- Date Proposals mit Ablaufdatum
- Realtime Collaborative Sessions
- Date Invitations mit Status-Tracking
- Invitation Messenger (Chat pro Einladung)
- Automatische Date-Erinnerungen (Cron-Job, 24h + 1h vor Date)

### 🏪 Venue-System
- Venue-Suche (Overpass + Radar + Foursquare, Google Places als Fallback)
- Venue Detail Pages mit Fotos, Ratings, Öffnungszeiten, Karte
- Venue Feedback (Like/Dislike/Super Like/Skip)
- 30-min LRU Venue-Cache mit automatischer Invalidierung
- Map View mit Clustered Markers (Leaflet)
- Strikte Geo-Filterung (Bounding-Box)

### 🎟️ Voucher & Rewards
- QR-Code Voucher-System (Wallet → QR → Partner scannt → Edge Function validiert)
- Wallet mit echten Supabase-Daten
- Gamification: Punkte, 18 Badges, Streaks, Leaderboard, Levels
- Premium Badge 👑 für Premium-Nutzer
- Reward Shop mit Einlösung
- Referral-System mit Codes + Punkten

### 📱 Social & Viral Features
- WhatsApp/Telegram Share für Date-Einladungen
- Native Share API als Fallback
- Social Proof Banner auf Landing Page

### 👔 Partner-Portal
- Dashboard mit KPIs + Membership-Karte + Billing-Übersicht
- Venue Management, Voucher-Erstellung & -Verwaltung
- QR-Scanner, City Rankings, Reports mit PDF-Export
- Guest Feedback (anonym, kategorisiert, unidirektional)
- Membership-System (Free/Pro-Tiers mit ProFeatureGate)
- Treue-Bonus (12 Monate Pro → 3 Monate gratis)
- Legal-Framework (AGB-/Datenschutz-Akzeptanz mit Versionierung)
- 22-Länder-Verifizierung

### 🔐 Admin Dashboard
- Dashboard, Analytics, Nutzer-Übersicht, Content-Moderation
- System Health, Error Monitoring
- Zugangsschutz via AdminRouteGuard + user_roles

### 🛡️ Infrastruktur & Security
- Supabase Backend: Auth, RLS, Edge Functions, Realtime
- RLS-Policies auf allen Tabellen (inkl. SECURITY DEFINER)
- Rate Limiting + Request-Logging auf Edge Functions
- Error Monitoring Service + Sentry Integration
- Input Sanitization (DOMPurify), Session Cleanup
- Security Scan: 8/8 Findings gefixt

### ⚡ Performance (NEU — 27. März)
- **Vite Manual Chunks**: Vendor-Splitting (React, Radix, Recharts, Leaflet, Framer Motion, Supabase, Sentry, PDF, QR-Scanner)
- **Route-basiertes Lazy Loading** für alle Seiten
- **Shared React Query Caching**: Deduplizierte user_preferences-Abfragen (3→1 Request auf Home)
- **Schnellere Mood→Home Transition**: Kein blockierendes refreshProfile() mehr

### ⚙️ Account & Settings
- E-Mail & Passwort ändern, Konto pausieren/reaktivieren
- DSGVO-Datenexport (JSON), Konto löschen
- Push-Notification Einstellungen, Sprachauswahl
- Support-Bereich (FAQ + E-Mail-Fallback)
- Rechtliche Seiten (Impressum, Datenschutz, AGB)
- DSGVO-Opt-Out für implizite Signale

---

## 🔧 Offene Aufgaben vor Launch (~6%)

### 🔴 Kritisch (Must-Have)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 1 | **Produktions-Assets** | 🔴 Offen | OG-Images, App-Icons (192x192, 512x512), Favicons (16x16, 32x32, 180x180) |
| 2 | **Admin-Zugänge konfigurieren** | 📋 Manuell | `INSERT INTO user_roles` im SQL Editor |
| 3 | **Rechtliche Texte finalisieren** | 🔴 Extern | AGB + Datenschutzerklärung durch Anwalt prüfen lassen |
| 4 | **Google Sign-In konfigurieren** | 🔴 Extern | Google Cloud Projekt → OAuth 2.0 Client ID + Secret → Supabase Auth Providers |
| 5 | **Apple Sign-In konfigurieren** | 🔴 Extern | Apple Developer Account (99$/Jahr) → Services ID → Supabase Auth Providers |
| 6 | **Supabase Site URL setzen** | 🔴 Manuell | Live-Domain als Site URL unter Auth → URL Configuration eintragen |

### 🟡 Wichtig (Sollte vor Launch)

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|--------------|
| 7 | **Wetter-Integration** | 🟡 Geplant | OpenWeatherMap API → Kontext-Aware Scoring (Indoor/Outdoor) |
| 8 | **E2E Testing** | 🟡 Offen | Kritische Flows testen (Auth, Onboarding, Recommendations, Date-Invite) |

### 🟢 Post-Launch / Nice-to-Have

| # | Aufgabe | Aufwand |
|---|---------|---------|
| 9 | Stripe-Integration (Partner + User) | Groß |
| 10 | Favoriten-System → Supabase | Mittel |
| 11 | KI-Support-Agent | Groß |
| 12 | Standort-Picker im Planner | Klein |
| 13 | Supabase Realtime konsolidieren | Mittel |
| 14 | Event-System (Events + Venue Combos + Kalender) | Groß |
| 15 | A/B Testing Framework | Mittel |
| 16 | Multi-User Date Groups | Groß |
| 17 | Venue-Reviews von Usern | Mittel |
| 18 | AI Date-Recap | Klein |
| 19 | Partner-Analytics v2 | Mittel |

---

## ✅ Zuletzt erledigt

### 28. März 2026
| Aufgabe | Beschreibung |
|---------|--------------|
| ~~Quality & Polish Sprint~~ | Mobile-Responsivität, i18n Error/Empty States, Design-Token-Konsolidierung |
| ~~Social Login To-Dos dokumentiert~~ | Google + Apple Sign-In Konfigurationsanleitung erstellt |

### 27. März 2026
| Aufgabe | Beschreibung |
|---------|--------------|
| ~~Code-Splitting / Manual Chunks~~ | Vite Vendor-Splitting für React, Radix, Recharts, Leaflet, Framer Motion, Supabase, Sentry, PDF, QR |
| ~~Performance: Home-Ladezeit~~ | Shared useUserPreferences Hook, deduplizierte Queries, blockierendes refreshProfile() entfernt |

### 26. März 2026
| Aufgabe | Beschreibung |
|---------|--------------|
| ~~Guest Feedback Loop~~ | Anonymes, kategorisiertes Feedback mit Trend-Charts |
| ~~Membership-System~~ | Free/Pro-Tiers, ProFeatureGate, MembershipCard |
| ~~Treue-Bonus-System~~ | 12 Monate Pro → 3 Monate gratis, Fortschrittsbalken |
| ~~Legal-Framework~~ | AGB-/Datenschutz-Akzeptanz mit Versionierung |
| ~~Billing-Übersicht~~ | Plan-Anzeige, Pricing, Founding Partner Status |

### 25. März 2026
| Aufgabe | Beschreibung |
|---------|--------------|
| ~~Gamified Onboarding~~ | Step-Labels, Motivations-Nachrichten |
| ~~Push Date-Erinnerungen~~ | Cron-Job (30min), 24h + 1h vor Date |
| ~~Social/Viral Features~~ | WhatsApp/Telegram Share, Social Proof Banner |
| ~~Security Findings (8/8)~~ | profiles_safe, Venue-Policies, Analytics-Views gefixt |
| ~~Framer Motion Animations~~ | Gestaffelte Card-Einblendung |
| ~~AI-Banner Auto-Hide~~ | Nach 3x Ansicht automatisch ausgeblendet |
| ~~Premium Badge~~ 👑 | Goldenes Badge für Premium-Nutzer |

---

## 📊 Fortschritts-Einschätzung

```
Gesamt-Fortschritt: ██████████████████████████████ ~95%

Frontend UI/UX:     ██████████████████████████████ ~99% ↑ Quality Sprint
KI-Engine:          █████████████████████████████░ ~96%
Date-Planning:      █████████████████████████████░ ~96%
Venue-System:       ██████████████████████████░░░░ ~88%
Voucher/Rewards:    ██████████████████████████░░░░ ~87%
Partner-Portal:     ████████████████████████████░░ ~92%
Admin Dashboard:    █████████████████████████████░ ~95%
Security/Infra:     █████████████████████████████░ ~95%
Social/Viral:       ████████████████████████░░░░░░ ~80%
Performance:        █████████████████████████████░ ~93%
Monetarisierung:    █████░░░░░░░░░░░░░░░░░░░░░░░░░ ~18%
Auth/Social Login:  ██████████████████████████░░░░ ~85% (Code fertig, Config extern)
DSGVO/Legal:        █████████████████████████████░ ~95%
```

### Zeitliche Einschätzung bis Launch
- **Kritische Aufgaben (1-6)**: ~1-2 Sessions + externe Accounts/Anwaltsprüfung
- **Wichtige Aufgaben (7-8)**: ~1-2 Sessions
- **Gesamt bis MVP-Launch**: ~2-3 Sessions
- **Stripe-Integration**: ~1-2 Sessions (Post-Launch)

---

## 🏗️ Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Backend | Supabase (Auth, DB, Realtime, Edge Functions, Storage) |
| AI/ML | Custom Scoring Engine + Edge Functions (Gemini) |
| Maps | Leaflet + OSRM Routing |
| Venues | Overpass API + Radar API + Foursquare API |
| i18n | i18next (6 Sprachen) |
| PWA | Service Worker + Web Push API (VAPID) |
| Monitoring | Error Monitoring Service + Sentry |
| Payments | Stripe (geplant) |
