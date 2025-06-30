
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types/app';
import { supabaseUserToAppUser } from '@/utils/typeHelpers';

export const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AppUser> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return supabaseUserToAppUser(supabaseUser)!;
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatar_url: profile.avatar_url || supabaseUser.user_metadata?.avatar_url
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return supabaseUserToAppUser(supabaseUser)!;
  }
};

export const updateUserProfile = async (userId: string, userData: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', userId);

    if (error) {
      console.error('Update user error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};
