import React from 'react';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LocationDisplayProps {
  userLocation: { latitude: number; longitude: number; address?: string } | null;
  locationError: string | null;
  locationRequested?: boolean;
  onRequestLocation: () => void;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  userLocation,
  locationError,
  locationRequested = false,
  onRequestLocation
}) => {
  if (locationError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex items-center space-x-3 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Location Error</p>
            <p className="text-xs text-destructive/80">{locationError}</p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onRequestLocation}
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!userLocation) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center space-x-3 p-4">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">
              {locationRequested ? 'Getting your location...' : 'Location needed'}
            </p>
            <p className="text-xs text-primary/80">
              {locationRequested 
                ? 'For the best venue recommendations' 
                : 'Enable location for better recommendations'
              }
            </p>
          </div>
          {!locationRequested && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onRequestLocation}
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Display real location coordinates or address
  const displayLocation = userLocation.address || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`;
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center space-x-3 p-4">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">Your Location</p>
          <p className="text-xs text-primary/80">{displayLocation}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationDisplay;