
# VybePulse – Projekt-Übersicht & Roadmap

---

## ✅ Heutige Session – Zusammenfassung (16. März 2026)

### 1. QR-Code Voucher-Redemption System (komplett)
- **Wallet QR-Detail**: Neuer Dialog zeigt QR-Code mit signiertem Payload (`vybe_user_voucher`) beim Tippen auf aktive Voucher
- **Edge Function `redeem-voucher`**: Validiert Partner-JWT, prüft Einmaligkeit via `voucher_redemptions`, markiert Voucher als eingelöst
- **Partner QR-Scanner erweitert**: Erkennt automatisch den QR-Typ:
  - `vybe_user_voucher` → Einlösung via Edge Function
  - `vybe_partner` → Partner-Netzwerk-Verbindung
- **UX-Iteration**: QR-Dialog von custom framer-motion Overlay zu sauberem Radix Dialog umgebaut – klar schließbar mit X-Button, korrekte Größe auf Mobile
- **„Fenster schließen"-Button entfernt** – X oben rechts reicht

### 2. Profil-Header bereinigt
- E-Mail-Adresse unter dem Nutzernamen entfernt (Privacy-Verbesserung)

### 3. Swipe-Navigation Fix
- Bug behoben: `NAV_ORDER` in `AppLayout.tsx` nutzte `/plan-date` statt `/preferences` (= tatsächliche Route der Bottom-Nav)
- Swipe zwischen Home ↔ Chats ↔ Plan Date ↔ Profile sollte jetzt funktionieren

---

## 📊 Performance-Analyse & Empfehlungen

### Aktueller Stand

| Bereich | Status | Details |
|---------|--------|---------|
| **Bundle Size** | ⚠️ Mittel | ~40+ direkte Imports in App.tsx; nur Demo-Routes lazy-loaded |
| **Code Splitting** | 🟡 Teilweise | 7 Demo/Debug-Routes lazy, aber alle 20+ Haupt-Routes eagerly geladen |
| **Venue Cache** | ✅ Gut | 30-min LRU-Cache für Venue-Suchen |
| **Skeleton Loaders** | ✅ Gut | 6+ Varianten für perceived performance |
| **PWA/Offline** | ✅ Gut | Service Worker mit network-first Caching |
| **DB-Indexing** | ✅ Gut | Indexes auf friendships, feedback, etc. |
| **Session Cleanup** | ✅ Gut | Automatische Bereinigung stale Sessions |

### 🔴 Kritische Optimierungen (sollten bald umgesetzt werden)

#### 1. Aggressive Route-basiertes Code Splitting
**Problem**: 20+ Seiten werden im initialen Bundle geladen – der User sieht aber nur die Landing Page.
**Lösung**: Alle geschützten Routes lazy-loaden (Home, Profile, Chats, Preferences, etc.)
**Erwartete Verbesserung**: ~40-60% kleineres initiales Bundle, deutlich schnellere First Paint

#### 2. Dependency-Audit
**Problem**: Große Abhängigkeiten wie `recharts`, `qrcode.react`, `framer-motion`, `i18next` werden global geladen.
**Lösung**:
- `recharts` nur in Chart-Komponenten lazy importieren
- `qrcode.react` nur in QR-Komponenten lazy importieren
- Tree-shaking prüfen für lucide-react Icons
**Erwartete Verbesserung**: ~100-200KB weniger im Haupt-Bundle

#### 3. React Query Optimierung
**Problem**: Aktuell `staleTime: 5min` global – aber manche Daten (Profil, Preferences) ändern sich selten.
**Lösung**: Differenzierte staleTime pro Query-Typ:
- Profil/Preferences: 30min
- Invitations/Chats: 30sec (real-time relevant)
- Venues: via Cache-Service (bereits vorhanden)

### 🟡 Mittlere Priorität

#### 4. Image-Optimierung
- Venue-Bilder sollten mit `loading="lazy"` und `srcSet` für responsive Größen geladen werden
- Avatar-Uploads auf max 500KB komprimieren vor Upload
- WebP-Format bevorzugen

#### 5. Supabase Realtime-Kanäle konsolidieren
- Aktuell potenziell mehrere Subscriptions aktiv (Invitations, Sessions, Vouchers)
- Gemeinsamen Channel mit Filter nutzen statt separate Subscriptions

#### 6. Animation Performance
- `framer-motion` Animationen auf `will-change: transform` beschränken
- Komplexe Animationen auf `GPU-composited properties` (transform, opacity) limitieren
- `AnimatePresence` nur wo nötig einsetzen

### 🟢 Nice-to-Have

#### 7. Preloading kritischer Routes
- Nach Login: `/home` und `/profile` prefetchen
- Link-Prefetching bei Hover auf Nav-Items

#### 8. Bundle-Analyse automatisieren
- `vite-plugin-visualizer` einbauen für regelmäßige Bundle-Checks
- Budget-Limits setzen (z.B. max 500KB initial JS)

---

## 📋 Offene Punkte aus früheren Sessions

