
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Star, MapPin, Clock, Phone, Heart, Sparkles, Globe, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { venueToAppVenue } from '@/utils/typeHelpers';
import { useVenueImplicitTracking } from '@/hooks/useImplicitSignals';
import { supabase } from '@/integrations/supabase/client';
import ShareDateButton from '@/components/ShareDateButton';
import type { ShareCardData } from '@/components/share/ShareCardGenerator';
import { useFavorites } from '@/hooks/useFavorites';
import { formatVenueAddress } from '@/utils/addressHelpers';
import VenueMenuSection from '@/components/venue/VenueMenuSection';

const VenueDetail = () => {
  const { id } = useParams();
  useVenueImplicitTracking(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { appState } = useApp();
  const [dbVenue, setDbVenue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolvedWebsite, setResolvedWebsite] = useState<string | null>(null);
  const [resolvedPhone, setResolvedPhone] = useState<string | null>(null);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const { isLiked, toggleLike } = useFavorites();

  const venue = appState.venues.find(v => v.id === id);

  useEffect(() => {
    if (!venue && id && !dbVenue) {
      setLoading(true);
      supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setDbVenue(data);
          } else {
            setNotFound(true);
          }
          setLoading(false);
        });
    }
  }, [id, venue, dbVenue]);

  const sourceVenue = venue || dbVenue;

  // Menu data lives in the DB – load it when the venue came from app state
  const [menuHighlights, setMenuHighlights] = useState<string[] | null>(null);
  const [menuUpdatedAt, setMenuUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    const fromSource = (sourceVenue as any)?.menu_highlights;
    const updatedFromSource = (sourceVenue as any)?.updated_at;
    if (fromSource) setMenuHighlights(fromSource);
    if (updatedFromSource) setMenuUpdatedAt(updatedFromSource);
    if (fromSource && updatedFromSource) return;
    if (!id) return;
    let cancelled = false;
    supabase
      .from('venues')
      .select('menu_highlights, updated_at')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        if (data.menu_highlights) setMenuHighlights(data.menu_highlights);
        if (data.updated_at) setMenuUpdatedAt(data.updated_at);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sourceVenue?.id]);

  // Reverse-geocode if address is missing/poor but we have coordinates
  useEffect(() => {
    if (!sourceVenue) return;
    const addr = sourceVenue.address || '';
    const hasGoodAddress = addr.length > 5 && !/^\d+\.\d+/.test(addr);
    const lat = sourceVenue.latitude;
    const lon = sourceVenue.longitude;
    
    if (!hasGoodAddress && lat && lon) {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`, {
        headers: { 'User-Agent': 'H!Outz/1.0' }
      })
        .then(r => r.json())
        .then(data => {
          const a = data.address || {};
          const street = [a.road || a.pedestrian || '', a.house_number || ''].filter(Boolean).join(' ');
          const city = [a.postcode || '', a.city || a.town || a.village || ''].filter(Boolean).join(' ');
          const resolved = [street, city].filter(Boolean).join(', ');
          if (resolved) setResolvedAddress(resolved);
        })
        .catch(() => {});
    }
  }, [sourceVenue]);

  // Resolve the real website via Google Places when none is stored
  useEffect(() => {
    if (!sourceVenue || sourceVenue.website || resolvedWebsite || websiteLoading) return;
    let cancelled = false;
    setWebsiteLoading(true);
    supabase.functions
      .invoke('resolve-venue-website', {
        body: {
          venueId: sourceVenue.id,
          placeId: sourceVenue.google_place_id || sourceVenue.placeId || null,
          name: sourceVenue.name,
          address: sourceVenue.address || '',
          latitude: sourceVenue.latitude,
          longitude: sourceVenue.longitude,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.website) setResolvedWebsite(data.website);
        if (data?.phone) setResolvedPhone(data.phone);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWebsiteLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceVenue?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="w-full h-64 rounded-xl" />
          <Skeleton className="w-3/4 h-8" />
          <Skeleton className="w-full h-20" />
        </div>
      </div>
    );
  }

  if (!sourceVenue) {
    if (notFound) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Venue nicht gefunden</p>
            <Button variant="outline" onClick={() => navigate(-1)}>Zurück</Button>
          </div>
        </div>
      );
    }
    return null;
  }

  // Convert to AppVenue format for UI
  const appVenue = venueToAppVenue(sourceVenue, appState.userLocation?.latitude, appState.userLocation?.longitude);
  // Use resolved address if available, otherwise format the existing one
  const displayAddress = resolvedAddress || formatVenueAddress(appVenue);
  const venueLiked = !!appVenue.id && isLiked(appVenue.id);

  const handleToggleFavorite = () => {
    if (!appVenue.id) return;
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 400);
    if (venueLiked) {
      toast.success(t('venue.removedFromFavorites'));
    } else {
      toast.success(t('venue.addedToFavorites'));
    }
    toggleLike(appVenue.id);
  };
  const websiteUrl = appVenue.website || resolvedWebsite;
  const phoneNumber = appVenue.phone || resolvedPhone;

  const shareCardData: ShareCardData = {
    type: 'venue',
    venueName: appVenue.name,
    venueImage: appVenue.image_url || appVenue.image,
    rating: appVenue.rating,
    address: displayAddress,
    tags: appVenue.tags,
    matchScore: appVenue.matchScore,
  };

  // Google Maps entry for this venue — used as fallback when no website is stored
  const googleMapsUrl = appVenue.placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [appVenue.name, displayAddress].filter(Boolean).join(', ')
      )}&query_place_id=${appVenue.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [appVenue.name, displayAddress].filter(Boolean).join(', ')
      )}`;

  const handleDirections = () => {
    // Always use venue name + address as destination for accuracy
    const destination = encodeURIComponent(
      [appVenue.name, displayAddress].filter(Boolean).join(', ')
    );

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${destination}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  };

  const callVenue = () => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const visitWebsite = () => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank');
      return;
    }
    // Fallback: no stored website → open the venue's Google Maps entry,
    // which always lists the official site / contact details.
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header Image */}
        <div className="relative">
          <img
            src={appVenue.image_url || `https://source.unsplash.com/800x400/?restaurant,${encodeURIComponent(appVenue.name)}`}
            alt={appVenue.name}
            className="w-full h-64 object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Header Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <button
              onClick={() => navigate(-1)}
              aria-label="Zurück"
              className="h-11 w-11 rounded-full backdrop-blur-md bg-black/30 border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <ShareDateButton
                title={appVenue.name}
                venueName={appVenue.name}
                url={`${window.location.origin}/venue/${appVenue.id}`}
                shareCardData={shareCardData}
                variant="compact"
                className="!h-11 !w-11 !rounded-full !bg-black/30 !backdrop-blur-md !border !border-white/20 !text-white hover:!bg-black/50 hover:!scale-105 active:!scale-95 transition-all duration-300"
              />
              <button
                onClick={() => handleToggleFavorite()}
                aria-label={venueLiked ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                className={cn(
                  'h-11 w-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95',
                  venueLiked
                    ? 'bg-pink-500/90 border-pink-300/40 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-black/30 border-white/20 text-white hover:bg-black/50'
                )}
              >
                <Heart
                  className={cn(
                    'w-5 h-5 transition-colors',
                    venueLiked && 'fill-current',
                    heartAnimating && 'animate-[heart-bounce_400ms_ease-in-out]'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Match Score */}
          {appVenue.matchScore > 0 && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-primary text-primary-foreground font-semibold text-base px-3 py-1">
                <Sparkles className="w-4 h-4 mr-2" />
                {appVenue.matchScore}% Perfect Match
              </Badge>
            </div>
          )}

          {/* Open Status */}
          {appVenue.isOpen !== undefined && (
            <div className="absolute bottom-4 right-4">
            <Badge className={appVenue.isOpen ? "bg-emerald-500 dark:bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"}>
              {appVenue.isOpen ? "Open Now" : "Closed"}
            </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Basic Info */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 mb-4">
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-2xl font-bold text-foreground">{appVenue.name}</h1>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold">{appVenue.rating || 4.5}</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">{appVenue.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{displayAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">{appVenue.price_range || '$$'}</span>
                {appVenue.distance && (
                  <span className="text-xs">• {appVenue.distance}</span>
                )}
              </div>
            </div>

            {appVenue.discount && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-500">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">{appVenue.discount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {appVenue.tags && appVenue.tags.length > 0 && (
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 mb-4">
              <h3 className="font-semibold text-foreground mb-3">Perfect For</h3>
              <div className="flex flex-wrap gap-2">
                {appVenue.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Menu (food & drink venues only) */}
          <VenueMenuSection
            venueId={appVenue.id}
            lastUpdated={(sourceVenue as any)?.updated_at}
            venue={{
              name: appVenue.name,
              description: appVenue.description,
              cuisine_type: appVenue.cuisine_type,
              tags: appVenue.tags,
              venue_type: (sourceVenue as any)?.venue_type,
            }}
            menuHighlights={menuHighlights}
            menuUrl={(sourceVenue as any)?.menu_url}
            websiteUrl={websiteUrl}
            googleMapsUrl={googleMapsUrl}
          />

          {/* Contact Info & Hours */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 mb-4">
            <h3 className="font-semibold text-foreground mb-4">Contact & Hours</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{displayAddress}</span>
              </div>
              {phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                {websiteLoading && !websiteUrl ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <a
                    href={websiteUrl || googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {websiteUrl ? t('venue.visitWebsite') : t('venue.viewOnGoogleMaps')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {appVenue.openingHours && appVenue.openingHours.length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="text-muted-foreground">
                    <div className="font-medium mb-1">Hours:</div>
                    {appVenue.openingHours.slice(0, 3).map((hours, index) => (
                      <div key={index} className="text-sm">{hours}</div>
                    ))}
                    {appVenue.openingHours.length > 3 && (
                      <div className="text-sm text-muted-foreground">+ {appVenue.openingHours.length - 3} {t('venue.moreHours', { count: appVenue.openingHours.length - 3 })}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12"
                onClick={handleDirections}
              >
                {t('venue.getDirections')}
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={visitWebsite}
                disabled={websiteLoading && !websiteUrl}
              >
                {websiteLoading && !websiteUrl
                  ? '…'
                  : websiteUrl
                    ? t('venue.visitWebsite')
                    : t('venue.viewOnGoogleMaps')}
              </Button>
            </div>
            {phoneNumber && (
              <Button
                variant="outline"
                className="h-12 w-full"
                onClick={callVenue}
              >
                {t('venue.callNow')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
