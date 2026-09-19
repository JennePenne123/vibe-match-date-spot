# H!Outz Roadmap

## Offen / Warteschlange
- [ ] **Weltweiter Venue-Import vorbereiten** – Top-100-Europa-Welle als nächste Ausbaustufe nach DACH; Städteliste, Länder-Handling, Budget/Kostenabschätzung und schrittweises Rollout planen.
- [ ] **Google-Fotos für US-Venues (NYC & LA)** – Nach dem kostenlosen OSM-Import echte Fotos über Google Places nachziehen; Kosten steuern: nur Top-bewertete Orte (z. B. Rating ≥ 4,0) anreichern.

## In Arbeit
- [ ] **Wikimedia-Foto-Fallback auswerten** (Check in ein paar Tagen, ~Mitte nächster Woche): Trefferquote in `venue_photo_attempts` (Startwert 16.09.: 3 Treffer / 21 Fehlschläge). Falls Quote zu niedrig: Namenserkennung im Worker lockern.

## Erledigt (zur Referenz)
- [x] DACH-Import für Essen, Kultur, Aktivität, Nightlife abgeschlossen (50 Städte, 65.348 aktive Orte)
- [x] Neue Kategorien Wellness, Natur & Outdoor, Sport & Action importiert, gescored und in den Plan-a-Date-Flow integriert
- [x] Passkey-Anmeldung repariert und Passkey-Liste in den Einstellungen ergänzt
- [x] Login-Redirect-Logik + automatisierte Tests + E2E-Tests
- [x] Error-Boundary/Cache-Reload nach Deploy-Problemen
