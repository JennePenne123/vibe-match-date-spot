import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUser } from '@/data/mockUsers';
import { User } from '@/types';

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
  const [loading, setLoading] = useState(false);

  // Start with no user and no loading - user must go through auth flow
  useEffect(() => {
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      ...mockUser,
      email,
      user_metadata: { name: userData?.name || 'New User' },
      profile: { name: userData?.name || 'New User', email }
    };
    
    setUser(newUser);
    setLoading(false);
    return { user: newUser, error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const loginUser = { ...mockUser, email };
    setUser(loginUser);
    setLoading(false);
    return { user: loginUser, error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setLoading(false);
  };

  const logout = async () => {
    await signOut();
  };

  const updateUser = async (userData: any) => {
    if (user) {
      setUser({
        ...user,
        profile: {
          ...user.profile,
          ...userData
        }
      });
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
