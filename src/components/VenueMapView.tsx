
import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Icon, LatLngBounds, DivIcon } from 'leaflet';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import VenueMarkerPopup from './VenueMarkerPopup';
import { AlertCircle, Home } from 'lucide-react';
import { RouteInfo } from '@/services/routingService';
import { VenueRouteData } from '@/hooks/useBatchRouteInfo';

interface VenueMapViewProps {
  recommendations: AIVenueRecommendation[];
  onSelectVenue: (venueId: string) => void;
  userLocation?: { latitude: number; longitude: number };
  height?: string;
  routeData?: Map<string, VenueRouteData>;
}

// Helper component to update map bounds
const MapBoundsUpdater = ({ bounds }: { bounds: LatLngBounds | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, bounds]);
  
  return null;
};

// Custom cluster icon creator
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let dimensions = 30;
  
  if (count >= 10) {
    size = 'large';
    dimensions = 50;
  } else if (count >= 5) {
    size = 'medium';
    dimensions = 40;
  }
  
  return new DivIcon({
    html: `<div class="venue-cluster-icon venue-cluster-icon-${size}">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [dimensions, dimensions],
    iconAnchor: [dimensions / 2, dimensions / 2]
  });
};

// Get marker color based on AI score
const getMarkerColor = (score: number): string => {
  if (score >= 85) return '#22c55e'; // green
  if (score >= 70) return '#3b82f6'; // blue
  if (score >= 55) return '#eab308'; // yellow
  return '#ef4444'; // red
};

const VenueMapView = ({ 
  recommendations, 
  onSelectVenue, 
  userLocation,
  height = '500px',
  routeData
}: VenueMapViewProps) => {
  // Filter venues with valid coordinates
  const venuesWithCoords = useMemo(() => 
    recommendations.filter(r => 
      r.latitude != null && 
      r.longitude != null && 
      !isNaN(r.latitude) && 
      !isNaN(r.longitude)
    ), 
    [recommendations]
  );
  
  const venuesWithoutCoords = recommendations.length - venuesWithCoords.length;
  
  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (venuesWithCoords.length === 0) return null;
    
    const latLngs = venuesWithCoords.map(v => [v.latitude!, v.longitude!] as [number, number]);
    
    // Include user location if available
    if (userLocation?.latitude && userLocation?.longitude) {
      latLngs.push([userLocation.latitude, userLocation.longitude]);
    }
    
    return new LatLngBounds(latLngs);
  }, [venuesWithCoords, userLocation]);
  
  // Default center (Hamburg) if no venues
  const defaultCenter: [number, number] = useMemo(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (venuesWithCoords.length > 0) {
      return [venuesWithCoords[0].latitude!, venuesWithCoords[0].longitude!];
    }
    return [53.5511, 9.9937]; // Hamburg
  }, [venuesWithCoords, userLocation]);

  // Custom venue marker icon
  const createVenueIcon = (score: number) => new DivIcon({
    html: `
      <div class="venue-marker" style="background-color: ${getMarkerColor(score)}">
        <span class="venue-marker-score">${Math.round(score)}</span>
      </div>
    `,
    className: 'custom-venue-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });

  // Home location icon
  const homeIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if (venuesWithCoords.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-muted/50 rounded-lg border border-border"
        style={{ height }}
      >
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-center">
          No venues with location data available.
          <br />
          <span className="text-sm">Try refreshing recommendations.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="rounded-lg overflow-hidden border border-border" 
        style={{ height }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBoundsUpdater bounds={bounds} />
          
          {/* User home location marker */}
          {userLocation?.latitude && userLocation?.longitude && (
            <Marker 
              position={[userLocation.latitude, userLocation.longitude]}
              icon={homeIcon}
            >
              <Popup>
                <div className="flex items-center gap-2 p-1">
                  <Home className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Your Location</span>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Venue markers with clustering */}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {venuesWithCoords.map((recommendation) => {
              const venueRoute = routeData?.get(recommendation.venue_id);
              return (
                <Marker
                  key={recommendation.venue_id}
                  position={[recommendation.latitude!, recommendation.longitude!]}
                  icon={createVenueIcon(recommendation.ai_score)}
                >
                  <Popup>
                    <VenueMarkerPopup 
                      recommendation={recommendation}
                      onSelect={onSelectVenue}
                      userLocation={userLocation}
                      preloadedRoute={venueRoute}
                    />
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
      
      {venuesWithoutCoords > 0 && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {venuesWithoutCoords} venue{venuesWithoutCoords > 1 ? 's' : ''} not shown (missing location data)
        </p>
      )}
    </div>
  );
};

export default VenueMapView;
