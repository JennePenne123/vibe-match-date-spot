# aiVenueService Test Coverage Summary

> **Last Updated:** December 2024  
> **Total Tests:** ~104  
> **Function Coverage:** 69% (9/13 exported functions)

---

## Overview

| Metric | Value |
|--------|-------|
| Total Test Files | 4 |
| Total Tests | ~104 |
| Functions Tested | 9 |
| Functions Untested | 4 |
| Coverage Percentage | 69% |

---

## Coverage by File

### ✅ scoring.ts (68 tests)

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `calculateContextualFactors` | ✅ Tested | 8 | Time/season bonuses |
| `calculateConfidenceLevel` | ✅ Tested | 6 | Score + factor thresholds |
| `calculateVenueAIScore` | ✅ Tested | 54 | Core scoring + collaborative |

**Test Categories:**
- Core scoring: 25 tests
- Edge cases: 8 tests
- Error handling: 4 tests
- Learned weights: 8 tests
- Database storage: 5 tests
- **Collaborative scoring: 17 tests** (NEW)

**Collaborative Scoring Tests:**
- Partner preference fetching
- Shared cuisine bonus (+15%)
- Shared price bonus (+10%)
- Shared vibe bonuses (+10% each)
- Score averaging
- Missing partner preferences fallback
- Empty/undefined partnerId handling
- Collaborative metadata storage

---

### ✅ learningIntegration.ts (12 tests)

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `getUserLearnedWeights` | ⚠️ Mocked | 0 | Only mocked in scoring tests |
| `getConfidenceBoost` | ✅ Tested | 6 | AI accuracy + ratings boost |
| `applyWeight` | ✅ Tested | 6 | Weight multiplication |

**Test Categories:**
- Confidence boost calculation: 6 tests
- Weight application: 6 tests

---

### ✅ preferenceFiltering.ts (15 tests)

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `filterVenuesByPreferences` | ✅ Tested | 9 | Single user filtering |
| `filterVenuesByCollaborativePreferences` | ✅ Tested | 6 | Partner filtering |

**Test Categories:**
- Cuisine filtering: 3 tests
- Price range filtering: 2 tests
- Vibe matching: 2 tests
- Score thresholds: 2 tests
- Collaborative fallback: 2 tests
- Shared preference weighting: 4 tests

---

### ✅ helperFunctions.ts (9 tests)

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `calculateDistanceFromHamburg` | ✅ Tested | 9 | Geo distance calculation |

**Test Categories:**
- Hamburg center (0m): 1 test
- Nearby venues (meters): 2 tests
- Distant cities (km): 2 tests
- Missing coordinates: 3 tests
- Edge cases: 1 test

---

### ❌ fetching.ts (0 tests)

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `getActiveVenues` | ❌ Untested | 0 | Database query |
| `getStoredAIScore` | ❌ Untested | 0 | Score retrieval |

**Priority:** HIGH - Core data fetching functions

---

### ❌ recommendations.ts (0 tests)

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `getAIVenueRecommendations` | ❌ Untested | 0 | Main recommendation pipeline |
| `generateAIReasoning` | ❌ Untested | 0 | AI reasoning generation |

**Priority:** MEDIUM - Integration tests needed

---

## Test Distribution

```
scoring.ts          ████████████████████████████████████ 68 (65%)
preferenceFiltering ████████ 15 (14%)
learningIntegration ██████ 12 (12%)
helperFunctions     █████ 9 (9%)
fetching.ts         ░ 0 (0%)
recommendations.ts  ░ 0 (0%)
```

---

## Coverage Gaps & Recommendations

### Priority 1: fetching.ts (Estimated: 8-10 tests)
```typescript
// Tests needed:
- getActiveVenues() returns active venues only
- getActiveVenues() handles empty results
- getActiveVenues() handles database errors
- getStoredAIScore() returns cached score
- getStoredAIScore() returns null for missing score
- getStoredAIScore() handles database errors
```

### Priority 2: recommendations.ts (Estimated: 12-15 tests)
```typescript
// Tests needed:
- getAIVenueRecommendations() full pipeline
- getAIVenueRecommendations() with user preferences
- getAIVenueRecommendations() collaborative mode
- getAIVenueRecommendations() empty venues handling
- getAIVenueRecommendations() error handling
- generateAIReasoning() with match factors
- generateAIReasoning() fallback reasoning
```

### Priority 3: learningIntegration.ts (Estimated: 5-6 tests)
```typescript
// Tests needed:
- getUserLearnedWeights() fetches from database
- getUserLearnedWeights() returns defaults when no data
- getUserLearnedWeights() handles database errors
- getUserLearnedWeights() clamps weight values
```

---

## How to Run Tests

```bash
# Run all aiVenueService tests
npx vitest run src/services/aiVenueService

# Run specific test file
npx vitest run src/services/aiVenueService/scoring.test.ts

# Run with coverage report
npx vitest run src/services/aiVenueService --coverage

# Watch mode for development
npx vitest src/services/aiVenueService
```

---

## Test File Locations

| Source File | Test File |
|-------------|-----------|
| scoring.ts | scoring.test.ts |
| learningIntegration.ts | learningIntegration.test.ts |
| preferenceFiltering.ts | preferenceFiltering.test.ts |
| helperFunctions.ts | helperFunctions.test.ts |
| fetching.ts | ❌ Missing |
| recommendations.ts | ❌ Missing |

---

## Coverage Improvement Roadmap

| Phase | Target | Effort | Impact |
|-------|--------|--------|--------|
| 1 | fetching.ts tests | 2 hours | +8% coverage |
| 2 | recommendations.ts tests | 3 hours | +15% coverage |
| 3 | getUserLearnedWeights tests | 1 hour | +8% coverage |
| **Total** | **100% function coverage** | **~6 hours** | **+31%** |

---

## Notes

- All tests use Vitest with mocked Supabase client
- Timer mocking used for contextual factors (time-based bonuses)
- Collaborative scoring tests added December 2024
- Coverage thresholds set to 30% baseline in vitest.config.ts
