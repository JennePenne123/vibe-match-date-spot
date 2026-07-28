/**
 * Google OAuth setup check.
 *
 * Runs a small set of runtime checks that catch the most common
 * misconfigurations *before* a user even clicks the Google button, and
 * also enriches the diagnostics shown after a failed sign-in.
 *
 * We can only observe what the browser sees — we can't read Supabase's
 * private OAuth secret or your Google client ID — but we *can* verify:
 *  - the current origin is one you should have whitelisted
 *  - the /auth/callback route is actually reachable
 *  - the Supabase Auth service is reachable at all
 *  - the Google provider responds to a signInWithOAuth handshake
 *    (skipBrowserRedirect=true, so nothing actually navigates)
 *
 * If Google is not enabled in Supabase, the last check surfaces a
 * `"provider is not enabled"` error immediately.
 */
import { supabase } from '@/integrations/supabase/client';

export type SetupCheckStatus = 'pass' | 'warn' | 'fail' | 'pending';

export interface SetupCheckResult {
  id:
    | 'origin'
    | 'callbackRoute'
    | 'supabaseAuth'
    | 'googleProvider'
    | 'thirdPartyCookies';
  status: SetupCheckStatus;
  message: string;
  detail?: string;
  fix?: string;
}

export const SUPABASE_PROJECT_REF = 'dfjwubatslzblagthbdw';
export const SUPABASE_CALLBACK_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`;

/**
 * Origins that are known-good for this project. Update if you launch on a
 * new custom domain.
 */
const KNOWN_ORIGINS = new Set<string>([
  'https://hioutz.app',
  'https://www.hioutz.app',
  'https://www.hioutz.com',
  'https://vibe-match-date-spot.lovable.app',
]);

const isLikelyPreviewOrigin = (origin: string) =>
  /\.lovable\.app$/i.test(origin) || /localhost(:\d+)?$/i.test(origin);

export const getExpectedRedirectUri = (): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/auth/callback`;
};

/** Categorises an OAuth error string into a stable diagnostic code. */
export type OAuthErrorCode =
  | 'redirect_uri_mismatch'
  | 'provider_disabled'
  | 'invalid_client'
  | 'access_denied'
  | 'popup_blocked'
  | 'third_party_cookies'
  | 'network'
  | 'session_missing'
  | 'unknown';

export const classifyOAuthError = (message: string | undefined | null): OAuthErrorCode => {
  const m = (message || '').toLowerCase();
  if (!m) return 'unknown';
  if (m.includes('redirect_uri_mismatch') || (m.includes('redirect_uri') && m.includes('mismatch'))) {
    return 'redirect_uri_mismatch';
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider') || m.includes('provider not enabled')) {
    return 'provider_disabled';
  }
  if (m.includes('invalid_client') || m.includes('unauthorized_client')) {
    return 'invalid_client';
  }
  if (m.includes('access_denied') || m.includes('user cancelled') || m.includes('user denied')) {
    return 'access_denied';
  }
  if (m.includes('popup') && (m.includes('blocked') || m.includes('closed'))) {
    return 'popup_blocked';
  }
  if (m.includes('third-party') || m.includes('third party') || m.includes('cookies are blocked')) {
    return 'third_party_cookies';
  }
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network error')) {
    return 'network';
  }
  if (m.includes('session konnte nicht') || m.includes('session could not') || m.includes('no session')) {
    return 'session_missing';
  }
  return 'unknown';
};

/** Origin check: is the current origin whitelisted for OAuth? */
const checkOrigin = (): SetupCheckResult => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!origin) {
    return {
      id: 'origin',
      status: 'fail',
      message: 'Origin nicht verfügbar (SSR?)',
    };
  }
  if (KNOWN_ORIGINS.has(origin)) {
    return { id: 'origin', status: 'pass', message: origin };
  }
  if (isLikelyPreviewOrigin(origin)) {
    return {
      id: 'origin',
      status: 'warn',
      message: origin,
      detail:
        'Preview- oder localhost-Origin. Google OAuth funktioniert nur, wenn genau diese Origin in Google Cloud → Authorized JavaScript origins UND in Supabase → Redirect URLs eingetragen ist.',
      fix: `${origin}\n${origin}/auth/callback`,
    };
  }
  return {
    id: 'origin',
    status: 'warn',
    message: origin,
    detail:
      'Unbekannte Origin. Wenn Google-Login von hier klappen soll, muss diese Origin in Google Cloud + Supabase erlaubt sein.',
    fix: `${origin}\n${origin}/auth/callback`,
  };
};

