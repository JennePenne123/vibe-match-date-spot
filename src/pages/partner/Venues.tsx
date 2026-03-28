import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Phone, Globe, Plus, Settings, List, Map as MapIcon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { VenueManagementSheet } from '@/components/partner/VenueManagementSheet';
import VenueRegistrationModal from '@/components/partner/VenueRegistrationModal';
import { usePartnerVerificationGuard } from '@/hooks/usePartnerVerificationGuard';
import VerificationLockOverlay from '@/components/partner/VerificationLockOverlay';

interface Partnership {
  id: string;
  status: string;
  created_at: string;
  venue_id: string;
  venues: {
    name: string;
    address: string;
    cuisine_type: string;
    phone: string;
    website: string;
    rating: number;
    latitude: number | null;
    longitude: number | null;
  };
}

export default function PartnerVenues() {
  const { t } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingVenue, setManagingVenue] = useState<{ id: string; name: string } | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const { isLocked } = usePartnerVerificationGuard();
  const isPageLoading = roleLoading || authLoading;

  useEffect(() => {
    if (!isPageLoading && !user) {
      navigate('/?auth=partner', { replace: true });
      return;
    }

    if (!isPageLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isPageLoading, user, navigate]);

  useEffect(() => {
    if (!user?.id) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    void fetchPartnerships(user.id);
  }, [user?.id, authLoading]);

  const fetchPartnerships = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('venue_partnerships')
        .select('*, venues(name, address, cuisine_type, phone, website, rating, latitude, longitude)')
        .eq('partner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerships(data || []);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      toast({ title: 'Error', description: 'Failed to load venues', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (isPageLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>;
  }

  const activePartnerships = partnerships.filter(p => p.status === 'approved' || p.status === 'active');
  const pendingPartnerships = partnerships.filter(p => p.status === 'pending');

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved': case 'active': return t('partner.venues.statusActive', 'Aktiv');
      case 'pending': return t('partner.venues.statusPending', 'Ausstehend');
      default: return status;
    }
  };

  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved': case 'active': return 'default';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {isLocked && <VerificationLockOverlay feature="Standortverwaltung" />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            {t('partner.venues.title', 'Meine Standorte')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('partner.venues.subtitle', `${partnerships.length} Standort${partnerships.length !== 1 ? 'e' : ''} verwalten`)}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowRegistration(true)}>
          <Plus className="w-4 h-4" />
          {t('partner.venues.addVenue', 'Standort hinzufügen')}
        </Button>
      </div>

      {/* Summary badges */}
      {partnerships.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="default" className="text-xs">
            {activePartnerships.length} {t('partner.venues.active', 'Aktiv')}
          </Badge>
          {pendingPartnerships.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingPartnerships.length} {t('partner.venues.pending', 'Ausstehend')}
            </Badge>
          )}
        </div>
      )}

      {partnerships.length === 0 ? (
        <Card variant="elegant" className="text-center py-12">
          <CardContent>
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{t('partner.venues.empty', 'Noch keine Standorte')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('partner.venues.emptyDesc', 'Füge deinen ersten Standort hinzu, um Gutscheine zu erstellen')}
            </p>
            <Button className="gap-2" onClick={() => setShowRegistration(true)}>
              <Plus className="w-4 h-4" />
              {t('partner.venues.addFirst', 'Ersten Standort hinzufügen')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
            <TabsTrigger value="list" className="gap-1.5 text-xs">
              <List className="w-3.5 h-3.5" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5 text-xs">
              <MapIcon className="w-3.5 h-3.5" />
              Karte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partnerships.map((partnership) => (
                <Card key={partnership.id} variant="glass" className="hover:scale-[1.02] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{partnership.venues.name}</CardTitle>
                        <Badge variant={statusVariant(partnership.status)} className="mt-1.5 text-[11px]">
                          {statusLabel(partnership.status)}
                        </Badge>
                      </div>
                      {partnership.venues.rating && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold">{partnership.venues.rating}</div>
                          <div className="text-[10px] text-muted-foreground">Rating</div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground text-xs">{partnership.venues.address}</span>
                    </div>

                    {partnership.venues.cuisine_type && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[11px]">{partnership.venues.cuisine_type}</Badge>
                      </div>
                    )}

                    {partnership.venues.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{partnership.venues.phone}</span>
                      </div>
                    )}

                    {partnership.venues.website && (
                      <div className="flex items-center gap-2 text-xs">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <a href={partnership.venues.website} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline truncate">{partnership.venues.website}</a>
                      </div>
                    )}

                    {(partnership.status === 'active' || partnership.status === 'approved') && (
                      <Button
                        className="w-full mt-2 gap-2"
                        variant="outline"
                        size="sm"
                        onClick={() => setManagingVenue({ id: partnership.venue_id, name: partnership.venues.name })}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        {t('partner.venues.manage', 'Verwalten')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <PartnerVenueMap partnerships={partnerships} />
          </TabsContent>
        </Tabs>
      )}

      {managingVenue && (
        <VenueManagementSheet
          open={!!managingVenue}
          onOpenChange={(open) => !open && setManagingVenue(null)}
          venueId={managingVenue.id}
          venueName={managingVenue.name}
          onUpdated={() => {
            if (user?.id) {
              void fetchPartnerships(user.id);
            }
          }}
        />
      )}

      <VenueRegistrationModal
        open={showRegistration}
        onOpenChange={setShowRegistration}
        onSuccess={() => {
          if (user?.id) {
            void fetchPartnerships(user.id);
          }
        }}
      />
    </div>
  );
}

// Inline map component for partner venues
function PartnerVenueMap({ partnerships }: { partnerships: Partnership[] }) {
  const { t } = useTranslation();
  const venuesWithCoords = partnerships.filter(p => p.venues.latitude && p.venues.longitude);

  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [MarkerComp, setMarkerComp] = useState<any>(null);
  const [PopupComp, setPopupComp] = useState<any>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setMapContainer(() => mod.MapContainer);
      setTileLayer(() => mod.TileLayer);
      setMarkerComp(() => mod.Marker);
      setPopupComp(() => mod.Popup);
    });
  }, []);

  if (venuesWithCoords.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MapIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('partner.venues.noCoords', 'Keine Venues mit Koordinaten gefunden. Füge Adressen mit Geodaten hinzu.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!MapContainer) return <div className="h-[400px] rounded-xl bg-muted animate-pulse" />;

  const center: [number, number] = [
    venuesWithCoords.reduce((sum, p) => sum + (p.venues.latitude || 0), 0) / venuesWithCoords.length,
    venuesWithCoords.reduce((sum, p) => sum + (p.venues.longitude || 0), 0) / venuesWithCoords.length,
  ];

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-border/40">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {venuesWithCoords.map((p) => (
          <MarkerComp key={p.id} position={[p.venues.latitude!, p.venues.longitude!]}>
            <PopupComp>
              <div className="text-sm">
                <p className="font-semibold">{p.venues.name}</p>
                <p className="text-xs text-muted-foreground">{p.venues.address}</p>
                {p.venues.cuisine_type && <p className="text-xs mt-1">{p.venues.cuisine_type}</p>}
              </div>
            </PopupComp>
          </MarkerComp>
        ))}
      </MapContainer>
    </div>
  );
}
