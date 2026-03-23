
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAIVenueRecommendations, type AIVenueRecommendation } from '@/services/aiVenueService';

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Venue {
  id: string;
  name: string;
  description?: string;
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
  opening_hours?: string[];
  isOpen?: boolean;
  matchScore?: number;
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
  updateVenues: (venues: Venue[]) => void;
  generateRecommendations: () => Promise<void>;
  resetState: () => void;
  requestLocation: () => Promise<void>;
  updateUserLocation: (location: UserLocation) => void;
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

const normalizeValue = (value: string) => value.trim().toLowerCase();

const recommendationToVenue = (recommendation: AIVenueRecommendation): Venue => {
  // Try to get image from venue_image, then from venue_photos array
  const photoUrl = recommendation.venue_photos?.length 
    ? (typeof recommendation.venue_photos[0] === 'string' 
        ? recommendation.venue_photos[0] 
        : (recommendation.venue_photos[0] as any)?.url)
    : undefined;
  
  return {
    id: recommendation.venue_id,
    name: recommendation.venue_name,
    description: recommendation.ai_reasoning,
    address: recommendation.venue_address,
    latitude: recommendation.latitude,
    longitude: recommendation.longitude,
    cuisine_type: recommendation.cuisine_type,
    price_range: recommendation.priceRange,
    rating: recommendation.rating,
    image_url: recommendation.venue_image || photoUrl,
    tags: recommendation.amenities || [],
    opening_hours: recommendation.operatingHours,
    phone: undefined,
    website: undefined,
    isOpen: recommendation.isOpen,
    matchScore: Math.round(recommendation.ai_score * 100)
  };
};

const applyVenueFilters = (venues: Venue[], selectedCuisines: string[], selectedVibes: string[]) => {
  const normalizedCuisines = selectedCuisines.map(normalizeValue);
  const normalizedVibes = selectedVibes.map(normalizeValue);

  return venues.filter((venue) => {
    const venueCuisine = normalizeValue(venue.cuisine_type || '');
    const venueTags = (venue.tags || []).map(normalizeValue);

    const matchesCuisine = normalizedCuisines.length === 0 || normalizedCuisines.some((cuisine) => {
      return venueCuisine.includes(cuisine) || cuisine.includes(venueCuisine);
    });

    const matchesVibe = normalizedVibes.length === 0 || normalizedVibes.some((vibe) => {
      return venueTags.some((tag) => tag.includes(vibe) || vibe.includes(tag));
    });

    return matchesCuisine && matchesVibe;
  });
};

const fetchFallbackVenues = async (
  selectedCuisines: string[],
  selectedVibes: string[],
  userLocation?: { latitude: number; longitude: number }
): Promise<Venue[]> => {
  let query = supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);

  // Filter by bounding box if location available
  if (userLocation?.latitude && userLocation?.longitude) {
    const radiusKm = 25;
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(userLocation.latitude * Math.PI / 180));
    query = query
      .gte('latitude', userLocation.latitude - latDelta)
      .lte('latitude', userLocation.latitude + latDelta)
      .gte('longitude', userLocation.longitude - lngDelta)
      .lte('longitude', userLocation.longitude + lngDelta);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;

  return applyVenueFilters((data || []) as Venue[], selectedCuisines, selectedVibes);
};

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

  const updateVenues = (venues: Venue[]) => {
    setAppState(prev => ({ ...prev, venues }));
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

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      const error = 'Location access requires HTTPS. Please use a secure connection.';
      console.error(error);
      setAppState(prev => ({ ...prev, locationError: error }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: isFirefox ? 20000 : 10000,
      maximumAge: isFirefox ? 600000 : 300000
    };

    console.log('🦊 Firefox detected:', isFirefox, 'Using options:', options);

    try {
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

      let userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: undefined as string | undefined
      };

      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.city || data.locality || data.countryName) {
            userLocation.address = data.city || data.locality || data.countryName;
            console.log('✅ Address resolved:', userLocation.address);
          }
        }
      } catch (geocodeError) {
        console.log('📍 Reverse geocoding failed, using coordinates:', geocodeError);
      }

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
      // If no location in state, try to load from user preferences
      let location = appState.userLocation;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!location && user) {
        console.log('📍 No location in state, loading from user preferences...');
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('home_latitude, home_longitude, home_address')
          .eq('user_id', user.id)
          .single();
        
        if (prefs?.home_latitude && prefs?.home_longitude) {
          location = {
            latitude: prefs.home_latitude,
            longitude: prefs.home_longitude,
            address: prefs.home_address || undefined,
          };
          console.log('✅ Loaded location from preferences:', location);
          setAppState(prev => ({ ...prev, userLocation: location }));
        }
      }

      console.log('Generating recommendations with:', {
        cuisines: appState.selectedCuisines,
        vibes: appState.selectedVibes,
        area: appState.selectedArea,
        location
      });

      let venues: Venue[] = [];

      if (user && location?.latitude && location?.longitude) {
        try {
          const recommendations = await getAIVenueRecommendations(user.id, undefined, 6, location, appState.selectedArea);
          venues = recommendations.map(recommendationToVenue);
          console.log(`✅ AI venue pipeline returned ${venues.length} venues`);
        } catch (aiError) {
          console.error('Error fetching AI venue recommendations:', aiError);
        }
      }

      if (venues.length === 0) {
        console.log('⚠️ Falling back to stored venues');
        venues = await fetchFallbackVenues(
          appState.selectedCuisines,
          appState.selectedVibes,
          location ? { latitude: location.latitude, longitude: location.longitude } : undefined
        );
      }

      console.log(`Returning ${venues.length} venues`);

      setAppState(prev => ({ 
        ...prev, 
        venues,
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
      updateVenues,
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
