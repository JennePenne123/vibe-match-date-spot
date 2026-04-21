# Capacitor Native Build — H!Outz iOS & Android

> **Status:** Capacitor 6 ist konfiguriert (`capacitor.config.ts`). Native Builds laufen nicht in Lovable, sondern lokal in **Xcode** (iOS) bzw. **Android Studio** (Android).

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

## Production-Build Checkliste

- [ ] `server.url` in `capacitor.config.ts` entfernt/auskommentiert
- [ ] `npm run build` mit Production-Env
- [ ] `npx cap sync`
- [ ] App-Icons in `ios/App/App/Assets.xcassets` und `android/app/src/main/res/mipmap-*` ersetzt
- [ ] Splash-Screen konfiguriert
- [ ] Versions-Nummer in Xcode (CFBundleVersion) und Android (`versionCode`/`versionName`) erhöht
- [ ] iOS: Signing & Capabilities → Push Notifications + Sign In with Apple aktiviert
- [ ] Android: `keystore` erstellt und in `android/app/build.gradle` referenziert

## Troubleshooting

**"App lädt weißen Bildschirm"** → `server.url` in `capacitor.config.ts` zeigt evtl. ins Leere. Auskommentieren und neu bauen.

**"OAuth Redirect schlägt fehl"** → Native OAuth braucht Custom URL Scheme (z. B. `hioutz://`). Im Supabase Dashboard zusätzlich zu `https://hioutz.app/home` auch `hioutz://home` als Redirect URL hinterlegen.

**"Kamera/Location permission denied"** → Permission-Strings (siehe oben) fehlen oder App muss in System-Settings manuell freigegeben werden.

## Weitere Ressourcen
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Lovable Mobile Blog Post](https://lovable.dev/blog/2024-09-16-mobile-development-with-capacitor)
