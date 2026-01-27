# Date Planning Flow Architecture

> **Last Updated**: January 2026  
> **Status**: Current implementation (Solo Mode deprecated)

## Overview

This document describes the collaborative date planning flow as implemented in the codebase. The system exclusively uses **Collaborative Mode** where two users work together to set preferences and discover matching venues.

---

## Changelog

| Date | Change |
|------|--------|
| Jan 2026 | Removed Solo Mode branch (deprecated in code) |
| Jan 2026 | Added Session Recovery Guards documentation |
| Jan 2026 | Added 10-second Timeout Fallback path |
| Jan 2026 | Added Real-time Sync mechanism details |

---

## Entry Points

| Entry | Description | Source |
|-------|-------------|--------|
| Accepted Proposal | Partner clicks "Start Planning" on accepted date proposal | `DateProposalsList.tsx` |
| Active Invitation | User resumes an existing collaborative session | `Invitations.tsx` |

**Important**: Direct navigation to `/plan-date` without valid session data redirects to `/home` (see `SmartDatePlanning.tsx` lines 149-153).

---

## Phase 1: Session Initialization

```text
┌─────────────────────────────────────────┐
│         SmartDatePlanning Page          │
│  (Entry from accepted proposal only)    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Check Session  │
        │   Validity      │
        └────────┬────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Expired │ │ Invalid │ │  Valid  │
│ Session │ │ Session │ │ Session │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     ▼           ▼           │
┌─────────────────────┐      │
│  Session Recovery   │      │
│     Guardrail       │      │
│  (Look for active   │      │
│   session first)    │      │
└─────────┬───────────┘      │
          │                  │
          ▼                  │
   ┌──────────────┐          │
   │ Found Active │──────────┤
   │   Session?   │          │
   └──────┬───────┘          │
          │ No               │
          ▼                  │
   ┌──────────────┐          │
   │ Create Fresh │          │
   │   Session    │          │
   └──────┬───────┘          │
          │                  │
          └──────────────────┤
                             │
                             ▼
              ┌──────────────────────────┐
              │   SmartDatePlanner       │
              │ (Collaborative Mode)     │
              └────────────┬─────────────┘
```

### Session Recovery Logic

**Source**: `SmartDatePlanning.tsx` (lines 55-145)

| Check | Action |
|-------|--------|
| Session expired | Look for existing active session with same partner |
| Session completed | Create fresh session |
| Session inactive | Mark as processed via `sessionStorage`, attempt recovery |
| User missing preferences | Trigger preference inheritance from `user_preferences` table |

**Session Storage Markers**:
- `guardrail-{sessionId}`: Prevents infinite redirect loops
- `inherit-{sessionId}-{userId}`: Tracks preference inheritance attempts

---

## Phase 2: Preference Collection (4-Step Flow)

```text
┌─────────────────────────────────────────────────────────────┐
│                    PreferencesStep Component                │
│                                                             │
│  Step 1: Food & Vibe     Step 2: Budget & Timing           │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ • Cuisines      │ ──► │ • Price Range   │               │
│  │ • Vibes         │     │ • Time Prefs    │               │
│  │ • Quick Start   │     │ • Date/Time     │               │
│  └─────────────────┘     └────────┬────────┘               │
│                                   │                         │
│  Step 3: Distance & Diet     Step 4: Review                │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ • Max Distance  │ ──► │ • Summary       │               │
│  │ • Dietary Reqs  │     │ • Partner Match │               │
│  └─────────────────┘     │ • Submit        │               │
│                          └────────┬────────┘               │
└───────────────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │  Save to Database  │
                         │  (user_preferences │
                         │   + session flags) │
                         └─────────┬──────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  Real-time Broadcast         │
                    │  (Postgres Changes Channel)  │
                    └──────────────┬───────────────┘
```

### Database Updates

**Tables Modified**:
1. `user_preferences` - Stores user's preference selections
2. `date_planning_sessions` - Updates preference flags:
   - `initiator_preferences` / `partner_preferences` (JSON)
   - `initiator_preferences_complete` / `partner_preferences_complete` (boolean)
   - `both_preferences_complete` (boolean)

---

## Phase 3: Collaborative Waiting & AI Analysis

