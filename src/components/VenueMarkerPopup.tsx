import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Star, MapPin, Car, Footprints, Home, Navigation } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import { openDirections, openDirectionsFromCurrentLocation } from '@/utils/navigationHelpers';
import { useRouteInfo } from '@/hooks/useRouteInfo';

interface VenueMarkerPopupProps {
  recommendation: AIVenueRecommendation;
  onSelect: (venueId: string) => void;
  userLocation?: { latitude: number; longitude: number };
}

const VenueMarkerPopup = ({ recommendation, onSelect, userLocation }: VenueMarkerPopupProps) => {
  const hasHomeLocation = userLocation && 
    recommendation.latitude != null && 
    recommendation.longitude != null;
  
  const hasVenueCoordinates = recommendation.latitude != null && recommendation.longitude != null;

  // Default to home if available, otherwise current
  const [locationSource, setLocationSource] = useState<'home' | 'current'>(
    hasHomeLocation ? 'home' : 'current'
  );

  // Fetch route info for both driving and walking (only when home is selected)
  const { driving, walking, loading } = useRouteInfo({
    originLat: userLocation?.latitude,
    originLng: userLocation?.longitude,
    destLat: recommendation.latitude ?? undefined,
    destLng: recommendation.longitude ?? undefined,
    enabled: hasHomeLocation && locationSource === 'home'
  });

  const handleDirections = (mode: 'driving' | 'walking') => {
    if (!recommendation.latitude || !recommendation.longitude) return;
    
    if (locationSource === 'current') {
      openDirectionsFromCurrentLocation({
        destLat: recommendation.latitude,
        destLng: recommendation.longitude,
        destName: recommendation.venue_name,
        mode
      });
    } else {
      if (!userLocation) return;
      openDirections({
        originLat: userLocation.latitude,
        originLng: userLocation.longitude,
        destLat: recommendation.latitude,
        destLng: recommendation.longitude,
        destName: recommendation.venue_name,
        mode
      });
    }
  };

  return (
    <div className="min-w-[200px] p-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm truncate max-w-[140px] text-foreground">
          {recommendation.venue_name}
        </h3>
        <Badge className="bg-primary/10 text-primary text-xs ml-2">
          {Math.round(recommendation.ai_score)}%
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        <span className="truncate">
          {recommendation.neighborhood || recommendation.venue_address?.split(',')[0]}
        </span>
      </p>
      
      <div className="flex items-center gap-3 text-xs mb-3">
        {recommendation.rating && (
          <span className="flex items-center text-foreground">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
            {recommendation.rating.toFixed(1)}
          </span>
        )}
        {recommendation.priceRange && (
          <span className="text-green-600 dark:text-green-400 font-medium">
            {recommendation.priceRange}
          </span>
        )}
      </div>

      {/* Location source toggle */}
      {hasVenueCoordinates && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1">Directions from:</p>
          <ToggleGroup 
            type="single" 
            value={locationSource} 
            onValueChange={(v) => v && setLocationSource(v as 'home' | 'current')}
            className="justify-start"
          >
            <ToggleGroupItem 
              value="home" 
              size="sm" 
              disabled={!hasHomeLocation}
              className="text-xs h-7 px-2"
            >
              <Home className="w-3 h-3 mr-1" />
              Home
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="current" 
              size="sm"
              className="text-xs h-7 px-2"
            >
              <Navigation className="w-3 h-3 mr-1" />
              Current
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Travel time estimates - only show for home location */}
      {locationSource === 'home' && hasHomeLocation && (
        <div className="bg-muted/50 rounded-md p-2 mb-3 space-y-1.5">
          {loading ? (
            <>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </>
          ) : (
            <>
              {driving && (
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Car className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{driving.durationText}</span>
                  <span className="text-muted-foreground">· {driving.distanceText}</span>
                </div>
              )}
              {walking && (
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Footprints className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{walking.durationText}</span>
                  <span className="text-muted-foreground">· {walking.distanceText}</span>
                </div>
              )}
              {!driving && !walking && (
                <p className="text-xs text-muted-foreground">Unable to calculate route</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Info note for current location */}
      {locationSource === 'current' && hasVenueCoordinates && (
        <p className="text-xs text-muted-foreground mb-2 italic flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          Travel time shown in maps app
        </p>
      )}

      {/* Directions buttons */}
      {hasVenueCoordinates && (
        <div className="flex gap-2 mb-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 text-xs h-7"
            onClick={() => handleDirections('driving')}
          >
            <Car className="w-3 h-3 mr-1" />
            Drive
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 text-xs h-7"
            onClick={() => handleDirections('walking')}
          >
            <Footprints className="w-3 h-3 mr-1" />
            Walk
          </Button>
        </div>
      )}
      
      <Button 
        size="sm" 
        className="w-full"
        onClick={() => onSelect(recommendation.venue_id)}
      >
        View Details
      </Button>
    </div>
  );
};

export default VenueMarkerPopup;
