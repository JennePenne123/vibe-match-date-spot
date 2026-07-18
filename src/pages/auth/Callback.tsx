import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * OAuth callback landing page.
 *
 * Supabase's `detectSessionInUrl: true` parses either the hash-fragment
 * (`#access_token=...`) or the PKCE `?code=...` query param automatically.
 * We wait for either the session to appear OR an error, then route.
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

    const finish = async () => {
      try {
        // If PKCE code is present, exchange it explicitly.
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errParam = url.searchParams.get('error_description') || url.searchParams.get('error');

        if (errParam) {
          setError(errParam);
          setTimeout(() => navigate('/?auth=required', { replace: true }), 2000);
          return;
        }

        if (code) {
          const { data: existing } = await supabase.auth.getSession();
          if (existing.session?.user) {
            if (!cancelled) navigate('/home', { replace: true });
            return;
          }

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError && !cancelled) {
            const { data: recovered } = await supabase.auth.getSession();
            if (recovered.session?.user) {
              navigate('/home', { replace: true });
              return;
            }

            console.error('OAuth exchange failed:', exchangeError);
            setError(exchangeError.message);
            setTimeout(() => navigate('/?auth=required', { replace: true }), 2000);
            return;
          }
        }

        // Give detectSessionInUrl a moment to process the hash fragment.
        for (let i = 0; i < 20; i++) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            if (!cancelled) navigate('/home', { replace: true });
            return;
          }
          await new Promise(r => setTimeout(r, 150));
        }

        if (!cancelled) {
          setError('Session konnte nicht hergestellt werden. Bitte erneut versuchen.');
          setTimeout(() => navigate('/?auth=required', { replace: true }), 2000);
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        if (!cancelled) {
          setError(err?.message ?? 'Unbekannter Fehler');
          setTimeout(() => navigate('/?auth=required', { replace: true }), 2000);
        }
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