# Kategorie-Prioritäten im Plan-a-Date-Flow

## Die Idee

Heute fragt der Ablauf bei jeder Kategorie fast dasselbe ab und bewertet auch fast
alles gleich. Beim Spaziergang im Park zählen aber Wetter, Ruhe und Weg mehr als
Küche, Budget oder Ernährungswünsche.

Lösung: jede Kategorie bekommt ein eigenes **Prioritäten-Profil**. Es steuert zwei
Dinge gleichzeitig — was gefragt wird und wie stark es zählt. Eine Stelle, ein
Profil, kein doppelter Pflegeaufwand.

## Was sich für dich ändert

**Kürzere, passendere Fragen**
- Natur & Outdoor: kein Ernährungs- und kein Budget-Schritt, dafür Tageszeit und
  Weglänge im Vordergrund.
- Wellness: Budget bleibt, Ernährung fällt weg, Ruhe/Atmosphäre wird betont.
- Sport & Action: Budget und Gruppengröße zählen, Ernährung fällt weg.
- Essen, Kultur, Nightlife bleiben wie gewohnt.

**Sichtbare Prioritäten statt Blackbox**
Oben im Ablauf steht in einem Satz, worauf gerade optimiert wird
("Für Natur & Outdoor zählen Weg, Ruhe und Tageszeit am meisten") — mit
Möglichkeit, eine Priorität per Tipp hoch- oder runterzustufen.

**Bessere Treffer**
Die Bewertung nutzt dieselben Prioritäten: Ausschlaggebend ist bei Outdoor die
Entfernung und Atmosphäre, bei Essen die Küche, bei Nightlife die Uhrzeit.

**Gruppen-Dates**
Jede Person gibt weiterhin ihre eigenen Wünsche an — daran ändert sich nichts.
Neu ist nur, dass die Gruppe die Fragen der gewählten Kategorie bekommt (beim
Parkspaziergang also keine Küchen-Abfrage) und der Gruppen-Konsens dieselben
Prioritäten gewichtet. Ernährungswünsche bleiben in Gruppen bei Essens-Dates
weiterhin ein hartes Ausschlusskriterium.

## Technische Umsetzung

1. `src/lib/categoryWizardConfig.ts`: Pro Kategorie ein neues Feld
   `priorityProfile` mit Gewichten (0–1) für `cuisine`, `vibe`, `budget`,
   `distance`, `timing`, `activity`, `venueType`, `dietary` sowie
   `hiddenSections` konsequent daraus abgeleitet (Gewicht 0 → Sektion raus).
   `visibleSections` wird aus dem Profil berechnet statt handgepflegt.
2. `src/services/aiVenueService/scoring.ts`: Die festen Faktoren (u. a. `0.10`
   für Activity/VenueType) werden mit dem Profilgewicht der aktiven Kategorie
   multipliziert und danach normalisiert, damit die Gesamtsumme stabil bleibt.
   Bestehende `getLifestyleAffinity`-Logik bleibt unverändert und wirkt zusätzlich.
3. `src/hooks/usePreferencesState.ts` / `src/pages/Preferences.tsx`: Schritte aus
   dem Profil ableiten; neuer Prioritäten-Hinweis über dem ersten Schritt
   (Komponente `CategoryPriorityHint`, nutzt `CategoryIcon`).
4. Gruppen: `date_group_members.preferences_data` speichert zusätzlich die
   Kategorie; die Konsens-Berechnung gewichtet Dimensionen mit demselben Profil.
   Keine Migration nötig (jsonb).
5. i18n: neue Schlüssel für Prioritätstexte je Kategorie in de/en/es.
6. Tests: Unit-Tests für die Profilauflösung und die gewichtete Bewertung;
   Prüfung bei 402 px.

## Nicht Teil davon

Keine Änderung an Import, Admin-Bereich oder an der Auswahl, welche Orte
überhaupt geladen werden.
