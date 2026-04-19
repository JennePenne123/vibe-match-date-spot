---
name: situational-quick-actions
description: Home Quick-Actions für situative Kategorien (Essen, Kultur, Aktivitäten, Nightlife) als ephemeren Plan-Filter
type: feature
---
Home zeigt 4 Quick-Action-Cards (Essen, Kultur, Aktivitäten, Nightlife) als situativen Anlass-Picker. Beim Tap navigiert die App zu `/preferences?category=<id>`, der Param wird in `sessionStorage` unter `hioutz-situational-category` gespeichert (NICHT im User-Profil — bewusst ephemer). Der Preferences-Screen zeigt ein Banner mit Clear-Button. `useAIAnalysis` liest den Wert aus sessionStorage und reicht ihn als 8. Argument an `getAIVenueRecommendations` durch. Die Recommendation-Pipeline wendet `getSituationalBoost()` als multiplikativen Score-Modifier an: 1.35× für Match, 0.7× für Off-Category, 1.0× neutral. Mapping-Logik in `src/lib/situationalCategories.ts` (boostVenueTypes, boostActivities, boostKeywords pro Kategorie). i18n unter `home.situational.*` und `preferences.situationalBanner*`.
