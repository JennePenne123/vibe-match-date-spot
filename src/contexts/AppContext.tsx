
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Venue {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  distance: string;
  priceRange: string;
  location: string;
  cuisineType: string;
  vibe: string;
  matchScore: number;
  tags: string[];
  discount?: string;
  placeId?: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  isOpen?: boolean;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
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
      // Check if we have user location
      if (!appState.userLocation) {
        console.log('No user location available, requesting location first...');
        await requestLocation();
        
        // Wait a moment for the location to be set
        const currentState = appState;
        if (!currentState.userLocation) {
          throw new Error('Location is required to find nearby venues');
        }
      }

      console.log('Generating recommendations with:', {
        cuisines: appState.selectedCuisines,
        vibes: appState.selectedVibes,
        area: appState.selectedArea,
        location: appState.userLocation
      });

      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: {
          location: appState.selectedArea || 'restaurants',
          cuisines: appState.selectedCuisines,
          vibes: appState.selectedVibes,
          latitude: appState.userLocation?.latitude,
          longitude: appState.userLocation?.longitude,
          radius: 5000
        }
      });

      if (error) {
        console.error('Error calling search-venues function:', error);
        throw error;
      }

      console.log('API response:', data);

      if (data?.venues && data.venues.length > 0) {
        setAppState(prev => ({ 
          ...prev, 
          venues: data.venues,
          isLoading: false 
        }));
      } else {
        // Fallback to mock data if no venues found
        console.log('No venues found, using fallback data');
        const mockVenues: Venue[] = [
          {
            id: 'fallback-1',
            name: 'Local Favorite',
            description: 'Popular local spot with great atmosphere',
            image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
            rating: 4.5,
            distance: '0.5 mi',
            priceRange: '$$',
            location: appState.selectedArea || 'Nearby',
            cuisineType: appState.selectedCuisines[0] || 'International',
            vibe: appState.selectedVibes[0] || 'casual',
            matchScore: 85,
            tags: ['popular', 'local favorite']
          }
        ];
        
        setAppState(prev => ({ 
          ...prev, 
          venues: mockVenues,
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to mock data on error
      const mockVenues: Venue[] = [
        {
          id: 'error-fallback-1',
          name: 'Recommended Spot',
          description: 'Great place for your preferences',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
          rating: 4.3,
          distance: '1.2 mi',
          priceRange: '$$',
          location: appState.selectedArea || 'Nearby',
          cuisineType: appState.selectedCuisines[0] || 'International',
          vibe: appState.selectedVibes[0] || 'casual',
          matchScore: 80,
          tags: ['recommended']
        }
      ];
      
      setAppState(prev => ({ 
        ...prev, 
        venues: mockVenues,
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
