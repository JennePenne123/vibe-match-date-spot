
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
}

interface AppState {
  selectedCuisines: string[];
  selectedVibes: string[];
  selectedArea: string;
  invitedFriends: string[];
  venues: Venue[];
}

interface AppContextType {
  appState: AppState;
  updateCuisines: (cuisines: string[]) => void;
  updateVibes: (vibes: string[]) => void;
  updateArea: (area: string) => void;
  updateInvitedFriends: (friends: string[]) => void;
  generateRecommendations: () => void;
  resetState: () => void;
}

const initialState: AppState = {
  selectedCuisines: [],
  selectedVibes: [],
  selectedArea: '',
  invitedFriends: [],
  venues: []
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

  const generateRecommendations = () => {
    // Mock venue data with AI-like scoring
    const mockVenues: Venue[] = [
      {
        id: '1',
        name: 'Moonlight Rooftop',
        description: 'Intimate rooftop dining with city views and live acoustic music',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        rating: 4.8,
        distance: '0.5 mi',
        priceRange: '$$$',
        location: 'Downtown',
        cuisineType: 'Mediterranean',
        vibe: 'romantic',
        matchScore: 95,
        tags: ['rooftop', 'romantic', 'dinner'],
        discount: '20% off drinks'
      },
      {
        id: '2',
        name: 'Sunset Beach Club',
        description: 'Beach club with stunning sunset views and tropical cocktails',
        image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop',
        rating: 4.9,
        distance: '3.5 mi',
        priceRange: '$$',
        location: 'Waterfront',
        cuisineType: 'Seafood',
        vibe: 'outdoor',
        matchScore: 93,
        tags: ['beach', 'outdoor', 'cocktails']
      },
      {
        id: '3',
        name: 'Jazz & Whiskey Lounge',
        description: 'Intimate jazz club with craft cocktails and live performances',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        rating: 4.7,
        distance: '2.1 mi',
        priceRange: '$$',
        location: 'Arts District',
        cuisineType: 'American',
        vibe: 'nightlife',
        matchScore: 91,
        tags: ['jazz', 'cocktails', 'music']
      },
      {
        id: '4',
        name: 'Garden Bistro',
        description: 'Charming garden setting with farm-to-table cuisine',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        rating: 4.6,
        distance: '1.2 mi',
        priceRange: '$$$',
        location: 'Central Park',
        cuisineType: 'French',
        vibe: 'casual',
        matchScore: 88,
        tags: ['garden', 'outdoor', 'brunch']
      },
      {
        id: '5',
        name: 'Neon Night Market',
        description: 'Vibrant street food market with diverse cuisines',
        image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop',
        rating: 4.5,
        distance: '0.8 mi',
        priceRange: '$',
        location: 'Chinatown',
        cuisineType: 'Asian',
        vibe: 'casual',
        matchScore: 85,
        tags: ['street food', 'diverse', 'budget']
      }
    ];

    setAppState(prev => ({ ...prev, venues: mockVenues }));
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
      resetState
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
