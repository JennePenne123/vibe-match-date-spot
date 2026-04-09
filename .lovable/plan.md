
## Automatische Partner-Verifizierung

### Schritt 1: Edge Function `auto-verify-partner`
- Nimmt `partner_profile_id` entgegen
- Prüft die USt-IdNr. über die **EU VIES API** (kostenlos, kein API-Key nötig)
- **Gültig** → Status automatisch auf `verified` setzen, `verified_at` + `verification_notes` aktualisieren
- **Ungültig/Fehler** → Status auf `pending_review` belassen, Notiz mit Fehlgrund hinterlegen
- **Keine USt-IdNr.** → Status auf `pending_review` für manuelle Admin-Prüfung

### Schritt 2: Automatischer Trigger
- Wenn ein Partner seinen Status auf `pending_review` setzt (z.B. nach Tax-ID-Eingabe), wird die Edge Function automatisch vom Frontend aufgerufen
- Optional: Cron-Job der täglich `pending_review` Partner erneut prüft (falls VIES temporär nicht erreichbar war)

### Schritt 3: In-App Benachrichtigungen
- Push-Notification an den Partner bei Verifizierung/Ablehnung
- Toast-Benachrichtigung wenn Partner die App öffnet

### Schritt 4: E-Mail Benachrichtigungen
- ⚠️ **Aktuell ist keine E-Mail-Domain konfiguriert**
- Muss zuerst über Cloud → Emails eingerichtet werden
- Danach: Transaktionale E-Mails bei Status-Änderung (verifiziert / abgelehnt / Nachbesserung nötig)

### Zusammenfassung des Flows:
```
Partner gibt USt-IdNr. ein → Status: pending_review
  → auto-verify-partner Edge Function wird aufgerufen
    → VIES API prüft USt-IdNr.
      ✅ Gültig → Status: verified + E-Mail + Push
      ❌ Ungültig → Status: pending_review + Admin-Notiz
      ⚠️ Keine USt-IdNr. → Manuelle Admin-Prüfung
```
