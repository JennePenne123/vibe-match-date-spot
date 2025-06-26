
import React, { createContext, useContext, useState } from 'react';
import { mockVenues } from '@/data/mockVenues';
import { Venue } from '@/types';
import { venuesApi } from '@/services/api';
import { logger, isFeatureEnabled } from '@/lib/environment';

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
    logger.debug('Updating cuisines:', cuisines);
    setAppState(prev => ({ ...prev, selectedCuisines: cuisines }));
  };

  const updateVibes = (vibes: string[]) => {
    logger.debug('Updating vibes:', vibes);
    setAppState(prev => ({ ...prev, selectedVibes: vibes }));
  };

  const updateArea = (area: string) => {
    logger.debug('Updating area:', area);
    setAppState(prev => ({ ...prev, selectedArea: area }));
  };

  const updateInvitedFriends = (friends: string[]) => {
    logger.debug('Updating invited friends:', friends);
    setAppState(prev => ({ ...prev, invitedFriends: friends }));
  };

  const requestLocation = async () => {
    if (!isFeatureEnabled('geolocation')) {
      logger.warn('Geolocation feature is disabled');
      setAppState(prev => ({ ...prev, locationError: 'Geolocation is disabled' }));
      return;
    }

    logger.info('Requesting user location');
    setAppState(prev => ({ ...prev, locationError: null }));

    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      logger.error(error);
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

      logger.info('Location obtained:', userLocation);
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

      logger.error('Location error:', error);
      setAppState(prev => ({ ...prev, locationError: errorMessage }));
    }
  };

  const generateRecommendations = async () => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    
    try {
      logger.info('Generating recommendations with preferences:', {
        cuisines: appState.selectedCuisines,
        vibes: appState.selectedVibes,
        area: appState.selectedArea,
        location: appState.userLocation
      });

      // Try to fetch venues from API
      const venues = await venuesApi.getVenues({
        cuisines: appState.selectedCuisines,
        vibes: appState.selectedVibes,
        area: appState.selectedArea,
      });

      if (venues.length > 0) {
        logger.info(`API returned ${venues.length} venues`);
        setAppState(prev => ({ 
          ...prev, 
          venues,
          isLoading: false 
        }));
      } else {
        // Fallback to mock data with filtering
        logger.info('Using fallback mock data');
        let filteredVenues = [...mockVenues];

        if (appState.selectedCuisines.length > 0) {
          filteredVenues = filteredVenues.filter(venue =>
            appState.selectedCuisines.some(cuisine =>
              venue.cuisineType.toLowerCase().includes(cuisine.toLowerCase())
            )
          );
        }

        if (appState.selectedVibes.length > 0) {
          filteredVenues = filteredVenues.filter(venue =>
            appState.selectedVibes.some(vibe =>
              venue.vibe.toLowerCase().includes(vibe.toLowerCase()) ||
              venue.tags.some(tag => tag.toLowerCase().includes(vibe.toLowerCase()))
            )
          );
        }

        // If no matches, return all venues
        if (filteredVenues.length === 0) {
          filteredVenues = mockVenues;
        }

        logger.info(`Returning ${filteredVenues.length} filtered venues`);

        setAppState(prev => ({ 
          ...prev, 
          venues: filteredVenues,
          isLoading: false 
        }));
      }
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      
      // Fallback to all mock venues on error
      setAppState(prev => ({ 
        ...prev, 
        venues: mockVenues,
        isLoading: false 
      }));
    }
  };

  const resetState = () => {
    logger.debug('Resetting app state');
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