```text
                    ┌────────────────────────────┐
                    │  Check Preference Status   │
                    └─────────────┬──────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ User Not Set     │   │ User Complete,   │   │ Both Complete    │
│ (Show Form)      │   │ Partner Pending  │   │                  │
└──────────────────┘   └────────┬─────────┘   └────────┬─────────┘
                                │                      │
                                ▼                      │
                    ┌──────────────────────┐           │
                    │ CollaborativeWaiting │           │
                    │      State           │           │
                    │ (Real-time monitor)  │           │
                    └──────────┬───────────┘           │
                               │                       │
           ┌───────────────────┴───────────────────────┤
           │                                           │
           ▼                                           ▼
┌─────────────────────┐                    ┌─────────────────────┐
│  Partner Submits    │                    │  Trigger AI         │
│  (via real-time)    │                    │  Analysis           │
└─────────┬───────────┘                    └─────────┬───────────┘
          │                                          │
          └────────────────────┬─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────────┐
                    │      AI Analysis Pipeline       │
                    │                                 │
                    │  1. analyze-compatibility       │
                    │     (Edge Function)             │
                    │  2. search-venues               │
                    │     (Foursquare API)            │
                    │  3. Score & rank venues         │
                    │                                 │
                    └─────────────┬───────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ▼                                       ▼
    ┌─────────────────┐                   ┌─────────────────────┐
    │  Success        │                   │  Timeout (10s)      │
    │  (venues found) │                   │  Fallback Path      │
    └────────┬────────┘                   └──────────┬──────────┘
             │                                       │
             │                                       ▼
             │                            ┌─────────────────────┐
             │                            │ Proceed with        │
             │                            │ available venues    │
             │                            │ (may be 0)          │
             │                            └──────────┬──────────┘
             │                                       │
             └───────────────────┬───────────────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ Auto-Navigate to    │
                      │ Results (2s delay)  │
                      └─────────────────────┘
```

### Timeout Fallback

**Source**: `PreferencesStep.tsx` (lines 101-105, 249-276)

| Constant | Value | Purpose |
|----------|-------|---------|
| `NAVIGATION_TIMEOUT_MS` | 10,000ms | Maximum wait time for AI analysis |
| `timeoutRef` | React ref | Tracks timeout timer |
| `timeoutTriggered` | Boolean state | Indicates fallback was used |

**Behavior**: If AI analysis takes longer than 10 seconds, the system proceeds to venue results with whatever venues are available (potentially 0).

### Real-time Channels

**Source**: `useCollaborativeSession.ts`, `useSessionRealtime.ts`

| Channel Pattern | Purpose |
|-----------------|---------|
| `collab-session-{sessionId}-{userId}` | Session updates for collaborative flow |
| `session-realtime-{sessionId}` | Generic session monitoring |

---

## Phase 4: Venue Selection & Invitation

```text
                    ┌────────────────────────┐
                    │    PlanTogether        │
                    │  (Venue Grid View)     │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  User Selects Venue    │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  InvitationCreation    │
                    │  • Message composer    │
                    │  • Venue details       │
                    │  • Send invitation     │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Session Completed     │
                    │  (status = completed)  │
                    └────────────────────────┘
```

### Venue Display

**Source**: `PlanTogether.tsx`

- Grid View with `AIVenueCard` components
- Map View with clustered markers
- Sorting options: AI Score, Drive Time, Walk Time, Distance
- Pre-fetched travel times from user's home location

---

## Technical Implementation Details

### Key Files

| Component | File | Purpose |
|-----------|------|---------|
| Page Entry | `src/pages/SmartDatePlanning.tsx` | Route handler, session validation |
| Main Planner | `src/components/SmartDatePlanner.tsx` | Orchestrates planning steps |
| Preferences | `src/components/date-planning/PreferencesStep.tsx` | 4-step preference form |
| Waiting State | `src/components/date-planning/CollaborativeWaitingState.tsx` | Partner sync UI |
| Venue Grid | `src/components/date-planning/PlanTogether.tsx` | Venue selection |
| Invitation | `src/components/date-planning/InvitationCreation.tsx` | Message & send |

### Hooks

| Hook | Purpose |
|------|---------|
| `useCollaborativeSession` | Manages collaborative session state |
| `useSessionManagement` | Creates/finds planning sessions |
| `useSessionRealtime` | Real-time subscription management |
| `useDateProposals` | Proposal CRUD operations |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `analyze-compatibility` | Calculates compatibility scores between users |
| `search-venues` | Queries Foursquare API for venue matches |
| `ai-venue-recommendations` | Optional AI reasoning enhancement |

---

## Preference Validation

The system validates preference consistency across the session:

1. Check if `initiator_preferences_complete` flag matches actual `initiator_preferences` data
2. Check if `partner_preferences_complete` flag matches actual `partner_preferences` data
3. Recalculate `both_preferences_complete` based on actual data presence
4. Detect and log (but not auto-reset) preference duplication between users

---

## Deprecated Features

### Solo Mode (Removed)

The original implementation included a "Solo Mode" path where users could plan dates independently. This has been deprecated:

**Source**: `SmartDatePlanner.tsx` (line 81)
```typescript
planningMode: 'collaborative', // Force collaborative mode only
```

All date planning now requires a partner selection and collaborative preference setting.
