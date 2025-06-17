
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    cuisines: string[];
    vibes: string[];
  };
  friends: Friend[];
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  isInvited?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addFriend: (friend: Friend) => void;
  inviteFriend: (friendId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('datespot_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app this would call an API
    const mockUser: User = {
      id: '1',
      name: 'Alex Johnson',
      email,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      friends: [
        {
          id: '2',
          name: 'Sarah Wilson',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '3',
          name: 'Mike Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '4',
          name: 'Emma Davis',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        }
      ]
    };
    setUser(mockUser);
    localStorage.setItem('datespot_user', JSON.stringify(mockUser));
  };

  const signup = async (name: string, email: string, password: string) => {
    // Mock signup
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      friends: []
    };
    setUser(newUser);
    localStorage.setItem('datespot_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('datespot_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('datespot_user', JSON.stringify(updatedUser));
    }
  };

  const addFriend = (friend: Friend) => {
    if (user) {
      const updatedUser = {
        ...user,
        friends: [...user.friends, friend]
      };
      setUser(updatedUser);
      localStorage.setItem('datespot_user', JSON.stringify(updatedUser));
    }
  };

  const inviteFriend = (friendId: string) => {
    if (user) {
      const updatedFriends = user.friends.map(friend =>
        friend.id === friendId ? { ...friend, isInvited: !friend.isInvited } : friend
      );
      const updatedUser = { ...user, friends: updatedFriends };
      setUser(updatedUser);
      localStorage.setItem('datespot_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      updateUser,
      addFriend,
      inviteFriend
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
