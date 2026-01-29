

# Application Gap Analysis & Feature Suggestions

## Executive Summary

After scanning the entire codebase, I've identified **missing features**, **incomplete implementations**, **security concerns**, and **opportunities for enhancement**. This analysis covers user experience gaps, missing pages, backend improvements, and strategic features that would significantly improve the application.

---

## Current Application Overview

| Area | Status |
|------|--------|
| Core Date Planning | Implemented (collaborative mode) |
| AI Recommendations | Functional (hybrid scoring) |
| Venue Discovery | Basic implementation |
| User Authentication | Email/password only |
| Gamification | Points, badges, referrals |
| Partner Portal | Basic dashboard |
| Push Notifications | Infrastructure ready, not fully configured |
| Test Coverage | 69% for AI service |

---

## Critical Missing Features

### 1. Account Settings Page

**Current State**: No dedicated settings page exists. Users can only:
- Edit name/email in Profile (inline)
- Toggle theme in Profile
- Sign out

**Missing**:
- Password change functionality
- Account deletion
- Email notification preferences
- Push notification toggle
- Privacy settings
- Data export (GDPR compliance)
- Connected accounts management

**Impact**: High - Users expect account management capabilities

---

### 2. Social Login (OAuth)

**Current State**: Only email/password authentication in `AuthModal.tsx`

**Missing**:
- Google Sign-In
- Apple Sign-In
- Social account linking

**Impact**: High - Significantly reduces signup friction

---

### 3. Date History / Past Dates Page

**Current State**: 
- `UpcomingDatesCard.tsx` shows upcoming dates
- `Invitations.tsx` shows all invitations
- No dedicated "past dates" or "history" view

**Missing**:
- Past dates archive with filtering
- Date memories/photos
- Statistics over time
- "This time last year" reminisces

**Impact**: Medium - Important for engagement and AI learning

---

### 4. Venue Booking/Reservation Integration

**Current State**: "Make Reservation" button in `VenueDetail.tsx` is non-functional

**Missing**:
- OpenTable/Resy integration
- Direct booking links
- In-app reservation tracking
- Booking confirmation storage

**Impact**: High - Core functionality for date planning

---

### 5. In-App Messaging System

**Current State**:
- `invitation_messages` table exists
- `InvitationMessenger.tsx` component exists
- Limited to invitation context

**Missing**:
- General friend-to-friend messaging
- Message notifications
- Read receipts
- Message history outside invitations

**Impact**: Medium - Would increase engagement

---

### 6. Notification Preferences UI

**Current State**:
- `push_subscriptions` table exists
- `usePushNotifications.ts` hook exists
- `PushNotificationPrompt.tsx` shows one-time prompt
- **VAPID_PUBLIC_KEY is empty** (line 7 in `usePushNotifications.ts`)

**Missing**:
- Notification settings page
- Granular notification controls
- Email notification preferences
- Push notification configuration

**Impact**: High - Push notifications won't work without VAPID key

---

### 7. Partner Onboarding Flow

**Current State**: 
- Basic partner dashboard at `/partner`
- Manual role assignment required
- No venue claiming process

**Missing** (per roadmap in memory):
- Multi-step partner signup wizard
- Venue claiming/verification
- Business verification
- Terms acceptance flow

**Impact**: High - Critical for venue partner growth

---

### 8. Internationalization (i18n)

**Current State**: All strings hardcoded in English

**Missing**:
- Translation framework
- Language selector
- Locale-aware formatting
- RTL support

**Impact**: Medium - Limits global reach

---

### 9. Analytics/Event Tracking

**Current State**: 
- `api_usage_logs` table exists for API tracking
- No user behavior analytics

**Missing**:
- User journey tracking
- Conversion funnels
- Feature usage metrics
- Admin analytics dashboard

**Impact**: Medium - Important for product decisions

---

## Security Concerns (from Linter)

| Issue | Severity | Count |
|-------|----------|-------|
| Anonymous Access Policies | WARN | 20+ |
| RLS Policy Always True | WARN | 2 |
| Extension in Public | WARN | 1 |

**Recommended Actions**:
1. Review all RLS policies allowing anonymous access
2. Restrict `USING (true)` policies to authenticated users
3. Move extensions out of public schema

---

## Incomplete Implementations

### Test Coverage Gaps

| File | Tests | Priority |
|------|-------|----------|
| `fetching.ts` | 0 | HIGH |
| `recommendations.ts` | 0 | MEDIUM |
| `getUserLearnedWeights` | 0 | MEDIUM |

Estimated effort: ~6 hours to reach 100% function coverage

---

### Partner Portal

Current pages:
- `/partner` - Dashboard (static metrics)
- `/partner/vouchers` - Voucher management
- `/partner/venues` - Venue management

Missing:
- Analytics with real data (currently shows 0s)
- Venue claiming workflow
- Partner support/help section
- Payout/billing information

---

## UI/UX Improvements

### Profile Page
- Still uses `bg-gray-50` instead of design system tokens
- Missing integration with modern design system

### Venue Detail Page
- Uses `bg-gray-50` (line 46) - not aligned with dark theme
- "Make Reservation" button is non-functional
- No photo gallery component active

### My Friends Page
- Uses old sage/terracotta color scheme (lines 82-95)
- Should use Modern Design System colors

---

## Recommended Feature Prioritization

### Phase 1: Critical (1-2 weeks)
1. **Account Settings Page** - Password change, delete account, notification preferences
2. **Configure Push Notifications** - Add VAPID key, enable real push
3. **Social Login** - Google OAuth minimum

### Phase 2: High Value (2-4 weeks)
4. **Venue Booking Integration** - OpenTable API or deep links
5. **Partner Onboarding Flow** - Multi-step wizard for venue partners
6. **Date History Page** - Archive and statistics

### Phase 3: Enhancement (4-6 weeks)
7. **In-App Messaging** - Extend beyond invitation context
8. **Analytics Dashboard** - User behavior tracking
9. **Internationalization** - Start with German (Hamburg-based)

### Phase 4: Scale (6+ weeks)
10. **AI Recommendation Tests** - Complete test coverage
11. **RLS Policy Hardening** - Security audit
12. **Admin Dashboard** - User management, system health

---

## Technical Debt Items

| Item | Location | Effort |
|------|----------|--------|
| Update Profile page to use design system | `Profile.tsx` | 2 hours |
| Update VenueDetail to use design system | `VenueDetail.tsx` | 2 hours |
| Update MyFriends colors | `MyFriends.tsx` | 1 hour |
| Add VAPID key configuration | `usePushNotifications.ts` | 1 hour |
| Complete test coverage | `aiVenueService/` | 6 hours |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Settings.tsx` | Account settings page |
| `src/pages/DateHistory.tsx` | Past dates archive |
| `src/components/settings/NotificationSettings.tsx` | Notification preferences |
| `src/components/settings/AccountSettings.tsx` | Password, delete, privacy |
| `src/components/settings/ConnectedAccounts.tsx` | OAuth management |
| `src/pages/partner/Onboarding.tsx` | Partner signup wizard |

---

## Summary

The application has a solid foundation with the core date planning flow working well. The main gaps are:

1. **User Account Management** - No settings page, password change, or account deletion
2. **Authentication Options** - No social login
3. **Push Notifications** - Infrastructure exists but VAPID key missing
4. **Partner Growth** - No self-service onboarding
5. **Booking Integration** - Core action button is non-functional
6. **Design Consistency** - Some pages still use old color schemes

Addressing these gaps would significantly improve user experience and prepare the application for scale.
