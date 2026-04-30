---
name: activity-path-non-gastro
description: Bei Aktivitäten/Kultur/Nightlife-Pfaden müssen Non-Gastro-Venues angezeigt werden, nicht nur Restaurants
type: constraint
---
Wenn ein User Aktivitäts-Preferences (`preferred_venue_types`, `preferred_activities` wie mini_golf, bowling, museum, swimming, spa_wellness, climbing, escape_room, arcade, cinema, theater_venue, concert_hall) gesetzt hat ODER eine situational Quick-Action (culture/activity/nightlife) aktiv ist, MÜSSEN entsprechende Non-Gastro-Venues in den Empfehlungen erscheinen — Restaurants/Cafés/Bars dürfen nicht dominieren.

**Pflicht-Checks bei Pipeline-Änderungen:**
1. Overpass-Query muss die OSM-Tags der Aktivität enthalten (siehe `VENUE_TYPE_OSM_TAGS` in `src/services/overpassSearchService.ts`). `preferred_venue_types` + `preferred_activities` werden als `extraVenueTypes` an `searchVenuesOverpass` durchgereicht (in `getVenuesFromOverpass` in `recommendations.ts`).
2. Google-Primary-Pfad: Wenn Niche-Activities/VenueTypes gesetzt sind, MUSS Google mit den passenden Place-Types (`bowling_alley`, `museum`, `spa`, `amusement_park` für mini_golf, etc.) gequert werden — nicht nur generic restaurant search.
3. Cuisine-Filter darf Non-Food-Venues NICHT verwerfen (`isFoodVenue` check in overpassSearchService — Mini-Golf hat kein cuisine-Tag).
4. Preference-Filtering (`src/services/aiVenueService/preferenceFiltering.ts`) muss venue_type-Mapping respektieren (z.B. mini_golf → tags `['mini golf', 'minigolf']`).
5. Mindestens 1-2 Non-Gastro-Venues sollten in Top-Recommendations erscheinen, wenn der User entsprechende Aktivitäten gewählt hat.

**Anti-Pattern:** Niemals nur `cuisine`-basierte Selektoren verwenden, wenn `preferred_venue_types`/`preferred_activities` Non-Food-Items enthalten.
