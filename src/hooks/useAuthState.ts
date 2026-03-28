import { useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types/app';
import { fetchUserProfile } from '@/utils/userProfileHelpers';

const buildFallbackUser = (sessionUser: SupabaseUser): AppUser => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
  avatar_url: sessionUser.user_metadata?.avatar_url,
});

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolveUser = async (sessionUser: SupabaseUser | null) => {
      if (!isMounted) return;

      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const enrichedUser = await fetchUserProfile(sessionUser);
        if (isMounted) {
          setUser(enrichedUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (isMounted) {
          setUser(buildFallbackUser(sessionUser));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const scheduleUserResolution = (sessionUser: SupabaseUser | null) => {
      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        void resolveUser(sessionUser);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('Auth state changed:', event, nextSession?.user?.email);
      setSession(nextSession);
      scheduleUserResolution(nextSession?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      if (!isMounted) return;

      setSession(initialSession);
      scheduleUserResolution(initialSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, setUser, session, loading };
};