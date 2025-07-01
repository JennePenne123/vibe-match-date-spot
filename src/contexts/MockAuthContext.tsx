
import React, { createContext, useContext, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { AppUser } from '@/types/app';
import { MOCK_USER } from '@/utils/mockMode';

interface MockAuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ user: AppUser | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: AppUser | null; error: any }>;
  signOut: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  inviteFriend: (friendId: string) => void;
  logout: () => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      ...MOCK_USER,
      email,
      name: userData?.name || 'New User'
    };
    
    setUser(mockUser);
    setLoading(false);
    return { user: mockUser, error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      ...MOCK_USER,
      email
    };
    
    setUser(mockUser);
    setLoading(false);
    return { user: mockUser, error: null };
  };

  const signOut = async () => {
    setUser(null);
  };

  const logout = async () => {
    await signOut();
  };

  const updateUser = async (userData: any) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const inviteFriend = async (friendId: string) => {
    // Mock implementation - do nothing
    console.log('Mock: Inviting friend', friendId);
  };

  return (
    <MockAuthContext.Provider value={{
      user,
      session: null,
      loading,
      signUp,
      signIn,
      signOut,
      updateUser,
      inviteFriend,
      logout
    }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};
