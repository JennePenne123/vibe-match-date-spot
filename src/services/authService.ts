
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types/app';
import { fetchUserProfile } from '@/utils/userProfileHelpers';

export const signUpUser = async (email: string, password: string, userData?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: {
          name: userData?.name || 'New User'
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    }

    let enrichedUser = null;
    if (data.user) {
      enrichedUser = await fetchUserProfile(data.user);
    }

    return { user: enrichedUser, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error };
  }
};

export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }

    let enrichedUser = null;
    if (data.user) {
      enrichedUser = await fetchUserProfile(data.user);
    }

    return { user: enrichedUser, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error };
  }
};

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
