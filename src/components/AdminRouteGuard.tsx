import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !userData?.user) {
        setState('denied');
        return;
      }

      const { data, error } = await (supabase.rpc as any)('verify_admin_access');
      if (cancelled) return;
      if (error || data !== true) {
        setState('denied');
        return;
      }
      setState('allowed');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return <>{children}</>;
};

export default AdminRouteGuard;
