
import React, { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { AppUser } from '@/types/app';
import { useAuthState } from '@/hooks/useAuthState';
import { signUpUser, signInUser, signOutUser } from '@/services/authService';
import { updateUserProfile, fetchUserProfile } from '@/utils/userProfileHelpers';
import { inviteFriendById } from '@/services/friendshipService';
import { expireUserSessions, clearUserPreferenceFields } from '@/services/sessionCleanupService';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ user: AppUser | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: AppUser | null; error: any }>;
  signOut: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  inviteFriend: (friendId: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, session, loading } = useAuthState();

  const signUp = async (email: string, password: string, userData?: any) => {
    return await signUpUser(email, password, userData);
  };

  const signIn = async (email: string, password: string) => {
    return await signInUser(email, password);
  };

  const signOut = async () => {
    // Clean up only user's own data on logout (preserve collaborative sessions)
    if (user) {
      try {
        // Clear only user's own preferences from active sessions (preserve partner data)
        await clearUserPreferenceFields(user.id);
        console.log('✅ AUTH: User preferences cleared on logout (partner data preserved)');
        
        // Don't expire sessions - let them remain active for collaborative partners
        console.log('✅ AUTH: Collaborative sessions preserved for partners');
      } catch (error) {
        console.error('❌ AUTH: Failed to clean up user data on logout:', error);
        // Continue with logout even if cleanup fails
      }
    }
    await signOutUser();
  };

  const logout = async () => {
    await signOut();
  };

  const updateUser = async (userData: any) => {
    if (!user) return;

    try {
      await updateUserProfile(user.id, userData);
      // Update local user state
      setUser(prev => prev ? { ...prev, ...userData } : null);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const inviteFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await inviteFriendById(user.id, friendId);
    } catch (error) {
      console.error('Invite friend error:', error);
    }
  };

  const refreshProfile = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        const enrichedUser = await fetchUserProfile(currentSession.user);
        setUser(enrichedUser);
        console.log('✅ Profile refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateUser,
      inviteFriend,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
