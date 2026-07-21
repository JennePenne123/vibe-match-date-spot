# Google Workspace Migration – H!Outz

> **Zusammenfassung:** Deine App-Daten (Nutzer, Freunde, Badges, Lernprofile, Einstellungen) bleiben in Supase erhalten. Du musst nur die **Google-Cloud-seitigen Credentials** neu erzeugen und in Supabase / Lovable hinterlegen.

## Was bleibt erhalten (keine Änderung nötig)

- Supabase-Projekt (`dfjwubatslzblagthbdw`)
- Lovable-Projekt & Feature-Flags
- Datenbank: Profile, Freundschaften, Badges, Lernprofile, Waitlist, …
- Supabase Auth-Einstellungen (außer Google Provider)
- Supabase Site URL & Redirect URLs (`https://hioutz.app`, `https://www.hioutz.com`)

## Was neu erstellt werden muss

### 1. Google Cloud Console – Neues Projekt anlegen
1. https://console.cloud.google.com/projectcreate
2. Projektname z. B. `hioutz-prod`
3. Notiere die neue **Project ID**.

### 2. APIs aktivieren
In der neuen Cloud Console unter **APIs & Services > Library** aktivieren:

- **Places API (New)** – für Venue-Fotos & Details
- **Maps JavaScript API** – falls Maps im UI genutzt werden
- **Geocoding API** – für Adressauflösung (optional)

### 3. OAuth-Client für „Sign in with Google“ anlegen

Unter **APIs & Services > Credentials > Create Credentials > OAuth client ID**

- **Application type:** Web application
- **Name:** `H!Outz Web App`
- **Authorized JavaScript origins:**
  ```
  https://hioutz.app
  https://www.hioutz.com
  https://dfjwubatslzblagthbdw.supabase.co
  ```
- **Authorized redirect URIs:**
  ```
  https://dfjwubatslzblagthbdw.supabase.co/auth/v1/callback
  ```

> Wichtig: Nur der Supabase-Callback gehört in Google. `https://hioutz.app/auth/callback` gehört in die Supabase Redirect URLs, nicht in Google.

Nach dem Speichern erhältst du:
- **Client ID** (z. B. `1234567890-abc123.apps.googleusercontent.com`)
- **Client Secret**

Diese beiden Werte im **Supabase Dashboard** eintragen:

1. https://supabase.com/dashboard/project/dfjwubatslzblagthbdw/auth/providers
2. Google Auth Provider öffnen
3. Client ID + Client Secret einfügen
4. **Save**

### 4. API-Key für Google Places (Lovable Secret)

Unter **APIs & Services > Credentials > Create Credentials > API key** einen neuen Key anlegen.

- Empfohlen: Einschränkungen setzen (HTTP-Referrers auf `https://hioutz.app/*`, `https://www.hioutz.com/*`)
- Notiere den Key: `AIza...`

Danach in Lovable aktualisieren:

- Secret-Name: `GOOGLE_PLACES_API_KEY`
- Tool: `update_secret` oder Lovable Project Settings → Secrets

Aktuell hinterlegte Secrets (Stand: Juli 2026):

```
CRON_SECRET
ELEVENLABS_API_KEY
FOURSQUARE_API_KEY
GOOGLE_PLACES_API_KEY   ← diesen ersetzen
LOVABLE_API_KEY (managed)
RADAR_API_KEY
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
```

### 5. OAuth-Consent-Screen konfigurieren

Unter **OAuth consent screen**:

- User Type: **External** (oder **Internal**, wenn du Workspace-only willst)
- App name: `H!Outz`
- User support email: `support@hioutz.app`
- Authorized domains:
  ```
  hioutz.app
  hioutz.com
  dfjwubatslzblagthbdw.supabase.co
  ```
- Scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`

### 6. Test nach der Umstellung

1. In der App auf **Anmelden > Google** klicken.
2. Nach der Consent-Weiterleitung landest du auf `/home`.
3. Im Supabase Auth-Log prüfen, ob neue Google-Identities ankommen.
4. Edge Function `validate-google-places-setup` aufrufen, um den neuen Places-Key zu prüfen.

## Rollback-Plan

Lösche den alten Google-Cloud-Client **erst nach erfolgreichem Test**. Bis dahin bleiben beide Clients aktiv – das ist unkritisch, solange die Redirect-URIs nicht kollidieren.

## Supabase URLs (zum Kopieren)

- **Site URL:** `https://hioutz.app`
- **Redirect URLs:**
  - `https://hioutz.app/auth/callback`
  - `https://hioutz.app/**`
  - `https://www.hioutz.com/auth/callback`
  - `https://www.hioutz.com/**`
- **Google Callback (nur in Google Console):** `https://dfjwubatslzblagthbdw.supabase.co/auth/v1/callback`