### Premium / Subscription Plan (TODO)
- **Zahlungsanbieter**: Stripe
- **Free-Tier**: Venue-Empfehlungen mit AI-Matching (keine Vouchers)
- **Premium-Tier**: Exklusive Vouchers für Top-3 AI-Match Venues
- **Preise & weitere Benefits**: Noch offen

### Implementation Plan (wenn Details feststehen)
1. `user_subscriptions`-Tabelle erstellen
2. Stripe aktivieren via Lovable Stripe-Integration
3. Paywall-Gating: Voucher-Badges nur für Premium-User
4. Premium-Upsell UI für Free-User
5. Pricing-Page & Checkout-Flow
6. Webhook für Subscription-Status-Updates

### Voucher-Redemption via QR-Code ✅
- QR-Code in Wallet → ✅ implementiert
- QR-Scanner im Partner-Dashboard → ✅ implementiert (erkennt User-Voucher + Partner-Codes)
- Edge Function `redeem-voucher` → ✅ implementiert
- **Offen**: Push-Notifications bei erfolgreicher Einlösung (User + Partner)
- **Offen**: Wallet mit echten Supabase-Daten statt Mock-Daten verbinden

### Bekannte Issues (niedrige Priorität)
- Auth-Redirect Inkonsistenz (manche Seiten → `/register-login` statt `/?auth=required`)
- Input `autoComplete`-Attribute fehlen im Auth-Modal
- Deprecated PWA Meta-Tag in `index.html`

---

## 🔐 Admin Dashboard (implementiert – 17. März 2026)

- **Routen**: `/admin/*` mit eigener AdminSidebar
- **Seiten**: Dashboard (KPIs), Analytics (Charts), Nutzer-Übersicht, Content-Moderation, System Health, **Error Monitoring**
- **Zugangsschutz**: `AdminRouteGuard` prüft `admin`-Rolle via `user_roles`-Tabelle, Nicht-Admins werden zu `/home` umgeleitet
- **Pre-Launch TODO**: Admin-Zugänge (Rollen) für finale Nutzer in der `user_roles`-Tabelle anlegen bevor die App live geht
- **Nicht in normaler Navigation sichtbar** – nur über Direktlink `/admin` erreichbar

## 🐛 Error Monitoring (implementiert – 17. März 2026)

- **In-App Logging**: `error_logs`-Tabelle in Supabase mit 4 Fehlertypen (JS, API, UI, Performance)
- **ErrorMonitoringService**: Globale Handler für `window.onerror`, `unhandledrejection`, `PerformanceObserver` (Long Tasks >200ms)
- **ErrorBoundary-Integration**: UI-Fehler werden automatisch in die DB geloggt
- **Admin-Seite** `/admin/errors`: Statistiken (24h), Filter nach Typ, Stack Traces, Severity-Badges
- **Deduplizierung**: Gleiche Fehler innerhalb 5s werden nur einmal geloggt
- **Pre-Launch TODO**: Sentry-Konto erstellen (sentry.io, Free-Tier), React-Projekt anlegen, DSN als `VITE_SENTRY_DSN` in der Codebase hinterlegen und Sentry SDK integrieren

---

## 📡 Implizite Signale (implementiert – 17. März 2026)

- **Signal-Service** (`implicitSignalsService.ts`): Buffered tracking mit 10s Flush-Intervall
- **Signaltypen**: Venue Dwell Time, Scroll Depth, Repeat Views, Voucher Clicks/Ignores, Planning Abandonment, App Usage Time
- **Hooks**: `useVenueImplicitTracking` (VenueDetail), `useAppUsageTracking` (App-Level)
- **AI-Integration**: `getImplicitSignalBoost()` fließt in Venue-Scoring ein (+/- bis zu 10%)
- **Speicherung**: Über bestehende `user_venue_feedback`-Tabelle mit `implicit: true` Context
- **Pre-Launch TODO**: ⚠️ **DSGVO/Privacy**: Datenschutzerklärung aktualisieren! Implizites Tracking muss transparent kommuniziert werden. Prüfen ob Opt-In/Opt-Out nötig (Art. 6 DSGVO – berechtigtes Interesse vs. Einwilligung). Ggf. Cookie-Banner/Consent-Manager erweitern.

---

## 🏗️ Nächste sinnvolle Schritte

1. **Wallet mit echten Daten** – Mock-Vouchers durch Supabase-Queries ersetzen
2. **Redemption-Notifications** – Push bei Voucher-Einlösung
3. **Route Code Splitting** – Alle Haupt-Routes lazy-loaden (Performance-Gewinn)
4. **Stripe Integration** – Premium-Subscription aufsetzen
5. **Partner Redemption-Übersicht** – Eingelöste Vouchers im Partner-Dashboard
6. **Admin-Zugänge vor Launch konfigurieren** – Admin-Rollen in `user_roles` für finale Nutzer setzen
7. **Sentry vor Launch einrichten** – Konto erstellen, DSN hinterlegen, SDK integrieren
8. **DSGVO-Check für implizites Tracking** – Datenschutzerklärung + Consent prüfen
9. **KI-Support-Agent** – AI-gestützter First-Line-Support im Settings-Bereich (ersetzt FAQ-Accordion), Fallback auf E-Mail
