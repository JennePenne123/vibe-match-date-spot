
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Star, MapPin, DollarSign, Clock, Phone, Heart, Sparkles, Globe, ExternalLink } from 'lucide-react';
import { venueToAppVenue } from '@/utils/typeHelpers';
import { useVenueImplicitTracking } from '@/hooks/useImplicitSignals';
import { supabase } from '@/integrations/supabase/client';
import ShareDateButton from '@/components/ShareDateButton';
import type { ShareCardData } from '@/components/share/ShareCardGenerator';

const VenueDetail = () => {
  const { id } = useParams();
  useVenueImplicitTracking(id);
  const navigate = useNavigate();
  const { appState } = useApp();
  const [dbVenue, setDbVenue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

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

  const sourceVenue = venue || dbVenue;

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

  const shareCardData: ShareCardData = {
    type: 'venue',
    venueName: appVenue.name,
    venueImage: appVenue.image_url || appVenue.image,
    rating: appVenue.rating,
    address: appVenue.address,
    tags: appVenue.tags,
    matchScore: appVenue.matchScore,
  };

  const openDirections = () => {
    if (appVenue.google_place_id) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${appVenue.google_place_id}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appVenue.name + ' ' + appVenue.address)}`, '_blank');
    }
  };

  const callVenue = () => {
    if (appVenue.phone) {
      window.open(`tel:${appVenue.phone}`);
    }
  };

  const visitWebsite = () => {
    if (appVenue.website) {
      window.open(appVenue.website, '_blank');
    }
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
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex gap-2">
              <ShareDateButton
                title={appVenue.name}
                venueName={appVenue.name}
                url={`${window.location.origin}/venue/${appVenue.id}`}
                shareCardData={shareCardData}
                variant="compact"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              />
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              >
                <Heart className="w-6 h-6" />
              </Button>
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
                <MapPin className="w-4 h-4" />
                {appVenue.distance || appVenue.address}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                {appVenue.price_range || '$$'}
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

          {/* Contact Info & Hours */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 mb-4">
            <h3 className="font-semibold text-foreground mb-4">Contact & Hours</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{appVenue.address}</span>
              </div>
              {appVenue.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{appVenue.phone}</span>
                </div>
              )}
              {appVenue.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <a 
                    href={appVenue.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {appVenue.openingHours && appVenue.openingHours.length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="text-muted-foreground">
                    <div className="font-medium mb-1">Hours:</div>
                    {appVenue.openingHours.slice(0, 3).map((hours, index) => (
                      <div key={index} className="text-sm">{hours}</div>
                    ))}
                    {appVenue.openingHours.length > 3 && (
                      <div className="text-sm text-muted-foreground">+ {appVenue.openingHours.length - 3} more</div>
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
                onClick={openDirections}
              >
                Get Directions
              </Button>
              <Button 
                variant="outline" 
                className="h-12"
                onClick={appVenue.phone ? callVenue : visitWebsite}
              >
                {appVenue.phone ? 'Call Now' : 'Visit Website'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
