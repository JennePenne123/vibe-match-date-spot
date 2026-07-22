import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Server-side admin guard.
 *
 * Does NOT trust client role state. Every mount:
 *  1) revalidates the session via `supabase.auth.getUser()` (hits the Auth server)
 *  2) calls the SECURITY DEFINER RPC `verify_admin_access()` which decides
 *     admin status from `auth.uid()` on the DB side — spoofing the client
 *     role hook has no effect.
 */
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 min
const ACTIVITY_KEY = 'hioutz-admin-last-activity';

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState<
    'checking' | 'allowed' | 'denied' | 'mfa_required' | 'mfa_setup_required'
  >('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !userData?.user) {
        setState('denied');
        return;
      }

      const { data, error } = await (supabase.rpc as any)('verify_admin_access_mfa');
      if (cancelled) return;
      if (error || !data) {
        setState('denied');
        return;
      }
      const info = data as { is_admin: boolean; has_mfa_factor: boolean; aal2: boolean };
      if (!info.is_admin) {
        setState('denied');
        return;
      }
      if (!info.has_mfa_factor) {
        setState('mfa_setup_required');
        return;
      }
      if (!info.aal2) {
        setState('mfa_required');
        return;
      }

      // Inactivity check
      const last = Number(sessionStorage.getItem(ACTIVITY_KEY) || 0);
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
        sessionStorage.removeItem(ACTIVITY_KEY);
        setState('mfa_required');
        return;
      }
      sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
      setState('allowed');
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  // Track activity while allowed
  useEffect(() => {
    if (state !== 'allowed') return;
    const bump = () => sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    const events: (keyof WindowEventMap)[] = ['click', 'keydown', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const interval = window.setInterval(() => {
      const last = Number(sessionStorage.getItem(ACTIVITY_KEY) || 0);
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
        setState('mfa_required');
      }
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(interval);
    };
  }, [state]);

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to="/home" replace />;
  }

  if (state === 'mfa_setup_required') {
    return <Navigate to="/admin/mfa-setup" replace />;
  }

  if (state === 'mfa_required') {
    return <Navigate to="/admin/mfa-challenge" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
