import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Server-side admin verification.
 *
 * Calls the SECURITY DEFINER RPC `verify_admin_access()`, which derives the
 * caller identity from `auth.uid()` on the database side. Client state cannot
 * influence the result — unlike a purely client-side table read, this cannot
 * be spoofed by manipulating local storage or React state.
 */
export function useServerAdminAccess() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        const { data, error } = await supabase.rpc('verify_admin_access_logged');
        if (!active) return;
        setIsAdmin(!error && data === true);
      } catch {
        if (active) setIsAdmin(false);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user?.id]);

  return { isAdmin, loading };
}
