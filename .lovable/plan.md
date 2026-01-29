

# Implement Social Login (OAuth)

## Overview

This plan adds Google and Apple OAuth sign-in options to the existing `AuthModal.tsx` component. The authentication infrastructure already supports OAuth through Supabase, and the `handle_new_user` trigger is already configured to extract user metadata (name, avatar) from OAuth providers.

---

## Current State

| Component | Status |
|-----------|--------|
| Supabase Client | Configured with `detectSessionInUrl: true` |
| AuthModal | Email/password only |
| Profile Trigger | Already handles OAuth metadata (`name`, `full_name`, `avatar_url`) |
| Auth State Hook | Already handles OAuth sessions via `onAuthStateChange` |
| User Profile Helper | Already extracts avatar from OAuth metadata |

---

## Implementation Plan

### 1. Add OAuth Functions to Auth Service

**File**: `src/services/authService.ts`

Add new functions for OAuth sign-in:

```typescript
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/home`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
};

export const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/home`,
    },
  });
  return { data, error };
};
```

---

### 2. Update Auth Context

**File**: `src/contexts/AuthContext.tsx`

Add OAuth methods to the context:

```typescript
interface AuthContextType {
  // ... existing methods
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithApple: () => Promise<{ data: any; error: any }>;
}
```

---

### 3. Update AuthModal UI

**File**: `src/components/landing/AuthModal.tsx`

Add social login buttons with proper styling:

**Visual Layout:**
```text
┌────────────────────────────────────┐
│         Welcome Back               │
│   Sign in to continue your journey │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  🔵  Continue with Google    │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  🍎  Continue with Apple     │  │
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│        ── or continue with ──       │
├────────────────────────────────────┤
│  Email: [________________]         │
│  Password: [_______________]       │
│  [        Sign In        ]         │
├────────────────────────────────────┤
│  Don't have an account? Sign up    │
└────────────────────────────────────┘
```

**New UI Elements:**
- Google button with brand colors (white bg, colored logo)
- Apple button with brand styling (black bg in light mode, white in dark mode)
- Divider with "or continue with" text
- Loading states for each OAuth provider
- Error handling for OAuth failures

---

### 4. Handle OAuth Callback

The existing `useAuthState.ts` hook already handles OAuth callbacks through `supabase.auth.onAuthStateChange`. When a user returns from OAuth:

1. Supabase detects the OAuth callback in the URL (`detectSessionInUrl: true`)
2. `onAuthStateChange` fires with `SIGNED_IN` event
3. `fetchUserProfile` is called to get/create profile
4. The `handle_new_user` trigger extracts name/avatar from OAuth metadata

**No changes needed** - the existing flow handles OAuth users automatically.

---

### 5. Update Referral Code Handling for OAuth

For OAuth signup, referral codes need special handling since users don't fill out a form:

1. Store referral code in localStorage before OAuth redirect
2. Check for stored code after OAuth callback
3. Process referral if valid

**Add to `AuthModal.tsx`:**
```typescript
// Before OAuth redirect
if (referralCode && referralValid) {
  localStorage.setItem('pendingReferralCode', referralCode);
}

// After OAuth success (in useEffect)
const pendingReferral = localStorage.getItem('pendingReferralCode');
if (pendingReferral && user) {
  processReferralSignup(pendingReferral, user.id);
  localStorage.removeItem('pendingReferralCode');
}
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/services/authService.ts` | Edit | Add `signInWithGoogle` and `signInWithApple` functions |
| `src/contexts/AuthContext.tsx` | Edit | Expose OAuth methods in context |
| `src/components/landing/AuthModal.tsx` | Edit | Add OAuth buttons, divider, loading states, referral handling |

---

## OAuth Button Styling

**Google Button:**
```css
bg-white dark:bg-slate-800 
border border-border 
hover:bg-gray-50 dark:hover:bg-slate-700
text-foreground
```

**Apple Button:**
```css
bg-black dark:bg-white 
text-white dark:text-black
hover:opacity-90
```

**Both buttons:**
- Height: `h-12` (matching existing form elements)
- Full width
- Rounded corners matching design system
- Loader2 spinner when loading

---

## OAuth Providers Iconography

Since lucide-react doesn't include brand icons, we'll use inline SVG for the Google and Apple logos:

**Google "G" Icon** (multicolor):
```svg
<svg viewBox="0 0 24 24" width="20" height="20">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
```

**Apple Icon**:
```svg
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
</svg>
```

---

## User Setup Requirements

Before social login will work, the user must configure OAuth providers in their Supabase dashboard:

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URL: `https://dfjwubatslzblagthbdw.supabase.co/auth/v1/callback`
4. Add client ID and secret in Supabase Dashboard > Authentication > Providers > Google

### Apple OAuth Setup
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Create a Services ID for Sign in with Apple
3. Configure redirect URL: `https://dfjwubatslzblagthbdw.supabase.co/auth/v1/callback`
4. Add credentials in Supabase Dashboard > Authentication > Providers > Apple

### Supabase URL Configuration
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Set Site URL: `https://id-preview--4f7c4b2f-eda1-456f-9ad5-810c6a818ded.lovable.app`
3. Add Redirect URLs:
   - `https://id-preview--4f7c4b2f-eda1-456f-9ad5-810c6a818ded.lovable.app/home`
   - `https://id-preview--4f7c4b2f-eda1-456f-9ad5-810c6a818ded.lovable.app`

---

## Error Handling

OAuth can fail for various reasons. The modal will handle:

| Error | User Message |
|-------|--------------|
| `access_denied` | "Sign in was cancelled" |
| `invalid_request` | "Unable to connect to provider. Please try again." |
| Network timeout | "Connection timed out. Please try again." |
| Generic error | "An error occurred. Please try email sign in." |

---

## Security Considerations

1. **State Parameter**: Supabase automatically includes CSRF protection via state parameter
2. **PKCE Flow**: Supabase uses PKCE for OAuth which is more secure than implicit flow
3. **Token Storage**: OAuth tokens are securely stored by Supabase client
4. **Profile Creation**: The `handle_new_user` trigger runs with SECURITY DEFINER to safely create profiles

---

## Testing Checklist

After implementation:
- [ ] Google sign-in redirects to Google
- [ ] After Google auth, user is redirected to `/home`
- [ ] Profile is created with Google name and avatar
- [ ] Apple sign-in works (requires Apple Developer account)
- [ ] Referral codes work with OAuth signup
- [ ] Error states display correctly
- [ ] Loading states show during OAuth redirect
- [ ] Dark mode styling looks correct
- [ ] Existing email/password flow still works

