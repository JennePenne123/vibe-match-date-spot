
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Car, Footprints } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import { openDirections } from '@/utils/navigationHelpers';

interface VenueMarkerPopupProps {
  recommendation: AIVenueRecommendation;
  onSelect: (venueId: string) => void;
  userLocation?: { latitude: number; longitude: number };
}

const VenueMarkerPopup = ({ recommendation, onSelect, userLocation }: VenueMarkerPopupProps) => {
  const hasDirections = userLocation && 
    recommendation.latitude != null && 
    recommendation.longitude != null;

  const handleDirections = (mode: 'driving' | 'walking') => {
    if (!userLocation || !recommendation.latitude || !recommendation.longitude) return;
    
    openDirections({
      originLat: userLocation.latitude,
      originLng: userLocation.longitude,
      destLat: recommendation.latitude,
      destLng: recommendation.longitude,
      destName: recommendation.venue_name,
      mode
    });
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

      {/* Directions buttons */}
      {hasDirections && (
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