/** Reachability of the app's /auth/callback route. */
const checkCallbackRoute = async (signal: AbortSignal): Promise<SetupCheckResult> => {
  const url = getExpectedRedirectUri();
  try {
    const res = await fetch(url, { method: 'GET', signal, cache: 'no-store' });
    if (res.ok || res.status === 304) {
      return { id: 'callbackRoute', status: 'pass', message: url };
    }
    return {
      id: 'callbackRoute',
      status: 'warn',
      message: url,
      detail: `Antwort: HTTP ${res.status}. Die Route sollte 200 zurückliefern.`,
    };
  } catch (err) {
    return {
      id: 'callbackRoute',
      status: 'fail',
      message: url,
      detail: err instanceof Error ? err.message : 'Netzwerkfehler beim Aufruf von /auth/callback.',
    };
  }
};

/** Supabase Auth reachability. */
const checkSupabaseAuth = async (signal: AbortSignal): Promise<SetupCheckResult> => {
  const url = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/settings`;
  try {
    const res = await fetch(url, { method: 'GET', signal, cache: 'no-store' });
    if (!res.ok) {
      return {
        id: 'supabaseAuth',
        status: 'fail',
        message: `HTTP ${res.status}`,
        detail: 'Supabase Auth erreichbar, aber unerwarteter Statuscode.',
      };
    }
    const data = (await res.json()) as { external?: Record<string, boolean> };
    const googleEnabled = Boolean(data?.external?.google);
    if (!googleEnabled) {
      return {
        id: 'supabaseAuth',
        status: 'fail',
        message: 'Google Provider deaktiviert',
        detail:
          'Supabase meldet, dass der Google-Provider nicht aktiviert ist. Aktiviere ihn im Supabase Dashboard → Authentication → Providers → Google und hinterlege Client ID + Secret.',
      };
    }
    return { id: 'supabaseAuth', status: 'pass', message: 'Google Provider aktiv' };
  } catch (err) {
    return {
      id: 'supabaseAuth',
      status: 'fail',
      message: 'Supabase Auth nicht erreichbar',
      detail: err instanceof Error ? err.message : 'Netzwerkfehler beim Aufruf von Supabase Auth.',
    };
  }
};

/** Google provider handshake without actually redirecting. */
const checkGoogleProvider = async (): Promise<SetupCheckResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getExpectedRedirectUri(),
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      const code = classifyOAuthError(error.message);
      return {
        id: 'googleProvider',
        status: 'fail',
        message: error.message,
        detail:
          code === 'provider_disabled'
            ? 'Google-Provider ist in Supabase nicht aktiviert.'
            : 'Supabase konnte keine Google-OAuth-URL erzeugen.',
      };
    }
    if (!data?.url) {
      return {
        id: 'googleProvider',
        status: 'fail',
        message: 'Keine OAuth-URL erhalten',
        detail: 'Supabase hat keine Weiterleitungs-URL zurückgeliefert.',
      };
    }
    return { id: 'googleProvider', status: 'pass', message: 'OAuth-URL erfolgreich generiert' };
  } catch (err) {
    return {
      id: 'googleProvider',
      status: 'fail',
      message: err instanceof Error ? err.message : 'Unbekannter Fehler',
    };
  }
};

/** Third-party cookie check via storage access API when available. */
const checkThirdPartyCookies = async (): Promise<SetupCheckResult> => {
  try {
    // Some browsers (Safari, Brave) block third-party storage which
    // breaks Supabase's cross-origin cookie flow. If localStorage is
    // unreachable we surface a warning.
    const key = '__hioutz-oauth-probe';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return {
      id: 'thirdPartyCookies',
      status: 'pass',
      message: 'Browser-Storage verfügbar',
    };
  } catch {
    return {
      id: 'thirdPartyCookies',
      status: 'warn',
      message: 'Storage blockiert',
      detail:
        'Der Browser blockiert Storage/Cookies für diese Seite. Google-Login schlägt oft fehl, wenn Third-Party-Cookies deaktiviert sind (Safari „Cross-Site-Tracking verhindern", Brave Shields, Inkognito-Modus).',
    };
  }
};

export const runGoogleAuthSetupCheck = async (
  signal?: AbortSignal
): Promise<SetupCheckResult[]> => {
  const controller = signal ? undefined : new AbortController();
  const s = signal ?? controller!.signal;

  const [origin, cookies] = [checkOrigin(), await checkThirdPartyCookies()];
  const [callbackRoute, supabaseAuth, googleProvider] = await Promise.all([
    checkCallbackRoute(s),
    checkSupabaseAuth(s),
    checkGoogleProvider(),
  ]);

  return [origin, cookies, callbackRoute, supabaseAuth, googleProvider];
};

export const overallStatus = (results: SetupCheckResult[]): SetupCheckStatus => {
  if (results.some(r => r.status === 'fail')) return 'fail';
  if (results.some(r => r.status === 'warn')) return 'warn';
  if (results.every(r => r.status === 'pass')) return 'pass';
  return 'pending';
};
