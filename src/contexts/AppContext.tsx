
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  cuisine_type?: string;
  price_range?: string;
  rating?: number;
  image_url?: string;
  tags?: string[];
}

interface AppState {
  selectedCuisines: string[];
  selectedVibes: string[];
  selectedArea: string;
  invitedFriends: string[];
  venues: Venue[];
  isLoading: boolean;
  userLocation: UserLocation | null;
  locationError: string | null;
}

interface AppContextType {
  appState: AppState;
  updateCuisines: (cuisines: string[]) => void;
  updateVibes: (vibes: string[]) => void;
  updateArea: (area: string) => void;
  updateInvitedFriends: (friends: string[]) => void;
  generateRecommendations: () => Promise<void>;
  resetState: () => void;
  requestLocation: () => Promise<void>;
}

const initialState: AppState = {
  selectedCuisines: [],
  selectedVibes: [],
  selectedArea: '',
  invitedFriends: [],
  venues: [],
  isLoading: false,
  userLocation: null,
  locationError: null
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(initialState);

  const updateCuisines = (cuisines: string[]) => {
    setAppState(prev => ({ ...prev, selectedCuisines: cuisines }));
  };

  const updateVibes = (vibes: string[]) => {
    setAppState(prev => ({ ...prev, selectedVibes: vibes }));
  };

  const updateArea = (area: string) => {
    setAppState(prev => ({ ...prev, selectedArea: area }));
  };

  const updateInvitedFriends = (friends: string[]) => {
    setAppState(prev => ({ ...prev, invitedFriends: friends }));
  };

  const requestLocation = async () => {
    console.log('Requesting user location...');
    setAppState(prev => ({ ...prev, locationError: null }));

    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      console.error(error);
      setAppState(prev => ({ ...prev, locationError: error }));
      return;
    }

    // Firefox-specific handling to prevent flickering
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    
    // Check if we're in a secure context (required for geolocation)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      const error = 'Location access requires HTTPS. Please use a secure connection.';
      console.error(error);
      setAppState(prev => ({ ...prev, locationError: error }));
      return;
    }

    // Firefox-specific configuration to prevent issues
    const options: PositionOptions = {
      enableHighAccuracy: false, // Disable high accuracy for Firefox to prevent flickering
      timeout: isFirefox ? 20000 : 10000, // Longer timeout for Firefox
      maximumAge: isFirefox ? 600000 : 300000 // 10 minutes for Firefox, 5 for others
    };

    console.log('🦊 Firefox detected:', isFirefox, 'Using options:', options);

    try {
      // For Firefox, check permissions first to avoid popup issues
      if (isFirefox && 'permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          console.log('🦊 Firefox permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            throw new Error('Location access is blocked. Please enable it in browser settings and refresh the page.');
          }
        } catch (permError) {
          console.log('🦊 Permission check failed (expected in some Firefox versions):', permError);
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          options
        );
      });

      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      console.log('✅ Location obtained successfully:', userLocation);
      setAppState(prev => ({ 
        ...prev, 
        userLocation, 
        locationError: null 
      }));
    } catch (error: any) {
      let errorMessage = 'Unable to get your location';
      
      console.error('❌ Location error details:', { 
        code: error.code, 
        message: error.message,
        isFirefox,
        userAgent: navigator.userAgent
      });
      
      if (error.code === 1) {
        errorMessage = isFirefox 
          ? 'Location blocked in Firefox. Click the location icon in the address bar or go to Preferences → Privacy & Security → Permissions → Location to allow access.'
          : 'Location access denied. Please enable location services and refresh the page.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your internet connection and try again.';
      } else if (error.code === 3) {
        errorMessage = isFirefox 
          ? 'Location request timed out in Firefox. Try refreshing the page and clicking "Allow" quickly when prompted.'
          : 'Location request timed out. Please try again.';
      } else if (error.message && error.message.includes('blocked')) {
        errorMessage = 'Location access is blocked. Please enable it in browser settings and refresh the page.';
      }

      setAppState(prev => ({ ...prev, locationError: errorMessage }));
    }
  };

  const generateRecommendations = async () => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('Generating recommendations with:', {
        cuisines: appState.selectedCuisines,
        vibes: appState.selectedVibes,
        area: appState.selectedArea,
        location: appState.userLocation
      });

      // Query venues from Supabase
      let query = supabase
        .from('venues')
        .select('*')
        .eq('is_active', true);

      // Filter by cuisine if specified
      if (appState.selectedCuisines.length > 0) {
        query = query.in('cuisine_type', appState.selectedCuisines);
      }

      const { data: venues, error } = await query;

      if (error) {
        console.error('Error fetching venues:', error);
        setAppState(prev => ({ 
          ...prev, 
          venues: [],
          isLoading: false 
        }));
        return;
      }

      // Filter by vibes/tags if specified
      let filteredVenues = venues || [];
      if (appState.selectedVibes.length > 0) {
        filteredVenues = filteredVenues.filter(venue =>
          appState.selectedVibes.some(vibe =>
            venue.tags?.some(tag => tag.toLowerCase().includes(vibe.toLowerCase()))
          )
        );
      }

      console.log(`Returning ${filteredVenues.length} venues`);

      setAppState(prev => ({ 
        ...prev, 
        venues: filteredVenues,
        isLoading: false 
      }));

    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      setAppState(prev => ({ 
        ...prev, 
        venues: [],
        isLoading: false 
      }));
    }
  };

  const resetState = () => {
    setAppState(initialState);
  };

  return (
    <AppContext.Provider value={{
      appState,
      updateCuisines,
      updateVibes,
      updateArea,
      updateInvitedFriends,
      generateRecommendations,
      resetState,
      requestLocation
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
