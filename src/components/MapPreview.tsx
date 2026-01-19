import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  address?: string;
  height?: string;
  zoom?: number;
}

const MapPreview = ({ 
  latitude, 
  longitude, 
  address,
  height = '200px',
  zoom = 13 
}: MapPreviewProps) => {
  const position: LatLngExpression = [latitude, longitude];
  
  // Fix for default marker icon issue in React Leaflet
  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="rounded-lg overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customIcon}>
          {address && (
            <Popup>
              <div className="text-sm font-medium">{address}</div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapPreview;
