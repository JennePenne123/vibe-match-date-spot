# Capacitor Native Build — H!Outz iOS & Android

> **Status:** Capacitor 6 ist konfiguriert (`capacitor.config.ts`). Native Builds laufen nicht in Lovable, sondern lokal in **Xcode** (iOS) bzw. **Android Studio** (Android).

---

## Wer behebt was? — Der Update-Workflow

| Problem | Wer fixt | Dein Schritt danach |
|---------|----------|---------------------|
| UI-Bug, Layout-Problem, Text falsch | **Ich (Lovable)** | `npm run build && npx cap sync` |
| API-Fehler, Auth-Probleme, Datenbank-RLS | **Ich (Lovable)** | `npm run build && npx cap sync` |
| Edge Function crashed / 500er | **Ich (Lovable)** | Kein lokaler Build nötig (Backend deployt automatisch) |
| App startet nicht / weißer Bildschirm | **Du (lokal)** | Siehe Troubleshooting unten |
| Build-Fehler in Xcode / Android Studio | **Du (lokal)** | Build-Tools, Signing, Dependencies prüfen |
| Native Plugin Crash (Kamera, GPS, Push) | **Du (lokal)** | Native Logs in Xcode/Android Studio prüfen |
| App Store / Play Store Ablehnung | **Du (lokal)** | Guidelines prüfen, Screenshots neu erstellen |

**Wichtig:** Ich bearbeite nur den Web-Code (React, TypeScript, Edge Functions, DB). Alles, was in Xcode oder Android Studio passiert, musst du lokal machen.

---

## Voraussetzungen
- **macOS** mit Xcode 15+ (für iOS)
- **Android Studio** Iguana+ (für Android)
- **Node 20+** und **npm** oder **bun**
- Apple Developer Account ($99/Jahr) für iOS-Distribution
- Google Play Console ($25 einmalig) für Android-Distribution

## Erstes Setup
```bash
git clone <dein-repo>
cd hioutz
npm install

# Native Plattformen hinzufügen
npx cap add ios
npx cap add android

# Build & Sync
npm run build
npx cap sync
```

## Hot-Reload während Entwicklung
`capacitor.config.ts` enthält bereits `server.url` mit der Lovable-Sandbox-URL — die App lädt direkt aus der Cloud, kein lokaler Webserver nötig. Für Production-Build diesen Block **auskommentieren** und neu bauen.

## Permissions (vor erstem Build setzen!)

### iOS — `ios/App/App/Info.plist`
Füge zwischen `<dict>...</dict>` ein:

```xml
<key>NSCameraUsageDescription</key>
<string>H!Outz nutzt die Kamera, um QR-Codes von Partner-Venues und Gutscheinen zu scannen.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>H!Outz schlägt dir Locations in deiner Nähe vor — basierend auf deinem aktuellen Standort.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>H!Outz greift auf deine Fotos zu, damit du ein Profilbild auswählen kannst.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>H!Outz sendet dir Erinnerungen zu geplanten Dates und neue Einladungen.</string>
```

