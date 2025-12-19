
import { useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types/app';
import { fetchUserProfile } from '@/utils/userProfileHelpers';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout(0) to defer async operations and prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user)
              .then(enrichedUser => {
                setUser(enrichedUser);
                setLoading(false); // Set loading false AFTER user is resolved
              })
              .catch(error => {
                console.error('Error fetching user profile in auth state change:', error);
                // Fallback to basic user data from session
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  avatar_url: session.user.user_metadata?.avatar_url
                });
                setLoading(false); // Set loading false AFTER fallback user is set
              });
          }, 0);
        } else {
          setUser(null);
          setLoading(false); // Only set loading false when no session
        }
      }
    );

    // Get initial session after setting up listener
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
        return;
      }

      setSession(session);
      
      if (session?.user) {
        // Use setTimeout(0) for initial profile fetch as well
        setTimeout(() => {
          fetchUserProfile(session.user)
            .then(enrichedUser => {
              setUser(enrichedUser);
              setLoading(false); // Set loading false AFTER user is resolved
            })
            .catch(error => {
              console.error('Error fetching user profile on init:', error);
              // Fallback to basic user data from session
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata?.avatar_url
              });
              setLoading(false); // Set loading false AFTER fallback user is set
            });
        }, 0);
      } else {
        setUser(null);
        setLoading(false); // Only set loading false when no session
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, setUser, session, loading };
};
