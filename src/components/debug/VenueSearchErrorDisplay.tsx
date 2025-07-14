import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenueSearchErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  showLocationTip?: boolean;
}

export const VenueSearchErrorDisplay: React.FC<VenueSearchErrorDisplayProps> = ({
  error,
  onRetry,
  showLocationTip = true
}) => {
  const isLocationError = error.toLowerCase().includes('location');
  const isNetworkError = error.toLowerCase().includes('network') || error.toLowerCase().includes('timeout');
  const isNoVenuesError = error.toLowerCase().includes('no venues found');

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {isLocationError ? 'Location Issue' : 
           isNetworkError ? 'Connection Problem' :
           isNoVenuesError ? 'No Venues Found' :
           'Search Error'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {error}
        </AlertDescription>
      </Alert>

      {showLocationTip && isLocationError && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertTitle>Location Tip</AlertTitle>
          <AlertDescription>
            Make sure you've enabled location permissions for this website and try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {isNetworkError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Network Issue</AlertTitle>
          <AlertDescription>
            There seems to be a connection problem. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      )}

      {isNoVenuesError && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No venues were found in your area that match your preferences. Try expanding your search radius or adjusting your preferences.
          </AlertDescription>
        </Alert>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};