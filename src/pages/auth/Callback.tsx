import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hasCompletedPreferenceSetup } from '@/utils/preferenceCompletion';

/**
 * OAuth callback landing page.
 *
 * Supabase's `detectSessionInUrl: true` parses the provider redirect URL and
 * persists the session on client initialization. This component must not call
 * `exchangeCodeForSession` manually, otherwise the OAuth code/code-verifier can
 * be consumed twice and users get dropped back to the login screen.
 *
 * This page is intentionally minimal — no auth guards, no redirects
 * from other hooks — so the OAuth token exchange can complete cleanly
 * before any route protection kicks in.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const showErrorAndReturn = (message: string) => {
      if (cancelled) return;
      setError(message);
      try {
        sessionStorage.setItem(
          'hioutz-oauth-error',
          JSON.stringify({ provider: 'google', message, ts: Date.now() })
        );
      } catch {
        /* ignore storage errors */
      }
      window.setTimeout(() => {
        if (!cancelled) navigate('/?auth=required', { replace: true });
      }, 2500);
    };

    const finish = async () => {
      const url = new URL(window.location.href);
      const errParam = url.searchParams.get('error_description') || url.searchParams.get('error');

      if (errParam) {
        showErrorAndReturn(errParam);
        return;
      }

      const routeForUser = async (user: { id: string }) => {
        // Route to onboarding only when the user's preference setup is still empty.
        // This covers first-time Google sign-ins AND any returning user who never
        // finished onboarding — completed users always go straight to /home.
        try {
          const { data } = await supabase
            .from('user_preferences')
            .select(
              'preferred_cuisines, preferred_vibes, preferred_times, preferred_price_range, ' +
              'preferred_activities, preferred_entertainment, preferred_venue_types, ' +
              'preferred_duration, dietary_restrictions, accessibility_needs, ' +
              'home_address, home_latitude, home_longitude, personality_traits, relationship_goal'
            )
            .eq('user_id', user.id)
            .maybeSingle();

          const completed = hasCompletedPreferenceSetup(data as any);
          navigate(completed ? '/home' : '/welcome', { replace: true });
        } catch {
          navigate('/home', { replace: true });
        }
      };

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          void routeForUser(session.user);
        }
      });

      try {
        // Wait until Supabase has finished its own URL/session initialization.
        for (let i = 0; i < 40; i++) {
          const { data, error: sessionError } = await supabase.auth.getSession();

          if (cancelled) return;

          if (sessionError) {
            throw sessionError;
          }

          if (data.session?.user) {
            await routeForUser(data.session.user);
            return;
          }

          await new Promise(r => window.setTimeout(r, 150));
        }

        showErrorAndReturn('Session konnte nicht hergestellt werden. Bitte erneut versuchen.');
      } catch (err) {
        const authError = err as AuthError | Error;
        console.error('Auth callback error:', authError);
        showErrorAndReturn(authError?.message ?? 'Unbekannter Fehler');
      } finally {
        listener.subscription.unsubscribe();
      }
    };

    void finish();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-10 h-10 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          {error ? `Fehler: ${error}` : 'Anmeldung wird abgeschlossen …'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;