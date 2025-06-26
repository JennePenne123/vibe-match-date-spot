
import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUser } from '@/data/mockUsers';
import { User } from '@/types';
import { authApi } from '@/services/api';
import { logger } from '@/lib/environment';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  inviteFriend: (friendId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.debug('Setting up auth state listener');
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Get user profile from profiles table
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
              profile: profile || {
                name: session.user.user_metadata?.name || 'User',
                email: session.user.email || '',
              },
              friends: mockUser.friends, // Temporary fallback
            };
            
            setUser(userData);
          } catch (error) {
            logger.error('Failed to fetch user profile:', error);
            // Fallback to basic user data
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
              profile: {
                name: session.user.user_metadata?.name || 'User',
                email: session.user.email || '',
              },
              friends: [],
            });
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        logger.debug('Initial session found for user:', session.user.email);
      } else {
        logger.debug('No initial session found');
        setLoading(false);
      }
    });

    return () => {
      logger.debug('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true);
    try {
      logger.info('Attempting to sign up user:', email);
      const result = await authApi.signUp(email, password, userData);
      logger.info('Sign up successful');
      return result;
    } catch (error: any) {
      logger.error('Sign up failed:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      logger.info('Attempting to sign in user:', email);
      const result = await authApi.signIn(email, password);
      logger.info('Sign in successful');
      return result;
    } catch (error: any) {
      logger.error('Sign in failed:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      logger.info('Signing out user');
      await authApi.signOut();
      setUser(null);
    } catch (error) {
      logger.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const updateUser = async (userData: any) => {
    if (user) {
      try {
        logger.debug('Updating user profile:', userData);
        
        const { error } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', user.id);
        
        if (error) throw error;
        
        setUser({
          ...user,
          profile: {
            ...user.profile,
            ...userData
          }
        });
        
        logger.info('User profile updated successfully');
      } catch (error) {
        logger.error('Failed to update user profile:', error);
        throw error;
      }
    }
  };

  const inviteFriend = (friendId: string) => {
    if (user?.friends) {
      const updatedFriends = user.friends.map(friend =>
        friend.id === friendId
          ? { ...friend, isInvited: !friend.isInvited }
          : friend
      );
      setUser({ ...user, friends: updatedFriends });
      logger.debug('Friend invitation toggled:', friendId);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      updateUser,
      inviteFriend,
      logout
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
