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
        <CardContent className="flex items-center space-x-2 p-3">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive flex-1">{locationError}</p>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onRequestLocation}
            className="h-7 w-7 p-0 hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!userLocation) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center space-x-2 p-3">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-primary flex-1">
            {locationRequested ? 'Requesting location access...' : 'Location access required'}
          </p>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onRequestLocation}
            disabled={locationRequested}
            className="h-7 w-7 p-0 hover:bg-primary/10"
          >
            {locationRequested ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Display real location coordinates or address
  const displayLocation = userLocation.address || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`;
  
  return (
    <div className="flex items-center space-x-2 bg-primary/5 rounded-lg py-2 px-3 border border-primary/10">
      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
      <p className="text-xs text-primary/90">{displayLocation}</p>
    </div>
  );
};

export default LocationDisplay;