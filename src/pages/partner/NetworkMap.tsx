import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DivIcon, LatLngBounds } from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, MapPin, Store, Handshake, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface PartnerVenue {
  venue_id: string;
  partner_id: string;
  venue_name: string;
  venue_address: string;
  latitude: number | null;
  longitude: number | null;
  cuisine_type: string | null;
  rating: number | null;
  partner_name: string | null;
  is_own: boolean;
}

const createPartnerMarkerIcon = (isOwn: boolean) => new DivIcon({
  html: `
    <div style="
      background: ${isOwn ? 'hsl(var(--primary))' : 'hsl(262, 83%, 58%)'};
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
        <path d="M9 9h.01"/><path d="M9 13h.01"/><path d="M9 17h.01"/>
      </svg>
    </div>
  `,
  className: 'custom-partner-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

export default function PartnerNetworkMap() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<PartnerVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== 'venue_partner' && role !== 'admin') {
      navigate('/partner');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    const fetchPartnerVenues = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch all approved partnerships with venue details
        const { data: partnerships, error } = await supabase
          .from('venue_partnerships')
          .select('venue_id, partner_id')
          .eq('status', 'approved');

        if (error) throw error;
        if (!partnerships?.length) {
          setVenues([]);
          setLoading(false);
          return;
        }

        // Fetch venue details
        const venueIds = [...new Set(partnerships.map(p => p.venue_id))];
        const { data: venueData } = await supabase
          .from('venues')
          .select('id, name, address, latitude, longitude, cuisine_type, rating')
          .in('id', venueIds);

        // Fetch partner names
        const partnerIds = [...new Set(partnerships.map(p => p.partner_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', partnerIds);

        const venueMap = new Map(venueData?.map(v => [v.id, v]) || []);
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

        const mapped: PartnerVenue[] = partnerships
          .map(p => {
            const venue = venueMap.get(p.venue_id);
            if (!venue) return null;
            return {
              venue_id: p.venue_id,
              partner_id: p.partner_id,
              venue_name: venue.name,
              venue_address: venue.address,
              latitude: venue.latitude,
              longitude: venue.longitude,
              cuisine_type: venue.cuisine_type,
              rating: venue.rating,
              partner_name: profileMap.get(p.partner_id) || null,
              is_own: p.partner_id === user.id,
            };
          })
          .filter((v): v is PartnerVenue => v !== null);

        setVenues(mapped);
      } catch (err) {
        console.error('Error fetching partner venues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerVenues();
  }, [user]);

  const venuesWithCoords = useMemo(
    () => venues.filter(v => v.latitude != null && v.longitude != null),
    [venues]
  );

  const bounds = useMemo(() => {
    if (venuesWithCoords.length === 0) return null;
    const latLngs = venuesWithCoords.map(v => [v.latitude!, v.longitude!] as [number, number]);
    return new LatLngBounds(latLngs);
  }, [venuesWithCoords]);

  const defaultCenter: [number, number] = useMemo(() => {
    if (venuesWithCoords.length > 0) {
      return [venuesWithCoords[0].latitude!, venuesWithCoords[0].longitude!];
    }
    return [53.5511, 9.9937]; // Hamburg
  }, [venuesWithCoords]);

  const otherPartnerCount = venues.filter(v => !v.is_own).length;

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/partner')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            {t('partner.network.mapTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('partner.network.mapDesc', { count: otherPartnerCount })}
          </p>
        </div>
        <Badge variant="default" className="text-xs">
          <Store className="w-3 h-3 mr-1" />
          {venuesWithCoords.length} Venues
        </Badge>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: '60vh', minHeight: '400px' }}>
        {venuesWithCoords.length > 0 ? (
          <MapContainer
            center={defaultCenter}
            zoom={12}
            bounds={bounds || undefined}
            boundsOptions={{ padding: [50, 50], maxZoom: 14 }}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {venuesWithCoords.map((venue) => (
              <Marker
                key={`${venue.venue_id}-${venue.partner_id}`}
                position={[venue.latitude!, venue.longitude!]}
                icon={createPartnerMarkerIcon(venue.is_own)}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold text-sm">{venue.venue_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      {venue.venue_address}
                    </p>
                    {venue.cuisine_type && (
                      <p className="text-xs text-muted-foreground mb-1">🍽️ {venue.cuisine_type}</p>
                    )}
                    {venue.rating && (
                      <p className="text-xs text-muted-foreground mb-2">⭐ {venue.rating}</p>
                    )}
                    {venue.partner_name && (
                      <div className="flex items-center gap-1 text-xs">
                        <Handshake className="w-3 h-3 text-primary" />
                        <span>{venue.is_own ? t('partner.network.you') : venue.partner_name}</span>
                      </div>
                    )}
                    {!venue.is_own && (
                      <Button
                        size="xs"
                        variant="soft"
                        className="w-full mt-2"
                        onClick={() => navigate('/partner/qr-code')}
                      >
                        <Handshake className="w-3 h-3 mr-1" />
                        {t('partner.network.connect')}
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted/50">
            <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              {t('partner.network.noPartners')}
            </p>
            <Button variant="soft" className="mt-4" onClick={() => navigate('/partner/venues')}>
              {t('partner.network.addVenue')}
            </Button>
          </div>
        )}
      </div>

      {/* Legend */}
      <Card variant="glass">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm" />
            <span className="text-muted-foreground">{t('partner.network.yourVenues')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: 'hsl(262, 83%, 58%)' }} />
            <span className="text-muted-foreground">{t('partner.network.otherPartners')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
