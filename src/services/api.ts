
import { supabase } from '@/integrations/supabase/client';
import { User, Friend, Venue, DateInvite } from '@/types';

// Environment configuration
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://dfjwubatslzblagthbdw.supabase.co',
  timeout: 10000,
};

// Generic API error handler
class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client with error handling
const apiClient = {
  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network request failed');
    }
  },

  get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  },

  post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  },

  put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  },

  delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  },
};

// Authentication API
export const authApi = {
  async signUp(email: string, password: string, userData?: any) {
    console.log('Signing up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: userData,
      },
    });
    
    if (error) throw new ApiError(error.message);
    return { user: data.user, error: null };
  },

  async signIn(email: string, password: string) {
    console.log('Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw new ApiError(error.message);
    return { user: data.user, error: null };
  },

  async signOut() {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) throw new ApiError(error.message);
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new ApiError(error.message);
    return user;
  },
};

// Friends API
export const friendsApi = {
  async getFriends(): Promise<Friend[]> {
    console.log('Fetching friends from API');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);
      
      if (error) throw new ApiError(error.message);
      
      // Transform profiles to friends format
      return data?.map(profile => ({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isInvited: false,
        status: 'online' as const,
        lastSeen: 'Active now',
        mutualFriends: Math.floor(Math.random() * 10),
        joinedDate: '1 month ago',
      })) || [];
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      // Fallback to mock data
      return [];
    }
  },

  async inviteFriend(friendId: string): Promise<void> {
    console.log('Inviting friend:', friendId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

// Venues API
export const venuesApi = {
  async getVenues(preferences?: {
    cuisines?: string[];
    vibes?: string[];
    area?: string;
  }): Promise<Venue[]> {
    console.log('Fetching venues with preferences:', preferences);
    
    try {
      // Use Supabase edge function for venue search
      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: { preferences },
      });
      
      if (error) throw new ApiError(error.message);
      return data?.venues || [];
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      // Fallback to empty array
      return [];
    }
  },

  async getVenueById(id: string): Promise<Venue | null> {
    console.log('Fetching venue by ID:', id);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: { venueId: id },
      });
      
      if (error) throw new ApiError(error.message);
      return data?.venue || null;
    } catch (error) {
      console.error('Failed to fetch venue:', error);
      return null;
    }
  },
};

// Date Invitations API
export const invitationsApi = {
  async getInvitations(): Promise<DateInvite[]> {
    console.log('Fetching date invitations');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Since we don't have a real invitations table yet, return empty array
    // This would be replaced with actual Supabase query when table is created
    return [];
  },

  async acceptInvitation(invitationId: number): Promise<void> {
    console.log('Accepting invitation:', invitationId);
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async declineInvitation(invitationId: number): Promise<void> {
    console.log('Declining invitation:', invitationId);
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

// User Profile API
export const profileApi = {
  async updateProfile(profileData: Partial<User['profile']>): Promise<void> {
    console.log('Updating profile:', profileData);
    
    const user = await authApi.getCurrentUser();
    if (!user) throw new ApiError('User not authenticated');
    
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);
    
    if (error) throw new ApiError(error.message);
  },

  async getProfile(userId: string) {
    console.log('Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw new ApiError(error.message);
    return data;
  },
};

export { ApiError };
