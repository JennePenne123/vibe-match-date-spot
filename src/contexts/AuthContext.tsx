
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  profile?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  friends?: Array<{
    id: string;
    name: string;
    avatar: string;
    isInvited: boolean;
  }>;
}

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

  // Mock user data for local testing
  const mockUser: User = {
    id: 'local-user-123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    profile: {
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    friends: [
      { id: '1', name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', isInvited: false },
      { id: '2', name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', isInvited: false },
      { id: '3', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', isInvited: false }
    ]
  };

  useEffect(() => {
    // Simulate loading and auto-login for local testing
    const timer = setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
