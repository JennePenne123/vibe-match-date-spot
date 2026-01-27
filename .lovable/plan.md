

# Updated Date Planning Flow Documentation

## Overview
This plan creates an accurate flowchart documentation file that reflects the actual implemented architecture, removing the deprecated Solo Mode and adding the session recovery and timeout fallback mechanisms that exist in the codebase.

## Key Changes from Original Flowchart

### Removed: Solo Mode Branch
The original flowchart showed a "Solo Mode" path, but the implementation in `SmartDatePlanner.tsx` (line 80) explicitly forces `planningMode: 'collaborative'`:
```typescript
planningMode: 'collaborative', // Force collaborative mode only
```

### Added: Session Recovery Guards
From `SmartDatePlanning.tsx` (lines 50-90) and `SmartDatePlanner.tsx` (lines 202-228):
- Session validity checking (expired, completed, inactive states)
- Automatic preference inheritance attempts
- Active session lookup before creating new sessions
- Session guardrail processing with `sessionStorage` markers

### Added: Timeout Fallback Path
From `PreferencesStep.tsx` (lines 101-105, 249-276):
- 10-second navigation timeout (`NAVIGATION_TIMEOUT_MS = 10000`)
- Timeout fallback triggers venue display even with incomplete venue loading
- Prevents users from being stuck in waiting states

### Added: Real-time Sync Mechanisms
From `useCollaborativeSession.ts` and `useSessionRealtime.ts`:
- Postgres real-time channel subscriptions
- Preference flag consistency validation
- Automatic AI analysis triggering when both users complete

---

## New Flow Architecture

### Entry Points
1. **From Accepted Proposal** → Partner clicks "Start Planning" on accepted date proposal
2. **From Active Invitation** → User resumes an existing collaborative session

### Phase 1: Session Initialization

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

### Phase 2: Preference Collection (4-Step Flow)

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
│  Step 3: Distance & Diet Step 4: Review                    │
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

### Phase 3: Collaborative Waiting & AI Analysis

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
                      └─────────┬───────────┘
```

### Phase 4: Venue Selection & Invitation

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

---

## Technical Implementation Details

### Session Recovery Logic (SmartDatePlanning.tsx)

| Check | Action |
|-------|--------|
| Session expired | Look for existing active session with same partner |
| Session completed | Create fresh session |
| Session inactive | Mark as processed, attempt recovery |
| User missing preferences | Trigger preference inheritance from `user_preferences` table |

### Timeout Fallback (PreferencesStep.tsx)

| Constant | Value | Purpose |
|----------|-------|---------|
| `NAVIGATION_TIMEOUT_MS` | 10,000ms | Maximum wait time for AI analysis |
| `timeoutRef` | React ref | Tracks timeout timer |
| `timeoutTriggered` | Boolean state | Indicates fallback was used |

### Real-time Channels

| Channel | Purpose |
|---------|---------|
| `collab-session-{sessionId}-{userId}` | Session updates for collaborative flow |
| `session-realtime-{sessionId}` | Generic session monitoring |

### Preference Validation

The system validates preference consistency:
1. Check if `initiator_preferences_complete` flag matches actual `initiator_preferences` data
2. Check if `partner_preferences_complete` flag matches actual `partner_preferences` data
3. Recalculate `both_preferences_complete` based on actual data presence
4. Detect and log (but not auto-reset) preference duplication between users

---

## File to Create

**Path**: `docs/date-planning-flow.md`

This documentation file will contain:
1. The updated flow diagrams above
2. Technical implementation notes
3. Cross-references to source files
4. Changelog noting removal of Solo Mode and addition of recovery mechanisms

