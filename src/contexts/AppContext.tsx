
import React, { createContext, useContext, useState } from 'react';

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

// Mock venues for local testing
const mockVenues: Venue[] = [
  {
    id: 'venue-1',
    name: 'Bella Notte',
    description: 'Authentic Italian restaurant with romantic ambiance and handmade pasta',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    rating: 4.8,
    distance: '0.3 mi',
    priceRange: '$$$',
    location: '123 Main St, Downtown',
    cuisineType: 'Italian',
    vibe: 'romantic',
    matchScore: 95,
    tags: ['romantic', 'pasta', 'wine', 'date night'],
    phone: '+1 (555) 123-4567',
    website: 'https://bellanotte.example.com',
    openingHours: ['Mon-Thu: 5:00 PM - 10:00 PM', 'Fri-Sat: 5:00 PM - 11:00 PM', 'Sun: 4:00 PM - 9:00 PM'],
    isOpen: true
  },
  {
    id: 'venue-2',
    name: 'Sakura Sushi',
    description: 'Fresh sushi and sashimi in a modern Japanese setting',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    rating: 4.6,
    distance: '0.7 mi',
    priceRange: '$$',
    location: '456 Oak Ave, Arts District',
    cuisineType: 'Japanese',
    vibe: 'casual',
    matchScore: 88,
    tags: ['sushi', 'fresh', 'modern', 'healthy'],
    phone: '+1 (555) 987-6543',
    openingHours: ['Tue-Sun: 11:30 AM - 9:00 PM', 'Mon: Closed'],
    isOpen: false
  },
  {
    id: 'venue-3',
    name: 'Taco Libre',
    description: 'Vibrant Mexican cantina with craft cocktails and street tacos',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    rating: 4.4,
    distance: '1.2 mi',
    priceRange: '$$',
    location: '789 Pine St, Mission District',
    cuisineType: 'Mexican',
    vibe: 'nightlife',
    matchScore: 82,
    tags: ['tacos', 'cocktails', 'lively', 'outdoor seating'],
    discount: '20% off appetizers',
    phone: '+1 (555) 456-7890',
    website: 'https://tacolibre.example.com',
    openingHours: ['Daily: 11:00 AM - 12:00 AM'],
    isOpen: true
  }
];

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

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Filter mock venues based on preferences
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

      console.log(`Returning ${filteredVenues.length} venues`);

      setAppState(prev => ({ 
        ...prev, 
        venues: filteredVenues,
        isLoading: false 
      }));

    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to all mock venues on error
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
