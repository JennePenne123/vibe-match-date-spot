
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

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      console.log('Location obtained:', userLocation);
      setAppState(prev => ({ ...prev, userLocation, locationError: null }));
    } catch (error: any) {
      let errorMessage = 'Unable to get your location';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please try again.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }

      console.error('Location error:', error);
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