### Android — `android/app/src/main/AndroidManifest.xml`
Innerhalb `<manifest>` (vor `<application>`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## Push Notifications (nach Initial-Build)

### iOS — APNs
1. Apple Developer Console → **Keys** → neuer Key mit **Apple Push Notifications service (APNs)**
2. `.p8`-Datei + Key-ID + Team-ID notieren
3. In Supabase Dashboard → **Authentication → Providers** ist nicht zuständig — Push läuft über VAPID (bereits konfiguriert) und wird über Web-View weitergereicht. Für **native** APNs später `@capacitor/push-notifications` Plugin installieren.

### Android — Firebase
1. [Firebase Console](https://console.firebase.google.com/) → neues Projekt
2. App registrieren mit `app.lovable.4f7c4b2feda1456f9ad5810c6a818ded`
3. `google-services.json` herunterladen → `android/app/`

> **Hinweis:** Aktuell läuft Push über **Web Push (VAPID)** im Service Worker — das funktioniert auch in Capacitor-WebViews auf Android Chrome. iOS Web Push funktioniert nur, wenn die App via Safari als PWA installiert wurde, nicht in einer Capacitor-WebView. Für volle iOS-Unterstützung später `@capacitor/push-notifications` ergänzen.

## Build-Befehle

```bash
# Web-Build aktualisieren & nach Native syncen
npm run build && npx cap sync

# In Xcode öffnen
npx cap open ios

# In Android Studio öffnen
npx cap open android

# Direkt auf Gerät/Emulator
npx cap run ios
npx cap run android
```

## Update-Zyklus nach einem Fix von Lovable

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Ich fixe    │ ──► │  2. Du pullest  │ ──► │  3. Build &     │
│     im Chat     │     │     git pull    │     │     Sync        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐              │
│  5. Testen auf  │ ◄── │  4. In Xcode/   │ ◄──────────┘
│     Gerät       │     │   Android Studio│
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  6. Bei Native  │
│     Problemen:  │
│     Logs an mich│
│     (nur Web)   │
└─────────────────┘
```

**Schritt-für-Schritt:**
1. Ich bearbeite den Code in Lovable
2. Du holst dir die Änderungen: `git pull`
3. Du baust den Web-Code neu: `npm run build`
4. Du syncst in die native Plattform: `npx cap sync`
5. Du startest die App in Xcode / Android Studio oder auf dem Gerät
6. **Nur Web-Logs** (Console, Netzwerk) kannst du mir schicken — native Crash-Logs musst du selbst in Xcode/Android Studio lesen

## Production-Build Checkliste

- [ ] `server.url` in `capacitor.config.ts` entfernt/auskommentiert
- [ ] `npm run build` mit Production-Env
- [ ] `npx cap sync`
- [ ] App-Icons in `ios/App/App/Assets.xcassets` und `android/app/src/main/res/mipmap-*` ersetzt
- [ ] Splash-Screen konfiguriert
- [ ] Versions-Nummer in Xcode (CFBundleVersion) und Android (`versionCode`/`versionName`) erhöht
- [ ] iOS: Signing & Capabilities → Push Notifications + Sign In with Apple aktiviert
- [ ] Android: `keystore` erstellt und in `android/app/build.gradle` referenziert

---

## Troubleshooting

### App lädt weißen Bildschirm
→ `server.url` in `capacitor.config.ts` zeigt evtl. ins Leere. Auskommentieren und neu bauen.

### OAuth Redirect schlägt fehl
→ Native OAuth braucht Custom URL Scheme (z. B. `hioutz://`). Im Supabase Dashboard zusätzlich zu `https://hioutz.app/home` auch `hioutz://home` als Redirect URL hinterlegen.

### Kamera / Location Permission denied
→ Permission-Strings (siehe oben) fehlen oder App muss in System-Settings manuell freigegeben werden.

### iOS Build-Fehler "Signing required"
→ Xcode → Project → Signing & Capabilities → Team auswählen. Apple Developer Account nötig.

### Android Build-Fehler "Keystore error"
→ `android/app/build.gradle` prüfen oder neuen Keystore erstellen:
```bash
keytool -genkey -v -keystore hioutz.keystore -alias hioutz -keyalg RSA -keysize 2048 -validity 10000
```

### Fehler nur auf einem Gerät, nicht im Simulator
→ Wahrscheinlich ein **nativer** Fehler (nicht Web-Code). Prüfe:
- iOS: Xcode → Window → Devices and Simulators → Device Logs
- Android: Android Studio → Logcat

### Wie finde ich heraus, ob es ein Web- oder Native-Fehler ist?
- Öffne die **Safari DevTools** (iOS) oder **Chrome DevTools** (Android) für die WebView
- Siehst du Console-Errors? → **Web-Fehler** → schick mir einen Screenshot der Console
- Startet die App gar nicht / stürzt sofort ab? → **Native-Fehler** → Xcode/Android Studio Logs prüfen

---

## Was du mir schicken kannst (Web-Fehler)

Wenn ein Fehler in der App auftritt, kannst du mir folgendes schicken:
- Screenshot der **Safari/Chrome DevTools Console**
- Screenshot der **Network-Tab** (bei API-Fehlern)
- Beschreibung: Was hast du getippt/getippt? Welcher Screen?

**Was ich damit machen kann:**
- Code fixen (React, TypeScript, CSS)
- Edge Function anpassen
- Datenbank-Policy korrigieren
- Auth-Flow debuggen

**Was ich NICHT damit machen kann:**
- Xcode-Build-Fehler beheben
- App Store Review-Probleme lösen
- Native Plugin-Bugs fixen (z. B. Kamera-Plugin crash)

---

## Weitere Ressourcen
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Lovable Mobile Blog Post](https://lovable.dev/blog/2024-09-16-mobile-development-with-capacitor)
